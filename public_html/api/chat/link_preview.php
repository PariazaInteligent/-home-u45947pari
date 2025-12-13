<?php
// /api/chat/link_preview.php — întoarce OG preview pentru un URL (cache pe disc)

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
session_start();
$me = $_SESSION['user'] ?? null;
if (!$me) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit; }

$url = trim((string)($_GET['url'] ?? ''));
if ($url === '' || !preg_match('~^https?://~i', $url)) {
  echo json_encode(['ok'=>false,'error'=>'invalid_url']);
  exit;
}

require __DIR__ . '/meta_lib.php';
$preview = chat_fetch_preview($url);
if (!$preview) {
  echo json_encode(['ok'=>false,'error'=>'no_preview']);
  exit;
}

echo json_encode(['ok'=>true,'preview'=>$preview]);