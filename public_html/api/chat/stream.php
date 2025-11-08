<?php
// /api/chat/stream.php — Server-Sent Events (SSE) pentru Chat Comunitate
declare(strict_types=1);

session_start();
$me = $_SESSION['user'] ?? null;
session_write_close(); // eliberăm lock-ul de sesiune

// —— Output: anti-buffering & anti-proxy ——
@ini_set('zlib.output_compression', '0');
@ini_set('output_buffering',        '0');
@ini_set('implicit_flush',          '1');
while (ob_get_level() > 0) { @ob_end_flush(); }
ob_implicit_flush(true);
if (function_exists('apache_setenv')) {
  @apache_setenv('no-gzip',  '1');
  @apache_setenv('dont-vary','1');
}
@set_time_limit(0);

// —— Headere SSE ——
header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-transform');
header('Pragma: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no'); // Nginx/Cloudflare: nu tampona

require __DIR__ . '/../db.php'; // $pdo
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

// —— Ultimul ID livrat (din query sau din Last-Event-ID) ——
$lastIdQ  = (int)($_GET['last_id'] ?? 0);
$lastIdH  = (int)($_SERVER['HTTP_LAST_EVENT_ID'] ?? 0);
$lastId   = max(0, $lastIdQ, $lastIdH);

// —— Detectăm coloana room (opțional) ——
$hasRoom = false;
$hasBody = false;
$hasMessage = false;
try {
  $q = $pdo->query("
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'chat_messages'
      AND COLUMN_NAME IN ('room','body','message')
  ");
 foreach ($q ?: [] as $row) {
    if (!isset($row['COLUMN_NAME'])) continue;
    $col = strtolower((string)$row['COLUMN_NAME']);
    if ($col === 'room') $hasRoom = true;
    elseif ($col === 'body') $hasBody = true;
    elseif ($col === 'message') $hasMessage = true;
  }
} catch (Throwable $e) {
  // ignorați — păstrăm valorile implicite
}

if (!$hasBody && !$hasMessage) {
  $bodyExpr = "''";
} elseif ($hasBody && $hasMessage) {
  $bodyExpr = "COALESCE(NULLIF(body,''), message)";
} elseif ($hasBody) {
  $bodyExpr = 'body';
} else {
  $bodyExpr = 'message';
}

// —— Comunică browserului strategia de retry + padding anti-proxy ——
echo "retry: 3000\n";
echo ':' . str_repeat(' ', 2048) . "\n\n";
@ob_flush(); @flush();

// —— Parametri runtime ——
$HB_EVERY = 5;     // heartbeat la 5s
$POLL_SEC = 1;     // interogăm DB la 1s
$WINDOW   = 25;    // închidem grațios la ~25s (browserul reconectează)
$started  = time();
$lastBeat = time() - $HB_EVERY + 1;

// Helper de trimitere evenimente
$send = function (string $event, array $data, ?int $id = null) {
  if ($id !== null) echo "id: {$id}\n";
  echo "event: {$event}\n";
  echo "data: " . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n\n";
  @ob_flush(); @flush();
};

// ——— Backlog inițial ———
try {
  $sql = "SELECT id,user_id,user_name,role,{$bodyExpr} AS body,
                 UNIX_TIMESTAMP(created_at) AS ts
          FROM chat_messages
          WHERE id > :last_id";
  if ($hasRoom) $sql .= " AND room = :room";
  $sql .= " ORDER BY id ASC LIMIT 200";

  $stmt = $pdo->prepare($sql);
  $stmt->bindValue(':last_id', $lastId, PDO::PARAM_INT);
  if ($hasRoom) $stmt->bindValue(':room', 'global', PDO::PARAM_STR);
  $stmt->execute();

  while ($m = $stmt->fetch()) {
    $mid = (int)$m['id'];
    $send('message', $m, $mid);
    $lastId = $mid;
  }
} catch (Throwable $e) {
  // nu omorâm streamul dacă a eșuat backlogul
}

$send('hello', ['ok' => true, 'last_id' => $lastId], $lastId);

// ——— Bucla SSE ———
while (true) {
  if (connection_aborted()) break;

  // Heartbeat (menține conexiunea vie prin proxy/firewall)
  if (time() - $lastBeat >= $HB_EVERY) {
    $send('ping', ['t' => time()], $lastId);
    $lastBeat = time();
  }

  // Durată fereastră — închidere grațioasă (browserul reia cu Last-Event-ID)
  if (time() - $started > $WINDOW) {
    $send('bye', ['t' => time(), 'last_id' => $lastId], $lastId);
    break;
  }

  // Mesaje noi după ultimul id
  try {
    $sql = "SELECT id,user_id,user_name,role,{$bodyExpr} AS body,
                   UNIX_TIMESTAMP(created_at) AS ts
            FROM chat_messages
            WHERE id > :last_id";
    if ($hasRoom) $sql .= " AND room = :room";
    $sql .= " ORDER BY id ASC LIMIT 200";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':last_id', $lastId, PDO::PARAM_INT);
    if ($hasRoom) $stmt->bindValue(':room', 'global', PDO::PARAM_STR);
    $stmt->execute();

    while ($m = $stmt->fetch()) {
      $mid = (int)$m['id'];
      $send('message', $m, $mid);
      $lastId = $mid;
    }
  } catch (Throwable $e) {
    // eroare tranzitorie DB — ignorăm și continuăm
  }

  usleep($POLL_SEC * 1000000); // pauză scurtă
}
