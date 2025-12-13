<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors','1'); error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }

$in = json_decode(file_get_contents('php://input') ?: '{}', true);
$email = strtolower(trim($in['email'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { echo json_encode(['ok'=>false,'reason'=>'invalid_email']); exit; }

require __DIR__ . '/db.php';

// user activ?
$st = $pdo->prepare("SELECT id,is_active FROM users WHERE email=:e LIMIT 1");
$st->execute([':e'=>$email]);
$u = $st->fetch(PDO::FETCH_ASSOC);
if (!$u || !(int)$u['is_active']) { echo json_encode(['ok'=>false,'reason'=>'not_found_or_inactive']); exit; }

// curățare tokenuri vechi
$pdo->prepare("DELETE FROM magic_links WHERE user_id=:u AND (used_at IS NOT NULL OR expires_at < NOW())")
    ->execute([':u'=>$u['id']]);

// token + insert
$raw  = bin2hex(random_bytes(32));
$hash = hash('sha256', $raw);
$exp  = time() + 15*60;

$pdo->prepare("INSERT INTO magic_links (user_id, token_hash, expires_at, user_agent, ip)
               VALUES (:u,:h,FROM_UNIXTIME(:e),:ua,:ip)")
    ->execute([
      ':u'=>$u['id'], ':h'=>$hash, ':e'=>$exp,
      ':ua'=>substr($_SERVER['HTTP_USER_AGENT'] ?? '',0,255),
      ':ip'=>substr($_SERVER['REMOTE_ADDR'] ?? '',0,45),
    ]);

// link + trimitere email
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$link   = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/magic/verify.php?t=' . $raw;

$sent = @mail(
  $email,
  'Link de autentificare — Pariază Inteligent',
  "Salut,\n\nAutentifică-te fără parolă:\n$link\n\nLinkul expiră în 15 minute.",
  "Content-Type: text/plain; charset=UTF-8\r\n"
);
if (!$sent) { echo json_encode(['ok'=>false,'reason'=>'mail_failed']); exit; }

echo json_encode(['ok'=>true]);
