<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
if (!isset($_SESSION['user']['id'])) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'unauth']); exit; }

$uid   = (int)$_SESSION['user']['id'];
$in    = json_decode(file_get_contents('php://input'), true) ?: [];
$msgId = (int)($in['message_id'] ?? 0);
$emoji = trim((string)($in['emoji'] ?? ''));

if ($msgId<=0 || $emoji===''){ http_response_code(400); echo json_encode(['ok'=>false,'error'=>'bad_input']); exit; }

require __DIR__ . '/../db.php'; // $pdo
$pdo->prepare('DELETE FROM chat_reactions WHERE message_id=? AND user_id=? AND emoji=?')->execute([$msgId,$uid,$emoji]);

echo json_encode(['ok'=>true]);
