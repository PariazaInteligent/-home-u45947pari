<?php
// /api/chat/search.php — căutare în istoricul chat-ului
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if (!isset($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'auth']);
  exit;
}

$q = trim((string)($_GET['q'] ?? ''));
if ($q === '' || mb_strlen($q) < 2) {
  echo json_encode(['ok' => true, 'items' => [], 'hint' => 'too_short']);
  exit;
}

$limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));

require __DIR__ . '/../db.php'; // $pdo

$needle = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $q) . '%';
$stmt = $pdo->prepare('SELECT id,user_id,user_name,role,body,UNIX_TIMESTAMP(created_at) AS ts
                        FROM chat_messages
                        WHERE body LIKE ? OR user_name LIKE ?
                        ORDER BY id DESC
                        LIMIT ?');
$stmt->bindValue(1, $needle, PDO::PARAM_STR);
$stmt->bindValue(2, $needle, PDO::PARAM_STR);
$stmt->bindValue(3, $limit, PDO::PARAM_INT);
$stmt->execute();

echo json_encode([
  'ok' => true,
  'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
]);