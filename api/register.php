<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }

session_start();

$in = json_decode(file_get_contents('php://input') ?: '[]', true);
$email = trim($in['email'] ?? '');
$pass  = (string)($in['password'] ?? '');
$captcha = (string)($in['captcha'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['ok'=>false]); exit; }

require __DIR__ . '/db.php';

/* RATE LIMIT: max 5 / 10min per IP */
function rate_key(): string { return hash('sha256', $_SERVER['REMOTE_ADDR'] ?? ''); }
function rl_allow(PDO $pdo, string $action, string $keyHash, int $limit, int $windowSec): bool {
  $start = time() - (time()%$windowSec);
  $dt = date('Y-m-d H:i:s', $start);
  $up = $pdo->prepare("
    INSERT INTO rate_limits (action,key_hash,period_start,cnt,last_at)
    VALUES (:a,:k,:s,1,NOW())
    ON DUPLICATE KEY UPDATE cnt=cnt+1,last_at=VALUES(last_at)
  ");
  $up->execute([':a'=>$action, ':k'=>$keyHash, ':s'=>$dt]);
  $q = $pdo->prepare("SELECT cnt FROM rate_limits WHERE action=:a AND key_hash=:k AND period_start=:s");
  $q->execute([':a'=>$action, ':k'=>$keyHash, ':s'=>$dt]);
  return ((int)$q->fetchColumn()) <= $limit;
}
if (!rl_allow($pdo, 'register', rate_key(), 5, 600)) { echo json_encode(['ok'=>false,'code'=>'rate']); exit; }

/* CAPTCHA */
if (!isset($_SESSION['reg_captcha']) || (int)$captcha !== (int)$_SESSION['reg_captcha']) {
  echo json_encode(['ok'=>false,'code'=>'captcha']); exit;
}
unset($_SESSION['reg_captcha']); // one-time

/* PASSWORD POLICY */
$len = strlen($pass);
$ok = $len>=10 && $len<=72
   && preg_match('/[a-z]/',$pass)
   && preg_match('/[A-Z]/',$pass)
   && preg_match('/\d/',$pass)
   && preg_match('/[^A-Za-z0-9]/',$pass)       // simbol
   && !preg_match('/\s/',$pass)
   && preg_match('/^[\x20-\x7E]+$/',$pass);    // ASCII vizibil

if (!$ok) { echo json_encode(['ok'=>false,'code'=>'password_policy']); exit; }

/* UNICITATE */
$st = $pdo->prepare("SELECT id FROM users WHERE email=:e LIMIT 1");
$st->execute([':e'=>$email]);
if ($st->fetchColumn()) { http_response_code(409); echo json_encode(['ok'=>false,'code'=>'email_exists']); exit; }

/* CREARE USER ne-verificat */
$hash = password_hash($pass, PASSWORD_DEFAULT);
$ins = $pdo->prepare("INSERT INTO users (email,password_hash,role,is_active,created_at,email_verified_at) VALUES (:e,:h,'USER',1,NOW(),NULL)");
$ins->execute([':e'=>$email, ':h'=>$hash]);
$uid = (int)$pdo->lastInsertId();

/* TOKEN verificare */
$raw = bin2hex(random_bytes(32)); $tokHash = hash('sha256',$raw);
$exp = time() + 60*60*24; // 24h
$pdo->prepare("INSERT INTO email_verifications (user_id, token_hash, expires_at) VALUES (:u,:t,FROM_UNIXTIME(:e))")
    ->execute([':u'=>$uid, ':t'=>$tokHash, ':e'=>$exp]);

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$origin = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
$link = $origin . '/verify.php?t=' . $raw;

/* TRIMITE EMAIL (simplu) */
$subj = "Confirmă adresa de email — Pariază Inteligent";
$body = "Salut,\n\nFinalizează înregistrarea confirmând emailul:\n$link\n\nLinkul expiră în 24 de ore.";
$hdrs = "Content-Type: text/plain; charset=UTF-8\r\n";
@mail($email, $subj, $body, $hdrs);

/* Nu autentificăm încă — double opt-in */
echo json_encode(['ok'=>true]);
