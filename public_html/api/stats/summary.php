<?php
// /api/stats/summary.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=UTF-8');

if (empty($_SESSION['user']['id'])) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit;
}

require __DIR__ . '/../db.php';
$userId = (int)$_SESSION['user']['id'];
$range  = strtolower(trim($_GET['range'] ?? '30d'));

function range_bounds(string $range): array {
  $now = new DateTimeImmutable('now');
  switch ($range) {
    case 'today':
      $start = (new DateTimeImmutable('today'));
      $end   = $start->modify('+1 day');
      break;
    case '24h':
      $end   = $now;
      $start = $end->modify('-24 hours');
      break;
    case '7d':
      $end   = $now;
      $start = (new DateTimeImmutable('today'))->modify('-6 days');
      break;
    case '30d':
      $end   = $now;
      $start = (new DateTimeImmutable('today'))->modify('-29 days');
      break;
    case 'mtd':
      $start = (new DateTimeImmutable('first day of this month 00:00:00'));
      $end   = (new DateTimeImmutable('first day of next month 00:00:00'));
      break;
    case 'qtd':
      $m = (int)(new DateTimeImmutable())->format('n');
      $qm = $m - (($m-1)%3);
      $start = new DateTimeImmutable(date('Y').'-'.sprintf('%02d',$qm).'-01 00:00:00');
      $end   = (new DateTimeImmutable($start->format('Y-m-d H:i:s')))->modify('+3 months');
      break;
    case 'ytd':
      $start = new DateTimeImmutable(date('Y').'-01-01 00:00:00');
      $end   = (new DateTimeImmutable(date('Y').'-12-31 23:59:59'))->modify('+1 second');
      break;
    case 'all':
      return [null, null];
    default:
      $end   = $now;
      $start = (new DateTimeImmutable('today'))->modify('-29 days');
  }
  return [$start, $end];
}

try {
  [$start, $end] = range_bounds($range);

  if ($start && $end) {
    $stmt = $pdo->prepare("
      SELECT COALESCE(SUM(amount_cents),0) AS s
      FROM payments
      WHERE user_id = ? AND status='succeeded' AND created_at >= ? AND created_at < ?
    ");
    $stmt->execute([$userId, $start->format('Y-m-d H:i:s'), $end->format('Y-m-d H:i:s')]);
  } else {
    $stmt = $pdo->prepare("
      SELECT COALESCE(SUM(amount_cents),0) AS s
      FROM payments
      WHERE user_id = ? AND status='succeeded'
    ");
    $stmt->execute([$userId]);
  }
  $cents = (int)$stmt->fetchColumn();
  echo json_encode([
    'ok' => true,
    'invested' => round($cents / 100, 2),
    'currency' => 'EUR',
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server']);
}
