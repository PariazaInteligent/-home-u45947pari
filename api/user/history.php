<?php
// /api/user/history.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

session_start();
require __DIR__ . '/../db.php';

$me = $_SESSION['user'] ?? null;
$uid = (int) ($me['id'] ?? 0);

if (!$uid) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}

try {
  // Încercăm să folosim tabelul user_daily_history dacă există și este populat
  $stmt = $pdo->prepare("
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = 'user_daily_history'
  ");
  $stmt->execute();
  $tableExists = (int) $stmt->fetchColumn() > 0;

  $hasData = false;
  if ($tableExists) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_daily_history WHERE user_id = ?");
    $stmt->execute([$uid]);
    $hasData = (int) $stmt->fetchColumn() > 0;
  }

  // Dacă tabelul există și are date, îl folosim
  if ($tableExists && $hasData) {
    $stmt = $pdo->prepare("
      SELECT
        day,
        profit_delta_eur,
        profit_cum_eur,
        deposit_eur,
        withdraw_eur,
        balance_eur
      FROM user_daily_history
      WHERE user_id = ?
      ORDER BY day ASC
    ");
    $stmt->execute([$uid]);

    $items = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
      $items[] = [
        'date' => $row['day'],
        'profit_delta_eur' => isset($row['profit_delta_eur']) ? (float) $row['profit_delta_eur'] : 0.0,
        'profit_cum_eur' => isset($row['profit_cum_eur']) ? (float) $row['profit_cum_eur'] : 0.0,
        'deposit_eur' => isset($row['deposit_eur']) ? (float) $row['deposit_eur'] : 0.0,
        'withdraw_eur' => isset($row['withdraw_eur']) ? (float) $row['withdraw_eur'] : 0.0,
        'balance_eur' => isset($row['balance_eur']) ? (float) $row['balance_eur'] : 0.0,
      ];
    }

    echo json_encode(['ok' => true, 'items' => $items]);
    exit;
  }

  // Altfel, generăm datele din investments și profit_distributions
  // Luăm toate investițiile reușite
  $stmt = $pdo->prepare("
    SELECT 
      DATE(created_at) as day,
      SUM(amount_cents) as total_cents
    FROM investments
    WHERE user_id = ? AND status = 'succeeded'
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  ");
  $stmt->execute([$uid]);
  $investments = [];
  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $investments[$row['day']] = (float) ($row['total_cents'] / 100);
  }

  // Luăm toate profiturile distribuite
  $stmt = $pdo->prepare("
    SELECT 
      DATE(created_at) as day,
      SUM(amount_cents) as total_cents
    FROM profit_distributions
    WHERE user_id = ?
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  ");
  $stmt->execute([$uid]);
  $profits = [];
  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $profits[$row['day']] = (float) ($row['total_cents'] / 100);
  }

  // Luăm retragerile care afectează soldul disponibil (approved + pending)
  // Folosim created_at pentru a reflecta momentul când banii au devenit indisponibili (blocați)
  $stmt = $pdo->prepare("
    SELECT 
      DATE(created_at) as day,
      SUM(amount_cents + fee_cents) as total_cents
    FROM withdrawal_requests
    WHERE user_id = ? AND status IN ('approved', 'pending')
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  ");
  $stmt->execute([$uid]);
  $withdrawals = [];
  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $withdrawals[$row['day']] = (float) ($row['total_cents'] / 100);
  }

  // Construim istoricul zilnic
  $allDays = array_unique(array_merge(
    array_keys($investments),
    array_keys($profits),
    array_keys($withdrawals)
  ));
  sort($allDays);

  $items = [];
  $cumulativeProfit = 0.0;
  $cumulativeInvested = 0.0;
  $cumulativeWithdrawn = 0.0;

  foreach ($allDays as $day) {
    $depositToday = $investments[$day] ?? 0.0;
    $profitToday = $profits[$day] ?? 0.0;
    $withdrawToday = $withdrawals[$day] ?? 0.0;

    $cumulativeInvested += $depositToday;
    $cumulativeProfit += $profitToday;
    $cumulativeWithdrawn += $withdrawToday;

    $balance = $cumulativeInvested + $cumulativeProfit - $cumulativeWithdrawn;

    $items[] = [
      'date' => $day,
      'profit_delta_eur' => $profitToday,
      'profit_cum_eur' => $cumulativeProfit,
      'deposit_eur' => $depositToday,
      'withdraw_eur' => $withdrawToday,
      'balance_eur' => max(0, $balance),
    ];
  }

  echo json_encode(['ok' => true, 'items' => $items]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => 'db_error',
    'hint' => $e->getMessage(),
  ]);
}
