<?php
// /api/user/transactions.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
session_start();

if (empty($_SESSION['user']['id'])) {
  http_response_code(401);
  echo json_encode([]); exit;
}
$userId = (int)$_SESSION['user']['id'];

require __DIR__ . '/../db.php';

// Returnăm doar retragerile (pending + approved). Extinde ușor dacă vrei și depozite.
$sql = "SELECT id, amount_cents, fee_cents, status, method, created_at
        FROM withdrawal_requests
        WHERE user_id=:u
        ORDER BY created_at DESC, id DESC
        LIMIT 500";
$st = $pdo->prepare($sql);
$st->execute([':u'=>$userId]);
$rows = $st->fetchAll(PDO::FETCH_ASSOC);

$out = [];
foreach ($rows as $r) {
  $type = (strtolower($r['status'])==='approved') ? 'WITHDRAWAL' : 'WITHDRAWAL_REQUEST';
  $out[] = [
    'id'     => 'W'.$r['id'],
    'date'   => substr($r['created_at'], 0, 10),
    'type'   => $type,
    'status' => strtoupper($r['status']),
    'method' => $r['method'],
    'amount' => round(((int)$r['amount_cents'])/100, 2)
  ];
}
echo json_encode($out, JSON_UNESCAPED_UNICODE);
