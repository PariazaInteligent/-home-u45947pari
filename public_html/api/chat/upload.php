<?php
// /api/chat/upload.php — încărcare atașamente pentru Chat Comunitate
// răspuns: { ok:bool, attachment?:{url,name,mime,size,kind}, error?:string, hint?:string }

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
session_start();
$me = $_SESSION['user'] ?? null;
$csrfExpected = $_SESSION['csrf_token_chat'] ?? $_SESSION['csrf_token'] ?? null;

if (!$me) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit; }

$csrfIn = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
if (!$csrfExpected || $csrfIn === '' || !hash_equals((string)$csrfExpected, (string)$csrfIn)) {
  http_response_code(403);
  echo json_encode(['ok'=>false,'error'=>'csrf_invalid','hint'=>'token CSRF lipsă sau invalid']);
  exit;
}

require __DIR__ . '/meta_lib.php';
chat_ensure_dirs();

if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
  echo json_encode(['ok'=>false,'error'=>'no_file','hint'=>'nu ai selectat niciun fișier']);
  exit;
}

$f = $_FILES['file'];
$maxSize = 20 * 1024 * 1024; // 20MB
if (($f['size'] ?? 0) > $maxSize) {
  echo json_encode(['ok'=>false,'error'=>'too_large','hint'=>'dimensiune maximă 20MB']);
  exit;
}

$mime = (string)($f['type'] ?? '');
$name = (string)($f['name'] ?? '');
$tmp  = $f['tmp_name'];
$ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));

$allowed = [
  'png','jpg','jpeg','gif','webp','avif','mp4','webm','mov','m4v','mp3','wav','ogg','aac','m4a'
];
if (!in_array($ext, $allowed, true)) {
  echo json_encode(['ok'=>false,'error'=>'type_blocked','hint'=>'format neacceptat']);
  exit;
}

$destDir = chat_upload_base();
if (!is_dir($destDir)) @mkdir($destDir, 0775, true);

$basename = bin2hex(random_bytes(8)) . ($ext ? '.'.$ext : '');
$destPath = rtrim($destDir, '/').'/'.$basename;
if (!move_uploaded_file($tmp, $destPath)) {
  echo json_encode(['ok'=>false,'error'=>'move_failed']);
  exit;
}

$url = '/uploads/chat/'.$basename;
$attachment = chat_normalize_attachment([
  'url'  => $url,
  'name' => $name,
  'mime' => $mime,
  'size' => (int)($f['size'] ?? 0),
]);

if (!$attachment) {
  @unlink($destPath);
  echo json_encode(['ok'=>false,'error'=>'validation_failed']);
  exit;
}

echo json_encode(['ok'=>true,'attachment'=>$attachment]);