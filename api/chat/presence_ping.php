<?php
// POST: ping de prezență (la ~20s). Răspuns: {ok:true}
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

session_start();
$me = $_SESSION['user'] ?? null;
if (!$me) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'auth']); exit; }
session_write_close();

$uid  = (int)($me['id'] ?? 0);
$uname= trim($me['name'] ?? ($me['email'] ?? 'Investitor'));
$room = 'global';

require __DIR__.'/../db.php';
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
  // create-if-not-exists (sigur pe shared hosting)
  $pdo->exec("CREATE TABLE IF NOT EXISTS chat_presence (
      user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
      user_name VARCHAR(120) NOT NULL,
      room VARCHAR(64) NOT NULL DEFAULT 'global',
      last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_seen (last_seen), KEY idx_room (room, last_seen)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  $sql = "INSERT INTO chat_presence (user_id,user_name,room,last_seen)
          VALUES (:uid,:uname,:room,NOW())
          ON DUPLICATE KEY UPDATE user_name=VALUES(user_name), room=VALUES(room), last_seen=NOW()";
  $st  = $pdo->prepare($sql);
  $st->execute([':uid'=>$uid, ':uname'=>$uname, ':room'=>$room]);

  echo json_encode(['ok'=>true, 'ts'=>time()]);
} catch (Throwable $e) {
  http_response_code(200);
  echo json_encode(['ok'=>false,'error'=>'server_error','hint'=>$e->getMessage()]);
}
