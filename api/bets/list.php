<?php
// /api/bets/list.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
session_start();
require __DIR__ . '/config.php';
$pdo = require_db();

// cine e userul curent
$me   = $_SESSION['user'] ?? null;
$uid  = isset($me['id']) ? (int)$me['id'] : 0;
$role = strtoupper($me['role'] ?? 'GUEST');

// input din query string
$range  = strtolower($_GET['range'] ?? '30d');
$q      = trim((string)($_GET['q'] ?? ''));
$status = strtolower(trim((string)($_GET['status'] ?? 'all'))); // all|pending|settled|won|lost|void|half_won|half_lost
$order  = ($_GET['order'] ?? 'newest') === 'oldest' ? 'ASC' : 'DESC';

// facem intervalul de timp
$now  = new DateTimeImmutable('now');
$from = null;
$to   = $now;

switch ($range) {
  case 'today':
    $from = new DateTimeImmutable('today');
    break;
  case '7d':
    $from = $now->modify('-7 days')->setTime(0,0,0);
    break;
  case '30d':
    $from = $now->modify('-30 days')->setTime(0,0,0);
    break;
  case 'all':
    $from = null;
    break;
  default:
    $from = null;
    break;
}

// baza SELECT-ului
$sql = "
  SELECT
    g.*,
    (SELECT COUNT(*) FROM bet_allocations a WHERE a.bet_group_id = g.id) AS allocs,
    CASE WHEN p.user_id IS NULL THEN 0 ELSE 1 END AS pinned_flag
  FROM bet_groups g
  LEFT JOIN user_bet_pins p
    ON p.bet_group_id = g.id
   AND p.user_id      = :uid
  WHERE 1=1
";

$args = [
  ':uid' => $uid,
];

// filtre dinamice
if ($from) {
  $sql .= " AND g.event_at >= :f AND g.event_at < :t";
  $args[':f'] = $from->format('Y-m-d H:i:s');
  $args[':t'] = $to->format('Y-m-d H:i:s');
}

if ($q !== '') {
  $sql .= " AND (g.event LIKE :q OR g.selection_name LIKE :q OR g.league_name LIKE :q)";
  $args[':q'] = "%$q%";
}

if ($status === 'pending') {
  $sql .= " AND g.status='pending'";
} elseif ($status === 'settled') {
  $sql .= " AND g.status<>'pending'";
} elseif (in_array($status, ['won','lost','void','half_won','half_lost'], true)) {
  $sql .= " AND g.status=:st";
  $args[':st'] = $status;
}

// sortare + limit
$sql .= " ORDER BY g.event_at $order, g.id $order LIMIT 300";

// executăm query
$stmt = $pdo->prepare($sql);
$stmt->execute($args);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// mapăm în payloadul pe care îl așteaptă frontendul
$out = array_map(function($r){
  return [
    'id'              => (int)$r['id'],
    'group_uid'       => $r['group_uid'],
    'event'           => $r['event'],
    'sport'           => $r['sport'],
    'league'          => $r['league_name'],
    'selection'       => $r['selection_name'],
    'odds'            => (float)$r['odds'],
    'stake_eur'       => ((int)$r['stake_cents'])/100,
    'currency'        => $r['currency'],
    'event_at'        => $r['event_at'],
    'status'          => $r['status'],
    'score'           => $r['score'],
    'profit_net_eur'  => isset($r['profit_net_cents']) ? ((int)$r['profit_net_cents'])/100 : null,
    'allocations'     => (int)$r['allocs'],
    'notes'           => $r['notes'],
    // nou: pinned pentru userul curent
    'pinned'          => ((string)$r['pinned_flag'] === '1'),
  ];
}, $rows);

// trimitem răspuns ok
echo json_encode(['ok'=>true, 'items'=>$out], JSON_UNESCAPED_UNICODE);
