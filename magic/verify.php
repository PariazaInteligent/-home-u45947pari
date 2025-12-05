<?php
declare(strict_types=1);
session_start();
$token = (string)($_GET['t'] ?? '');
if ($token === '') { header('Location: /v1/login.html'); exit; }

require __DIR__ . '/../api/db.php';

$hash = hash('sha256', $token);
$st = $pdo->prepare("
  SELECT ml.id, ml.user_id, u.email, UPPER(u.role) role, u.is_active, u.email_verified_at
  FROM magic_links ml
  JOIN users u ON u.id = ml.user_id
  WHERE ml.token_hash=:h AND ml.used_at IS NULL AND ml.expires_at > NOW()
  LIMIT 1
");
$st->execute([':h'=>$hash]);
$row = $st->fetch(PDO::FETCH_ASSOC);

if (!$row || !(int)$row['is_active']) { echo 'Link invalid/expirat sau cont inactiv.'; exit; }

// marchează folosit + cleanup alte linkuri
$pdo->prepare("UPDATE magic_links SET used_at=NOW() WHERE id=:id")->execute([':id'=>$row['id']]);
$pdo->prepare("DELETE FROM magic_links WHERE user_id=:u AND (used_at IS NOT NULL OR expires_at < NOW())")->execute([':u'=>$row['user_id']]);

// considerăm emailul verificat la utilizarea linkului (opțional)
if (empty($row['email_verified_at'])) {
  $pdo->prepare("UPDATE users SET email_verified_at=NOW() WHERE id=:id")->execute([':id'=>$row['user_id']]);
}

// sesiune + remember 30 zile
session_regenerate_id(true);
$_SESSION['user'] = ['id'=>(int)$row['user_id'], 'email'=>$row['email'], 'role'=>$row['role']];

$selector  = rtrim(strtr(base64_encode(random_bytes(9)),'+/','-_'),'=');
$validator = rtrim(strtr(base64_encode(random_bytes(32)),'+/','-_'),'=');
$vhash     = password_hash($validator, PASSWORD_DEFAULT);
$expTs     = time()+60*60*24*30;
$pdo->prepare("
  INSERT INTO remember_tokens (user_id, selector, validator_hash, expires_at, created_at, user_agent, ip)
  VALUES (:uid,:sel,:vh,FROM_UNIXTIME(:exp),NOW(),:ua,:ip)
  ON DUPLICATE KEY UPDATE validator_hash=VALUES(validator_hash), expires_at=VALUES(expires_at), user_agent=VALUES(user_agent), ip=VALUES(ip)
")->execute([
  ':uid'=>$row['user_id'], ':sel'=>$selector, ':vh'=>$vhash, ':exp'=>$expTs,
  ':ua'=>substr($_SERVER['HTTP_USER_AGENT'] ?? '',0,255),
  ':ip'=>substr($_SERVER['REMOTE_ADDR'] ?? '',0,45),
]);
$secure = !empty($_SERVER['HTTPS']);
setcookie('remember_selector',$selector,['expires'=>$expTs,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);
setcookie('remember_validator',$validator,['expires'=>$expTs,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax']);

// redirect după rol
$DASHBOARD = ['ADMIN'=>'/v1/dashboard-admin.html','USER'=>'/v1/dashboard-investitor.html'];
$dest = $DASHBOARD[$row['role']] ?? $DASHBOARD['USER'];
header('Location: '.$dest);
exit;
