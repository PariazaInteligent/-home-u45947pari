<?php
// /api/chat/fetch.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

require __DIR__.'/../db.php'; // $pdo
$sinceId  = max(0, (int)($_GET['since_id'] ?? 0));
$beforeId = max(0, (int)($_GET['before_id'] ?? 0));
$limit    = min(200, max(1, (int)($_GET['limit'] ?? 50)));

if ($beforeId > 0) {
  // Încărcare lazy (mesaje mai vechi decât before_id)
  $stmt = $pdo->prepare('SELECT id,user_id,user_name,role,body,UNIX_TIMESTAMP(created_at) AS ts FROM (
      SELECT * FROM chat_messages WHERE id < ? ORDER BY id DESC LIMIT ?
    ) t ORDER BY id ASC');
  $stmt->execute([$beforeId, $limit]);
} elseif ($sinceId > 0) {
  $stmt = $pdo->prepare('SELECT id,user_id,user_name,role,body,UNIX_TIMESTAMP(created_at) AS ts FROM chat_messages WHERE id>? ORDER BY id ASC LIMIT ?');
  $stmt->execute([$sinceId, $limit]);
} else {
  // ultimele N pentru bootstrap
  $stmt = $pdo->prepare('SELECT id,user_id,user_name,role,body,UNIX_TIMESTAMP(created_at) AS ts FROM (
      SELECT * FROM chat_messages ORDER BY id DESC LIMIT ?
    ) t ORDER BY id ASC');
  $stmt->execute([$limit]);
}

echo json_encode(['ok'=>true,'items'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
