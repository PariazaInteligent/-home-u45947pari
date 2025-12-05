<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false]); exit; }

$in = json_decode(file_get_contents('php://input') ?: '[]', true);
$email = trim($in['email'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { echo json_encode(['ok'=>true]); exit; } // răspuns generic

require __DIR__ . '/db.php';

// caută user
$st = $pdo->prepare("SELECT id,email FROM users WHERE email=:e AND is_active=1 LIMIT 1");
$st->execute([':e'=>$email]);
$u = $st->fetch(PDO::FETCH_ASSOC);

// răspuns generic chiar dacă nu există
if ($u) {
  // curăță token-urile vechi
  $pdo->prepare("DELETE FROM password_resets WHERE user_id=:uid AND (used_at IS NOT NULL OR expires_at < NOW())")
      ->execute([':uid'=>$u['id']]);

  // token
  $raw = bin2hex(random_bytes(32)); // 64 hex chars
  $hash = hash('sha256', $raw);
  $exp  = time() + 60*60; // 60 min

  $ins = $pdo->prepare("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (:uid, :th, FROM_UNIXTIME(:exp))");
  $ins->execute([':uid'=>$u['id'], ':th'=>$hash, ':exp'=>$exp]);

  $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
  $origin = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
  $resetUrl = $origin . '/reset.php?t=' . $raw;

  // email (simplu)
  $to = $u['email'];
  $subj = "Resetare parolă — Pariază Inteligent";
  $body = "Salut,\n\nAm primit o cerere de resetare a parolei.\n\nAccesează linkul:\n$resetUrl\n\nValabil 60 de minute.\nDacă nu ai cerut tu, ignoră acest mesaj.";
  $hdrs = "Content-Type: text/plain; charset=UTF-8\r\n";

  @mail($to, $subj, $body, $hdrs);
  // opțional: pentru debug local poți loga $resetUrl în server logs
}

echo json_encode(['ok'=>true]);
