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
// Unele instanțe folosesc coloana "message" în loc de "body" – detectăm în timp real.
$hasBody = false;
$hasMessage = false;
try {
  $schema = $pdo->query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " .
    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME IN ('body','message')"
  );
  foreach ($schema ?: [] as $row) {
    if (!isset($row['COLUMN_NAME'])) continue;
    if ($row['COLUMN_NAME'] === 'body') $hasBody = true;
    if ($row['COLUMN_NAME'] === 'message') $hasMessage = true;
  }
} catch (Throwable $e) {
  // fallback sigur mai jos
}

if (!$hasBody && !$hasMessage) {
  // fallback de siguranță – tabelul ar trebui să aibă cel puțin unul din câmpuri
  $bodyExpr = "''";
} elseif ($hasBody && $hasMessage) {
  $bodyExpr = "COALESCE(NULLIF(body,''), message)";
} elseif ($hasBody) {
  $bodyExpr = 'body';
} else {
  $bodyExpr = 'message';
}

$cols = "id,user_id,user_name,role,{$bodyExpr} AS body,UNIX_TIMESTAMP(created_at) AS ts";

$items = [];
if ($beforeId > 0) {
  // Încărcare lazy (mesaje mai vechi decât before_id)
  $stmt = $pdo->prepare("SELECT {$cols} FROM chat_messages WHERE id < ? ORDER BY id DESC LIMIT ?");
  $stmt->execute([$beforeId, $limit]);
  $items = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
} elseif ($sinceId > 0) {
  $stmt = $pdo->prepare("SELECT {$cols} FROM chat_messages WHERE id > ? ORDER BY id ASC LIMIT ?");
  $stmt->execute([$sinceId, $limit]);
  $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
} else {
  // ultimele N pentru bootstrap
 $stmt = $pdo->prepare("SELECT {$cols} FROM chat_messages ORDER BY id DESC LIMIT ?");
  $stmt->execute([$limit]);
}

echo json_encode(['ok'=>true,'items'=>$items]);