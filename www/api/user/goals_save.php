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

$raw = file_get_contents('php://input') ?: '{}';
$in = json_decode($raw, true) ?: [];

function eur_to_cents($v): int {
  if ($v === null || $v === '') return 0;
  if (is_string($v)) $v = str_replace([' ', ','], ['', '.'], $v);
  $f = (float)$v;
  if ($f < 0) $f = 0;
  return (int)round($f * 100);
}

$target_balance_cents = isset($in['target_balance_cents'])
  ? max(0, (int)$in['target_balance_cents'])
  : eur_to_cents($in['target_balance_eur'] ?? null);

$target_profit_quarter_cents = isset($in['target_profit_quarter_cents'])
  ? max(0, (int)$in['target_profit_quarter_cents'])
  : eur_to_cents($in['target_profit_quarter_eur'] ?? null);

try {
  $st = $pdo->prepare(
    'INSERT INTO user_goals (user_id, target_balance_cents, target_profit_quarter_cents)
     VALUES (:u, :b, :p)
     ON DUPLICATE KEY UPDATE
       target_balance_cents=VALUES(target_balance_cents),
       target_profit_quarter_cents=VALUES(target_profit_quarter_cents),
       updated_at=NOW()'
  );
  $st->execute([
    ':u' => $uid, // string OK pentru BIGINT UNSIGNED
    ':b' => $target_balance_cents,
    ':p' => $target_profit_quarter_cents
  ]);

  echo json_encode(['ok'=>true,
    'target_balance_cents'=>$target_balance_cents,
    'target_profit_quarter_cents'=>$target_profit_quarter_cents
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'DB','msg'=>$e->getMessage()]);
}
