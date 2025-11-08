<?php
declare(strict_types=1);
session_start();
$cfg = require __DIR__ . '/../../api/google_oauth_config.php';
require __DIR__ . '/../../api/db.php';

function http_post_json(string $url, array $data): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    CURLOPT_POSTFIELDS => http_build_query($data),
    CURLOPT_TIMEOUT => 15,
  ]);
  $res = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return [$code, $res ? json_decode($res, true) : []];
}
function http_get_auth(string $url, string $token): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer '.$token],
    CURLOPT_TIMEOUT => 15,
  ]);
  $res = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return [$code, $res ? json_decode($res, true) : []];
}

if (isset($_GET['error'])) { echo 'Google auth error'; exit; }
if (!isset($_GET['code'], $_GET['state']) || !hash_equals($_SESSION['g_state'] ?? '', (string)$_GET['state'])) { echo 'Invalid state'; exit; }

$code = (string)$_GET['code'];

// exchange code
[$status, $tok] = http_post_json('https://oauth2.googleapis.com/token', [
  'code' => $code,
  'client_id' => $cfg['client_id'],
  'client_secret' => $cfg['client_secret'],
  'redirect_uri' => $cfg['redirect_uri'],
  'grant_type' => 'authorization_code',
]);
if ($status!==200 || empty($tok['access_token'])) { echo 'Token exchange failed'; exit; }

// userinfo
[$s2, $info] = http_get_auth('https://openidconnect.googleapis.com/v1/userinfo', $tok['access_token']);
if ($s2!==200 || empty($info['email'])) { echo 'Userinfo failed'; exit; }
if (!empty($cfg['allowed_hd']) && strcasecmp($info['hd'] ?? '', $cfg['allowed_hd'])!==0) { echo 'Domain not allowed'; exit; }
if (empty($info['email_verified'])) { echo 'Email not verified by Google'; exit; }

$email = strtolower(trim($info['email']));

// user lookup
$st = $pdo->prepare("SELECT id,email,role,is_active,email_verified_at FROM users WHERE email=:e LIMIT 1");
$st->execute([':e'=>$email]);
$u = $st->fetch(PDO::FETCH_ASSOC);

if (!$u) {
  // auto-provision USER
  $ins = $pdo->prepare("INSERT INTO users (email,password_hash,role,is_active,created_at,email_verified_at) VALUES (:e,'', 'USER', 1, NOW(), NOW())");
  $ins->execute([':e'=>$email]);
  $uid = (int)$pdo->lastInsertId();
  $role = 'USER';
  $verifiedAt = date('Y-m-d H:i:s');
} else {
  if (!(int)$u['is_active']) { echo 'Contul este inactiv.'; exit; }
  $uid = (int)$u['id'];
  $role = strtoupper($u['role'] ?? 'USER');
  if (empty($u['email_verified_at'])) {
    $pdo->prepare("UPDATE users SET email_verified_at=NOW() WHERE id=:id")->execute([':id'=>$uid]);
  }
}

// session
session_regenerate_id(true);
$_SESSION['user'] = ['id'=>$uid,'email'=>$email,'role'=>$role];

// remember 30 zile
$selector  = rtrim(strtr(base64_encode(random_bytes(9)),'+/','-_'),'=');
$validator = rtrim(strtr(base64_encode(random_bytes(32)),'+/','-_'),'=');
$vhash     = password_hash($validator, PASSWORD_DEFAULT);
$expTs     = time()+60*60*24*30;

$ins2 = $pdo->prepare("
  INSERT INTO remember_tokens (user_id, selector, validator_hash, expires_at, created_at, user_agent, ip)
  VALUES (:uid,:sel,:vh,FROM_UNIXTIME(:exp),NOW(),:ua,:ip)
  ON DUPLICATE KEY UPDATE validator_hash=VALUES(validator_hash), expires_at=VALUES(expires_at), user_agent=VALUES(user_agent), ip=VALUES(ip)
");
$ins2->execute([
  ':uid'=>$uid, ':sel'=>$selector, ':vh'=>$vhash, ':exp'=>$expTs,
  ':ua'=>substr($_SERVER['HTTP_USER_AGENT'] ?? '',0,255),
  ':ip'=>substr($_SERVER['REMOTE_ADDR'] ?? '',0,45),
]);
$secure = !empty($_SERVER['HTTPS']);
setcookie('remember_selector',$selector,['expires'=>$expTs,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);
setcookie('remember_validator',$validator,['expires'=>$expTs,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);

// redirect
$DASHBOARD = ['ADMIN'=>'/v1/dashboard-admin.html','USER'=>'/v1/dashboard-investitor.html'];
header('Location: '.($DASHBOARD[$role] ?? $DASHBOARD['USER']));
exit;
