<?php
// GET /api/chat/presence_online.php
// răspuns: { ok:true, online:int, list:[{user_id,user_name,room,ts}] }

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

session_start();
$me = $_SESSION['user'] ?? null;
if (!$me) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'auth']);
  exit;
}
session_write_close();

$room = 'global';

require __DIR__ . '/../db.php';
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
  // ne asigurăm că tabela există (o face și presence_ping, dar e safe)
  $pdo->exec("CREATE TABLE IF NOT EXISTS chat_presence (
      user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
      user_name VARCHAR(120) NOT NULL,
      room VARCHAR(64) NOT NULL DEFAULT 'global',
      last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_seen (last_seen),
      KEY idx_room (room, last_seen)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

  // considerăm online userii văzuți în ultimele 70 secunde
  $sql = "SELECT user_id, user_name, room, UNIX_TIMESTAMP(last_seen) AS ts
          FROM chat_presence
          WHERE room = :room
            AND last_seen >= (NOW() - INTERVAL 70 SECOND)
          ORDER BY last_seen DESC";

  $st = $pdo->prepare($sql);
  $st->execute([':room' => $room]);
  $rows = $st->fetchAll(PDO::FETCH_ASSOC);

  $list = [];
  foreach ($rows as $r) {
    $list[] = [
      'user_id'   => (int)($r['user_id'] ?? 0),
      'user_name' => (string)($r['user_name'] ?? ''),
      'room'      => (string)($r['room'] ?? ''),
      'ts'        => (int)($r['ts'] ?? 0),
    ];
  }

  echo json_encode([
    'ok'     => true,
    'online' => count($list),
    'list'   => $list,
  ]);
} catch (Throwable $e) {
  http_response_code(200);
  echo json_encode([
    'ok'    => false,
    'error' => 'server_error',
    'hint'  => $e->getMessage(),
  ]);
}
