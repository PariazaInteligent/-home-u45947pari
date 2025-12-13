<?php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$me = $_SESSION['user'] ?? null;
if (!$me) { echo json_encode(['ok'=>false,'error'=>'AUTH']); http_response_code(401); exit; }

require __DIR__ . '/../db.php'; // $pdo

function current_user_id(PDO $pdo): ?string {
  $sess = $_SESSION['user'] ?? [];
  if (!empty($sess['id'])) return (string)$sess['id'];
  if (!empty($sess['email'])) {
    $st = $pdo->prepare('SELECT id FROM users WHERE email=? LIMIT 1');
    $st->execute([$sess['email']]);
    $id = $st->fetchColumn();
    return $id !== false ? (string)$id : null;
  }
  return null;
}

$uid = current_user_id($pdo);
if (!$uid) { echo json_encode(['ok'=>false,'error'=>'NO_USER']); http_response_code(400); exit; }

$st = $pdo->prepare('SELECT target_balance_cents, target_profit_quarter_cents, updated_at
                     FROM user_goals WHERE user_id=? LIMIT 1');
$st->execute([$uid]);
$row = $st->fetch(PDO::FETCH_ASSOC);

echo json_encode([
  'ok' => true,
  'target_balance_cents' => isset($row['target_balance_cents']) ? (int)$row['target_balance_cents'] : null,
  'target_profit_quarter_cents' => isset($row['target_profit_quarter_cents']) ? (int)$row['target_profit_quarter_cents'] : null,
  'updated_at' => $row['updated_at'] ?? null
]);
