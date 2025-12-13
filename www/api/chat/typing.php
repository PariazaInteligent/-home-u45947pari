<?php
// POST: semnal „tastez” (debounced din frontend).
// Body JSON: { stop?:bool }  => dacă stop=true, curățăm imediat.
// Răspuns: { ok:true }
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

session_start();
$me = $_SESSION['user'] ?? null;
if (!$me) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'auth']); exit; }
session_write_close();

$uid  = (int)($me['id'] ?? 0);
$uname= trim($me['name'] ?? ($me['email'] ?? 'Investitor'));
$room = 'global';

$raw  = file_get_contents('php://input');
$in   = json_decode($raw, true) ?: [];

require __DIR__.'/../db.php';
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
  $pdo->exec("CREATE TABLE IF NOT EXISTS chat_typing (
      user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
      user_name VARCHAR(120) NOT NULL,
      room VARCHAR(64) NOT NULL DEFAULT 'global',
      until_ts TIMESTAMP NOT NULL,
      KEY idx_until (until_ts), KEY idx_room (room, until_ts)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  if (!empty($in['stop'])) {
    $st = $pdo->prepare("DELETE FROM chat_typing WHERE user_id = :uid");
    $st->execute([':uid'=>$uid]);
    echo json_encode(['ok'=>true]); exit;
  }

  // semnal valabil încă 6 secunde
  $st = $pdo->prepare("INSERT INTO chat_typing (user_id,user_name,room,until_ts)
                       VALUES (:uid,:uname,:room, NOW() + INTERVAL 6 SECOND)
                       ON DUPLICATE KEY UPDATE user_name=VALUES(user_name), room=VALUES(room),
                                               until_ts=NOW() + INTERVAL 6 SECOND");
  $st->execute([':uid'=>$uid, ':uname'=>$uname, ':room'=>$room]);
  echo json_encode(['ok'=>true]);
} catch (Throwable $e) {
  http_response_code(200);
  echo json_encode(['ok'=>false,'error'=>'server_error','hint'=>$e->getMessage()]);
}
