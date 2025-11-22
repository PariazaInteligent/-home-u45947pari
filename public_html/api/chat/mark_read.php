<?php
// /api/chat/mark_read.php
require __DIR__.'/../auth.php'; // setează $user_id
require __DIR__.'/../db.php';   // $pdo

if ($_SERVER['REQUEST_METHOD']!=='POST') { http_response_code(405); exit; }
$in = json_decode(file_get_contents('php://input'), true) ?: [];
$lastId = max(0, (int)($in['last_id'] ?? 0));
$lastMentionId = max(0, (int)($in['last_mention_id'] ?? 0));

$pdo->beginTransaction();
try{
  $stmt = $pdo->prepare('UPDATE chat_read SET last_id = GREATEST(COALESCE(last_id,0), ?) WHERE user_id = ?');
  $stmt->execute([$lastId, $user_id]);
  if ($stmt->rowCount()===0){
    $pdo->prepare('INSERT INTO chat_read (user_id,last_id,last_mention_id) VALUES (?,?,?) 
                   ON CONFLICT(user_id) DO UPDATE SET last_id=GREATEST(chat_read.last_id,excluded.last_id)')
        ->execute([$user_id, $lastId, $lastMentionId]);
  }
  $pdo->prepare('UPDATE chat_read SET last_mention_id = GREATEST(COALESCE(last_mention_id,0), ?) WHERE user_id = ?')
      ->execute([$lastMentionId, $user_id]);
  $pdo->commit();
  header('Content-Type: application/json'); echo json_encode(['ok'=>true]);
} catch(Exception $e){
  $pdo->rollBack();
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'db']);
}
