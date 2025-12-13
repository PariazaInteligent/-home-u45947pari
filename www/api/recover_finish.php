<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }

$in = json_decode(file_get_contents('php://input') ?: '[]', true);
$token = (string)($in['token'] ?? '');
$pass  = (string)($in['password'] ?? '');

if ($token === '' || strlen($pass) < 8) { echo json_encode(['ok'=>false]); exit; }

require __DIR__ . '/db.php';

$hash = hash('sha256', $token);

// găsește token valid
$st = $pdo->prepare("
  SELECT pr.id, pr.user_id
  FROM password_resets pr
  WHERE pr.token_hash = :th AND pr.used_at IS NULL AND pr.expires_at > NOW()
  LIMIT 1
");
$st->execute([':th'=>$hash]);
$row = $st->fetch(PDO::FETCH_ASSOC);
if (!$row) { echo json_encode(['ok'=>false]); exit; }

$uid = (int)$row['user_id'];

// setează parola nouă
$newHash = password_hash($pass, PASSWORD_DEFAULT);
$up = $pdo->prepare("UPDATE users SET password_hash=:h, updated_at=NOW() WHERE id=:id");
$up->execute([':h'=>$newHash, ':id'=>$uid]);

// marchează token folosit + curăță sesiuni remember
$pdo->prepare("UPDATE password_resets SET used_at=NOW() WHERE id=:id")->execute([':id'=>$row['id']]);
$pdo->prepare("DELETE FROM remember_tokens WHERE user_id=:uid")->execute([':uid'=>$uid]);

echo json_encode(['ok'=>true, 'redirect'=>'/v1/login.html']);
