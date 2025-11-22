<?php
// /api/chat/stream.php — SSE mesaje + prezență + typing (+mentions)
// Evenimente trimise: hello, message, presence, typing, ping, bye
declare(strict_types=1);

// ——— auth (menținem stilul tău: dacă nu e logat, închidem politicos) ———
session_start();
$me = $_SESSION['user'] ?? null;
session_write_close();

// ——— transport: dezactivăm buffering/compression pentru SSE ———
@ini_set('zlib.output_compression','0');
@ini_set('output_buffering','0');
@ini_set('implicit_flush','1');
while (ob_get_level() > 0) { @ob_end_flush(); }
ob_implicit_flush(true);
if (function_exists('apache_setenv')) {
  @apache_setenv('no-gzip','1');
  @apache_setenv('dont-vary','1');
}
@set_time_limit(0);

header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-transform');
header('Pragma: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no'); // nginx

require __DIR__ . '/../db.php';
$pdo = $pdo ?? null;
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

// ——— parametru de reconectare ———
$lastIdQ = (int)($_GET['last_id'] ?? 0);
$lastIdH = (int)($_SERVER['HTTP_LAST_EVENT_ID'] ?? 0);
$lastId  = max(0, $lastIdQ, $lastIdH);

// ——— detectare dinamică a coloanelor ———
$has = [
  'room'        => false,
  'message'     => false,
  'body'        => false,
  'client_id'   => false,
  'created_at'  => false,
  
  'edited_at'   => false,
  'updated_at'  => false,
  
  'mentions_js' => false, // mentions_json
];
try {
  $cols = $pdo->query("
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages'
  ")->fetchAll(PDO::FETCH_COLUMN);
  foreach ($cols as $c) {
    if ($c === 'room') $has['room'] = true;
    if ($c === 'message') $has['message'] = true;
    if ($c === 'body') $has['body'] = true;
    if ($c === 'client_id') $has['client_id'] = true;
    if ($c === 'created_at') $has['created_at'] = true;
    
    if ($c === 'edited_at') $has['edited_at'] = true;
    if ($c === 'updated_at') $has['updated_at'] = true;
    
    if ($c === 'mentions_json') $has['mentions_js'] = true;
  }
} catch (Throwable $e) {
  // fallback minimal
  $has['message'] = true;
  $has['created_at'] = true;
}

$textCol = $has['message'] ? 'message' : ($has['body'] ? 'body' : null);
$tsExpr  = $has['created_at'] ? "UNIX_TIMESTAMP(created_at)" : "UNIX_TIMESTAMP(NOW())";
$roomVal = $has['room'] ? 'global' : null;

$selCols = "id,user_id,user_name,role,$textCol AS body,$tsExpr AS ts";
if ($has['client_id']) $selCols .= ", client_id";

if ($has['edited_at']) $selCols .= ", UNIX_TIMESTAMP(edited_at) AS edited_at";
if ($has['updated_at']) $selCols .= ", UNIX_TIMESTAMP(updated_at) AS updated_at";

if ($has['mentions_js']) $selCols .= ", mentions_json";

// ——— util: encoder SSE ———
$send = function(string $event, array $data, ?int $id=null) {
  if ($id !== null) echo "id: {$id}\n";
  echo "event: {$event}\n";
  echo "data: " . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n\n";
  @ob_flush(); @flush();
};

// ——— util: normalizare rând (mentions_json ➜ mentions[]) ———
$normalize = function(array $m) use ($has): array {
  // tipuri
  $m['id']        = isset($m['id'])        ? (int)$m['id'] : 0;
  $m['user_id']   = isset($m['user_id'])   ? (int)$m['user_id'] : 0;
  $m['ts']        = isset($m['ts'])        ? (int)$m['ts'] : time();
  $m['user_name'] = isset($m['user_name']) ? (string)$m['user_name'] : '';
  $m['role']      = strtoupper((string)($m['role'] ?? 'USER'));
  $m['body']      = (string)($m['body'] ?? '');

  if ($has['client_id'] && array_key_exists('client_id', $m)) {
    // păstrăm null dacă e gol
    $m['client_id'] = ($m['client_id'] === '' ? null : $m['client_id']);
  }

  if ($has['mentions_js'] && array_key_exists('mentions_json', $m)) {
    $raw = $m['mentions_json'];
    unset($m['mentions_json']);
    if ($raw !== null && $raw !== '') {
      $mj = json_decode((string)$raw, true);
      if (is_array($mj)) {
        $ids   = array_values(array_map('intval', (array)($mj['ids']   ?? [])));
        $names = array_values(array_map(fn($x)=>trim((string)$x), (array)($mj['names'] ?? [])));
        $out = [];
        $n = max(count($ids), count($names));
        for ($i=0; $i<$n; $i++) {
          $row = [ 'user_id' => $ids[$i] ?? null, 'name' => $names[$i] ?? null ];
          if (!($row['user_id']===null && ($row['name']===null || $row['name']===''))) $out[] = $row;
        }
        if ($out) $m['mentions'] = $out;
      }
    }
  }
  
  // marchează mesajele editate dacă avem coloana în schemă
  $m['edited'] = false;
  if ($has['edited_at'] && array_key_exists('edited_at', $m)) {
    $m['edited_at'] = $m['edited_at'] ? (int)$m['edited_at'] : null;
    $m['edited']    = $m['edited_at'] !== null;
  } elseif ($has['updated_at'] && array_key_exists('updated_at', $m)) {
    $m['updated_at'] = $m['updated_at'] ? (int)$m['updated_at'] : null;
    $m['edited']     = $m['updated_at'] !== null && ($has['created_at'] ? $m['updated_at'] > (int)$m['ts'] : true);
  }
  
  return $m;
};

// ——— handshake SSE ———
echo "retry: 3000\n";
echo ':' . str_repeat(' ', 2048) . "\n\n"; // kickstart buffer
@ob_flush(); @flush();

// ——— timers ———
$HB_EVERY   = 5;   // ping
$POLL_SEC   = 1;   // fetch mesaje
$WINDOW     = 25;  // reconectare grațioasă
$PRES_EVERY = 6;   // refresh presence/typing

$started  = time();
$lastBeat = time() - $HB_EVERY + 1;
$lastPres = time() - $PRES_EVERY + 1;

// ——— backlog inițial ———
try {
  $sql = "SELECT $selCols FROM chat_messages WHERE id > :last_id";
  if ($has['room']) $sql .= " AND room = :room";
  $sql .= " ORDER BY id ASC LIMIT 200";
  $st = $pdo->prepare($sql);
  $st->bindValue(':last_id', $lastId, PDO::PARAM_INT);
  if ($has['room']) $st->bindValue(':room', $roomVal, PDO::PARAM_STR);
  $st->execute();
  while ($row = $st->fetch()) {
    $row = $normalize($row);
    $mid = (int)$row['id'];
    $send('message', $row, $mid);
    $lastId = $mid;
  }
} catch (Throwable $e) {
  // ignorăm eșecul de backlog; clientul are fallback la /fetch.php
}

// ——— hello + auth hint ———
$send('hello', [
  'ok'      => (bool)$me,
  'last_id' => $lastId,
  'now'     => time()
], $lastId);

// ——— helpers presence/typing (sigur încapsulate) ———
$getPresence = function() use ($pdo,$has,$roomVal) {
  try {
    // dacă lipsesc tabelele, returnăm [] fără a arunca
    $pdo->query("SELECT 1 FROM chat_presence LIMIT 1");
  } catch (Throwable $e) { return []; }

  $sql = "SELECT user_id,user_name,UNIX_TIMESTAMP(last_seen) AS ts
          FROM chat_presence
          WHERE last_seen > (NOW() - INTERVAL 40 SECOND)";
  if ($has['room']) $sql .= " AND room = :room";
  $sql .= " ORDER BY last_seen DESC LIMIT 50";
  $st = $pdo->prepare($sql);
  if ($has['room']) $st->bindValue(':room', $roomVal, PDO::PARAM_STR);
  try { $st->execute(); return $st->fetchAll(); } catch (Throwable $e) { return []; }
};
$getTyping = function() use ($pdo,$has,$roomVal) {
  try {
    $pdo->query("SELECT 1 FROM chat_typing LIMIT 1");
  } catch (Throwable $e) { return []; }

  $sql = "SELECT user_id,user_name
          FROM chat_typing
          WHERE until_ts > NOW()";
  if ($has['room']) $sql .= " AND room = :room";
  $sql .= " ORDER BY until_ts DESC LIMIT 20";
  $st = $pdo->prepare($sql);
  if ($has['room']) $st->bindValue(':room', $roomVal, PDO::PARAM_STR);
  try { $st->execute(); return $st->fetchAll(); } catch (Throwable $e) { return []; }
};

$lastPresenceHash = '';
$lastTypingHash   = '';

// ——— fotografie inițială de prezență/typing ———
try {
  $P0 = $getPresence();
  $T0 = $getTyping();
  $lastPresenceHash = sha1(json_encode($P0));
  $lastTypingHash   = sha1(json_encode($T0));
  $send('presence', ['users'=>$P0, 'now'=>time()], null);
  $send('typing',   ['users'=>$T0], null);
} catch (Throwable $e) {
  // silent
}

// ——— dacă nu e logat, trimitem bye rapid (menținem handshake pentru compatibilitate UI) ———
if (!$me) {
  $send('bye', ['t'=>time(), 'last_id'=>$lastId, 'error'=>'auth'], $lastId);
  exit;
}

// ——— bucla SSE ———
while (true) {
  if (connection_aborted()) break;

  // ping
  if (time() - $lastBeat >= $HB_EVERY) {
    $send('ping', ['t'=>time()], $lastId);
    $lastBeat = time();
  }

  // presence/typing
  if (time() - $lastPres >= $PRES_EVERY) {
    $lastPres = time();
    $P = $getPresence(); $hP = sha1(json_encode($P));
    if ($hP !== $lastPresenceHash) {
      $lastPresenceHash = $hP;
      $send('presence', ['users'=>$P, 'now'=>time()], null);
    }
    $T = $getTyping(); $hT = sha1(json_encode($T));
    if ($hT !== $lastTypingHash) {
      $lastTypingHash = $hT;
      $send('typing', ['users'=>$T], null);
    }
  }

  // fereastră de reconectare grațioasă
  if (time() - $started > $WINDOW) {
    $send('bye', ['t'=>time(), 'last_id'=>$lastId], $lastId);
    break;
  }

  // mesaje noi (ASC)
  try {
    $sql = "SELECT $selCols
            FROM chat_messages
            WHERE id > :last_id";
    if ($has['room']) $sql .= " AND room = :room";
    $sql .= " ORDER BY id ASC LIMIT 200";
    $st = $pdo->prepare($sql);
    $st->bindValue(':last_id', $lastId, PDO::PARAM_INT);
    if ($has['room']) $st->bindValue(':room', $roomVal, PDO::PARAM_STR);
    $st->execute();

    while ($row = $st->fetch()) {
      $row = $normalize($row);
      $mid = (int)$row['id'];
      $send('message', $row, $mid);
      $lastId = $mid;
    }
  } catch (Throwable $e) {
    // transient DB error: continuăm; clientul are fallback la /fetch.php
  }

  usleep(1000000 * $POLL_SEC);
}

// când găsești type='reaction'
echo "event: reaction\n";
echo "data: {$row['payload_json']}\n\n";
@ob_flush(); @flush();

