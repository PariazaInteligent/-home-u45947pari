<?php
// /api/user/recent_transactions.php
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
  $txs = [];

  // 1. INVESTIȚII (Depuneri)
  $stmt = $pdo->prepare("
    SELECT 
      created_at, 
      amount_cents, 
      'deposit' as type 
    FROM investments 
    WHERE user_id = ? AND status = 'succeeded'
    ORDER BY created_at DESC LIMIT 20
  ");
  $stmt->execute([$uid]);
  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $txs[] = [
      'date' => $row['created_at'],
      'amount' => (float) ($row['amount_cents'] / 100),
      'type' => 'deposit',
      'details' => ''
    ];
  }

  // 2. RETRAGERI (approved + pending)
  $stmt = $pdo->prepare("
    SELECT 
      created_at, 
      (amount_cents + fee_cents) as total_cents, 
      status,
      'withdraw' as type 
    FROM withdrawal_requests 
    WHERE user_id = ? AND status IN ('approved', 'pending')
    ORDER BY created_at DESC LIMIT 20
  ");
  $stmt->execute([$uid]);
  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $txs[] = [
      'date' => $row['created_at'],
      'amount' => (float) ($row['total_cents'] / 100),
      'type' => 'withdraw',
      'status' => $row['status'],
      'details' => ''
    ];
  }

  // 3. PROFIT / PIERDERE (din distribuții)
  // Facem JOIN cu bet_groups pentru a lua detaliile evenimentului
  $stmt = $pdo->prepare("
    SELECT 
      pd.created_at, 
      pd.amount_cents, 
      bg.event,
      bg.selection_name
    FROM profit_distributions pd
    LEFT JOIN bet_groups bg ON pd.bet_group_id = bg.id
    WHERE pd.user_id = ?
    ORDER BY pd.created_at DESC LIMIT 50
  ");
  $stmt->execute([$uid]);
  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $amt = (float) ($row['amount_cents'] / 100);
    $finalType = $amt >= 0 ? 'profit' : 'pierdere';

    // Construim o descriere scurtă (ex: "Romania - Italia")
    $details = $row['event'] ?? '';

    $txs[] = [
      'date' => $row['created_at'],
      'amount' => abs($amt),
      'type' => $finalType,
      'details' => $details
    ];
  }

  // 4. Sortare descrescătoare după dată
  usort($txs, function ($a, $b) {
    return $b['date'] <=> $a['date'];
  });

  // 5. Limităm la ultimele 50
  $txs = array_slice($txs, 0, 50);

  echo json_encode(['ok' => true, 'items' => $txs]);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => 'db_error',
    'hint' => $e->getMessage(),
  ]);
}
