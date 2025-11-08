<?php
// /api/chat/send.php — POST chat message (JSON or form)
// Răspuns: { ok: bool, id?: int, error?: string }
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

session_start();
$me = $_SESSION['user'] ?? null;
if (!$me) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'auth']); exit;
}

$uid  = (int)($me['id'] ?? 0);
$role = strtoupper($me['role'] ?? 'USER');
$name = trim($me['name'] ?? ($me['email'] ?? 'Investitor'));

$raw  = file_get_contents('php://input');
$in   = json_decode($raw, true);
if (!is_array($in)) $in = $_POST; // acceptă și form-urlencoded

// suportăm chei diferite din frontend
$body = trim((string)($in['body'] ?? $in['message'] ?? $in['text'] ?? ''));
if ($body === '') { echo json_encode(['ok'=>false,'error'=>'empty']); exit; }
if (mb_strlen($body) > 2000) { echo json_encode(['ok'=>false,'error'=>'too_long']); exit; }

require __DIR__.'/../db.php'; // $pdo
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
  // Detectăm schema tabelului
  $hasMessage = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'message'")->fetch();
  $hasBody    = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'body'")->fetch();
  $hasRoom    = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'room'")->fetch();
  $hasUserId  = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'user_id'")->fetch();
  $hasUserNm  = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'user_name'")->fetch();
  $hasRoleCol = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'role'")->fetch();
  $hasIpCol   = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'ip'")->fetch();
  $hasUaCol   = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'ua'")->fetch();
  $hasCreated = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'created_at'")->fetch();

  $textCol = $hasMessage ? 'message' : ($hasBody ? 'body' : null);
  if (!$textCol) throw new RuntimeException('no_text_column');

  // Anti-spam simplu: max 8 mesaje / minut / IP (+opțional per user)
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  $rateSql = "SELECT COUNT(*) FROM chat_messages WHERE ";
  $rateWhere = [];
  $rateParams = [];

  if ($hasIpCol) { $rateWhere[] = "ip = ?"; $rateParams[] = $ip; }
  if ($hasUserId) { $rateWhere[] = "user_id = ?"; $rateParams[] = $uid; }
  if ($hasRoom) { $rateWhere[] = "room = 'global'"; }
  $rateWhere[] = "created_at > (NOW() - INTERVAL 1 MINUTE)";
  $rateSql .= implode(" AND ", $rateWhere);

  try {
    $stRate = $pdo->prepare($rateSql);
    $stRate->execute($rateParams);
    if ((int)$stRate->fetchColumn() >= 8) {
      echo json_encode(['ok'=>false,'error'=>'rate_limited']); exit;
    }
  } catch (Throwable $e) {
    // dacă tabela nu are created_at, ignorăm gardul de rată
  }

  // Construim INSERT-ul dinamic
  $cols = [$textCol];  $vals = [':text'];  $bind = [':text'=>$body];
  if ($hasRoom)    { $cols[]='room';      $vals[]=':room';   $bind[':room']='global'; }
  if ($hasUserId)  { $cols[]='user_id';   $vals[]=':uid';    $bind[':uid']=$uid; }
  if ($hasUserNm)  { $cols[]='user_name'; $vals[]=':uname';  $bind[':uname']=$name; }
  if ($hasRoleCol) { $cols[]='role';      $vals[]=':role';   $bind[':role']=$role; }
  if ($hasIpCol)   { $cols[]='ip';        $vals[]=':ip';     $bind[':ip']=$ip; }
  if ($hasUaCol)   { $cols[]='ua';        $vals[]=':ua';     $bind[':ua']=$_SERVER['HTTP_USER_AGENT'] ?? ''; }
  if ($hasCreated) { $cols[]='created_at'; $vals[]='NOW()'; } // explicit, chiar dacă are default

  $sql = "INSERT INTO chat_messages (".implode(',', $cols).") VALUES (".implode(',', $vals).")";
  $st  = $pdo->prepare($sql);
  $st->execute($bind);
  $id = (int)$pdo->lastInsertId();

  echo json_encode(['ok'=>true,'id'=>$id]); // SSE va prelua și afișa
} catch (Throwable $e) {
  // Evităm 500 către client; expunem hint pt. debug rapid în Network
  http_response_code(200);
  echo json_encode(['ok'=>false,'error'=>'server_error','hint'=>$e->getMessage()]);
}
