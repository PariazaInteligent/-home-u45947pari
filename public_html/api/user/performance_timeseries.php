<?php
// /api/user/performance_timeseries.php
// Returnează seriile reale (profit cumulat + sold) pentru graficele din dashboardul investitorului.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

session_start();
if (empty($_SESSION['user']['id'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}
$userId = (int)$_SESSION['user']['id'];

require __DIR__ . '/../db.php'; // $pdo

function resolve_range(string $range): array {
  $r = strtolower(trim($range));
  if ($r !== 'today') {
    return ['from' => null, 'to' => null];
  }

  $from = (new DateTimeImmutable('today'))->setTime(0,0,0);
  $to   = $from->modify('+1 day');
  return [
    'from' => $from->format('Y-m-d H:i:s'),
    'to'   => $to->format('Y-m-d H:i:s'),
  ];
}

function date_filters(array $range): array {
  $where  = '';
  $params = [];
  if ($range['from'] !== null) { $where .= ' AND created_at >= :from'; $params[':from'] = $range['from']; }
  if ($range['to']   !== null) { $where .= ' AND created_at <  :to';   $params[':to']   = $range['to']; }
  return [$where, $params];
}

function grouped_sum(PDO $pdo, string $sql, array $params): array {
  $st = $pdo->prepare($sql);
  $st->execute($params);
  $rows = $st->fetchAll(PDO::FETCH_ASSOC);

  $out = [];
  foreach ($rows as $r) {
    $date = (string)($r['d'] ?? '');
    if ($date === '') continue;
    $out[$date] = (int)$r['amt'];
  }
  return $out;
}

try {
  $range = resolve_range($_GET['range'] ?? 'all');
  [$dateWhere, $dateParams] = date_filters($range);

  $inv = grouped_sum(
    $pdo,
    "SELECT DATE(created_at) AS d, SUM(amount_cents) AS amt
     FROM investments
     WHERE user_id=:uid AND status='succeeded' {$dateWhere}
     GROUP BY DATE(created_at)
     ORDER BY d ASC",
    [':uid' => $userId, ...$dateParams]
  );

  $pnl = grouped_sum(
    $pdo,
    "SELECT DATE(created_at) AS d, SUM(amount_cents) AS amt
     FROM profit_distributions
     WHERE user_id=:uid {$dateWhere}
     GROUP BY DATE(created_at)
     ORDER BY d ASC",
    [':uid' => $userId, ...$dateParams]
  );

  $wd = grouped_sum(
    $pdo,
    "SELECT DATE(created_at) AS d, SUM(amount_cents + fee_cents) AS amt
     FROM withdrawal_requests
     WHERE user_id=:uid AND status='APPROVED' {$dateWhere}
     GROUP BY DATE(created_at)
     ORDER BY d ASC",
    [':uid' => $userId, ...$dateParams]
  );

  $days = [];
  foreach ($inv as $d => $amt) { $days[$d]['deposit']  = $amt; }
  foreach ($pnl as $d => $amt) { $days[$d]['profit']   = $amt; }
  foreach ($wd  as $d => $amt) { $days[$d]['withdraw'] = $amt; }
  ksort($days);

  $cumProfit = 0;
  $balance   = 0;
  $points    = [];
  foreach ($days as $d => $vals) {
    $dep  = (int)($vals['deposit']  ?? 0);
    $pr   = (int)($vals['profit']   ?? 0);
    $wdv  = (int)($vals['withdraw'] ?? 0);

    $cumProfit += $pr;
    $balance   += $dep + $pr - $wdv;

    $points[] = [
      'date'                => $d,
      'profit_cents'        => $cumProfit,
      'profit_delta_cents'  => $pr,
      'balance_cents'       => $balance,
      'deposit_cents'       => $dep,
      'withdraw_cents'      => $wdv,
    ];
  }

  echo json_encode(['ok' => true, 'points' => $points], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'internal_error']);
}