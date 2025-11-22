<?php
// /api/chat/search.php — căutare în arhiva chat
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

session_start();
$me = $_SESSION['user'] ?? null; // nu impunem login; dacă vrei, pune un 401 aici
session_write_close();

$q     = trim((string)($_GET['q'] ?? ''));
$limit = (int)($_GET['limit'] ?? 30);
$limit = max(1, min(100, $limit));           // 1..100
$limitSQL = (string)$limit;                   // interpolare sigură

try {
  require __DIR__ . '/../db.php'; // $pdo
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

  // Detectăm coloana de text
  $hasMessage = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'message'")->fetch();
  $hasBody    = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'body'")->fetch();
  $textCol    = $hasMessage ? 'message' : ($hasBody ? 'body' : null);
  if (!$textCol) { echo json_encode(['ok'=>false,'error'=>'no_text_column']); exit; }

  // FULLTEXT compus (body,user_name) dacă există
  $hasFT = false;
  try {
    $st = $pdo->query("SHOW INDEX FROM chat_messages WHERE Key_name='ft_body_user' AND Index_type='FULLTEXT'");
    $hasFT = (bool)$st->fetch();
  } catch (Throwable $e) { $hasFT = false; }

  $params = [];
  $where  = [];

  if ($q !== '') {
    if ($hasFT) {
      // Construim expresie BOOLEAN: +term*
      $raw = preg_split('/\s+/u', $q, -1, PREG_SPLIT_NO_EMPTY);
      $tok = [];
      foreach ($raw as $t) {
        $t = preg_replace('/[^\pL\pN]+/u', '', $t);
        if ($t === '') continue;
        if (mb_strlen($t, 'UTF-8') < 2) continue;
        $tok[] = '+' . $t . '*';
      }
      if ($tok) {
        $params[':q'] = implode(' ', $tok);
        $where[] = "MATCH($textCol, user_name) AGAINST(:q IN BOOLEAN MODE)";
      } else {
        $params[':lk'] = '%' . $q . '%';
        $where[] = "(user_name LIKE :lk OR $textCol LIKE :lk)";
      }
    } else {
      $params[':lk'] = '%' . $q . '%';
      $where[] = "(user_name LIKE :lk OR $textCol LIKE :lk)";
    }
  }

  $sql = "SELECT id, user_id, user_name, role, $textCol AS body, UNIX_TIMESTAMP(created_at) AS ts
          FROM chat_messages";
  if ($where) $sql .= " WHERE " . implode(' AND ', $where);
  $sql .= " ORDER BY id DESC LIMIT $limitSQL";   // <— fără parametru la LIMIT

  $st = $pdo->prepare($sql);
  foreach ($params as $k => $v) {
    $st->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
  }
  $st->execute();
  $items = $st->fetchAll();

  echo json_encode(['ok'=>true,'items'=>$items]);
} catch (Throwable $e) {
  http_response_code(200);
  echo json_encode(['ok'=>false,'error'=>'server_error','hint'=>$e->getMessage()]);
}
