<?php
require __DIR__.'/db.php';

// Deja logat? nimic de făcut.
if (!empty($_SESSION['user'])) { return; }

$sel = $_COOKIE['remember_selector'] ?? '';
$val = $_COOKIE['remember_validator'] ?? '';
if (!$sel || !$val) { return; }

// caută selectorul
$stmt = $mysqli->prepare("SELECT at.id, at.user_id, at.selector, at.validator_hash, at.expires, u.nume, u.email 
                          FROM auth_tokens at 
                          JOIN utilizatori u ON u.id = at.user_id
                          WHERE at.selector = ?
                          LIMIT 1");
$stmt->bind_param('s', $sel);
$stmt->execute();
$tok = $stmt->get_result()->fetch_assoc();

if (!$tok) { 
  // selector invalid -> curăță cookie-urile
  setcookie('remember_selector','',time()-3600,'/'); 
  setcookie('remember_validator','',time()-3600,'/'); 
  return; 
}

// expirat?
if (strtotime($tok['expires']) <= time()) {
  $del = $mysqli->prepare("DELETE FROM auth_tokens WHERE id=?");
  $del->bind_param('i',$tok['id']); $del->execute();
  setcookie('remember_selector','',time()-3600,'/');
  setcookie('remember_validator','',time()-3600,'/');
  return;
}

// compară validator (hash constant-time)
$calc = hash('sha256', $val);
if (!hash_equals($tok['validator_hash'], $calc)) {
  // posibil furt -> revocă tokenul și curăță cookie-urile
  $del = $mysqli->prepare("DELETE FROM auth_tokens WHERE id=?");
  $del->bind_param('i',$tok['id']); $del->execute();
  setcookie('remember_selector','',time()-3600,'/');
  setcookie('remember_validator','',time()-3600,'/');
  return;
}

// OK: loghează userul în sesiune
session_regenerate_id(true);
$_SESSION['user'] = [
  'id'=>(int)$tok['user_id'],
  'nume'=>$tok['nume'],
  'email'=>$tok['email'],
];

// (opțional) update last_used
$upd = $mysqli->prepare("UPDATE auth_tokens SET last_used = NOW() WHERE id=?");
$upd->bind_param('i', $tok['id']); $upd->execute();

// Rotează validatorul (best practice)
$newValidator = bin2hex(random_bytes(32));
$newHash = hash('sha256', $newValidator);
$rot = $mysqli->prepare("UPDATE auth_tokens SET validator_hash=?, last_used=NOW() WHERE id=?");
$rot->bind_param('si', $newHash, $tok['id']);
$rot->execute();

// rescrie cookie-urile (selector rămâne la fel)
$secure = !empty($_SERVER['HTTPS']);
$exp = time() + 60*60*24*30;
setcookie('remember_selector', $tok['selector'], [
  'expires'=>$exp,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax'
]);
setcookie('remember_validator', $newValidator, [
  'expires'=>$exp,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax'
]);
