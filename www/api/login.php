<?php
// /api/login.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }

$in = json_decode(file_get_contents('php://input') ?: '[]', true);
$email = trim($in['email'] ?? '');
$pass  = (string)($in['password'] ?? '');
$remember = !empty($in['remember']);

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $pass === '') { http_response_code(400); echo json_encode(['ok'=>false]); exit; }

require __DIR__ . '/db.php';
session_start([
  'cookie_httponly' => true,
  'cookie_samesite' => 'Lax',
  'cookie_secure'   => isset($_SERVER['HTTPS']),
]);

$st = $pdo->prepare("SELECT id, email, password_hash, role, is_active FROM users WHERE email=:e LIMIT 1");
$st->execute([':e'=>$email]);
$u = $st->fetch(PDO::FETCH_ASSOC);
if (!$u || (int)($u['is_active'] ?? 1) === 0) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }

$hash = (string)($u['password_hash'] ?? '');
$valid = false;
if ($hash !== '' && str_starts_with($hash, '$')) {
  $valid = password_verify($pass, $hash);
} else {
  $valid = hash_equals($hash, $pass);
  if ($valid) {
    $newHash = password_hash($pass, PASSWORD_DEFAULT);
    $up = $pdo->prepare("UPDATE users SET password_hash=:h WHERE id=:id");
    $up->execute([':h'=>$newHash, ':id'=>$u['id']]);
    $hash = $newHash;
  }
}
if (!$valid) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }

// // MFA (dezactivat acum):
// if (!empty($u['mfa_enabled'])) {
//   $ticket = bin2hex(random_bytes(16));
//   $_SESSION['mfa_ticket'] = ['t'=>$ticket,'uid'=>$u['id'],'ts'=>time()];
//   echo json_encode(['ok'=>false,'mfaRequired'=>true,'ticket'=>$ticket]); exit;
// }

$_SESSION['user'] = [
  'id'    => (int)$u['id'],
  'email' => $u['email'],
  'role'  => strtoupper($u['role'] ?? 'USER')
];

if ($remember) {
  $selector  = rtrim(strtr(base64_encode(random_bytes(9)),'+/','-_'),'=');
  $validator = rtrim(strtr(base64_encode(random_bytes(32)),'+/','-_'),'=');
  $vhash     = password_hash($validator, PASSWORD_DEFAULT);
  $expTs     = time() + 60*60*24*30;

  $ins = $pdo->prepare("
    INSERT INTO remember_tokens (user_id, selector, validator_hash, expires_at, created_at, user_agent, ip)
    VALUES (:uid, :sel, :vh, FROM_UNIXTIME(:exp), NOW(), :ua, :ip)
    ON DUPLICATE KEY UPDATE validator_hash=VALUES(validator_hash), expires_at=VALUES(expires_at), user_agent=VALUES(user_agent), ip=VALUES(ip)
  ");
  $ins->execute([
    ':uid'=>$u['id'],
    ':sel'=>$selector,
    ':vh'=>$vhash,
    ':exp'=>$expTs,
    ':ua'=>substr($_SERVER['HTTP_USER_AGENT'] ?? '',0,255),
    ':ip'=>substr($_SERVER['REMOTE_ADDR'] ?? '',0,45),
  ]);

  $secure = !empty($_SERVER['HTTPS']);
  setcookie('remember_selector', $selector, [
    'expires'=>$expTs, 'path'=>'/', 'secure'=>$secure, 'httponly'=>true, 'samesite'=>'Lax'
  ]);
  setcookie('remember_validator', $validator, [
    'expires'=>$expTs, 'path'=>'/', 'secure'=>$secure, 'httponly'=>true, 'samesite'=>'Lax'
  ]);
}

// Blocheaza login-ul daca contul nu este verificat
// înainte de a seta sesiunea:
$ver = $pdo->prepare("SELECT email_verified_at FROM users WHERE id=:id");
$ver->execute([':id'=>$u['id']]);
$verified = (bool)$ver->fetchColumn();
if (!$verified) {
  echo json_encode(['ok'=>false,'code'=>'verify_required']); exit;
}


$role = strtoupper($u['role'] ?? 'USER');

// mapping scalabil
$DASHBOARD = [
  'ADMIN' => '/v1/dashboard-admin.php',
  'USER'  => '/v1/dashboard-investitor.php',
];
$redirect = $DASHBOARD[$role] ?? '/v1/dashboard-investitor.php';

echo json_encode(['ok'=>true, 'role'=>$role, 'redirect'=>$redirect]);

