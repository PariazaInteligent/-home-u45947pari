<?php
// /api/chat/send.php — POST chat message (JSON sau form-data)
// Răspuns: { ok: bool, id?: int, ts?: int, role?: string, client_id?: string|null, mentions?: array, error?: string, hint?: string }
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

session_start();
$me = $_SESSION['user'] ?? null;

// csrf din sesiune (poți folosi ce nume vrei la generare)
$csrfExpected = $_SESSION['csrf_token_chat'] ?? $_SESSION['csrf_token'] ?? null;

if (!$me) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit;
}
session_write_close();

$uid   = (int)($me['id']   ?? 0);
$role  = strtoupper((string)($me['role'] ?? 'USER'));
$name  = trim((string)($me['name'] ?? ($me['email'] ?? 'Investitor')));
$ip    = (string)($_SERVER['REMOTE_ADDR']      ?? '');
$ua    = (string)($_SERVER['HTTP_USER_AGENT']  ?? '');
$now   = time();

// ——— Input (acceptăm JSON sau form) ———
$raw = file_get_contents('php://input') ?: '';
$in  = json_decode($raw, true);
if (!is_array($in)) $in = $_POST;

// csrf token primit (header sau câmp în body)
$csrfTokenIn = (string)($in['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));

if (!$csrfExpected || $csrfTokenIn === '' || !hash_equals((string)$csrfExpected, $csrfTokenIn)) {
  http_response_code(403);
  echo json_encode([
    'ok'    => false,
    'error' => 'csrf_invalid',
    'hint'  => 'token de securitate invalid sau lipsă. reîncarcă pagina și încearcă din nou.',
  ]);
  exit;
}

// text & client_id
$text = trim((string)($in['text'] ?? $in['message'] ?? $in['body'] ?? ''));
$cid  = trim((string)($in['client_id'] ?? ''));

// id-ul mesajului la care răspundem (reply_to)
$replyToIn = isset($in['reply_to']) ? (int)$in['reply_to'] : 0;

// atașamente (array sau string JSON)
$attachmentsIn = $in['attachments'] ?? [];
if (is_string($attachmentsIn)) {
  $attachmentsIn = json_decode($attachmentsIn, true) ?: [];
}

// le inițializăm simplu aici, fără funcții helper
$attachments = [];
$replyTo     = $replyToIn > 0 ? $replyToIn : 0;
$preview     = null;


try {
  require __DIR__ . '/../db.php'; // $pdo
  require __DIR__ . '/notifications_lib.php';
  require __DIR__ . '/meta_lib.php';

  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
  // acum funcțiile există (vin din meta_lib.php)
  $attachments = chat_filter_attachments($attachmentsIn);
  $preview     = $text !== '' ? chat_preview_from_text($text) : null;

  // Rezolvă numele pentru IDs dacă lipsesc
  if ($mentionsIds && count($mentionNames) < count($mentionsIds)) {
    $inIds = implode(',', array_fill(0, count($mentionsIds), '?'));
    $st = $pdo->prepare("SELECT id, COALESCE(NULLIF(TRIM(name),''), SUBSTRING_INDEX(email,'@',1)) AS nm
                         FROM users WHERE id IN ($inIds)");
    $st->execute($mentionsIds);
    $got = $st->fetchAll();
    $nameById = [];
    foreach ($got as $r) {
      $nm = trim((string)$r['nm']);
      if ($nm !== '') $nameById[(int)$r['id']] = $nm;
    }
    // completează lipsurile
    foreach ($mentionsIds as $mid) {
      $nm = $nameById[$mid] ?? null;
      if ($nm && !in_array($nm, $mentionNames, true)) $mentionNames[] = $nm;
    }
  }

  // ——— Detectăm schema tabelului pentru a construi dinamic INSERT/guard-uri ———
  $has = [
    'message'       => false,
    'body'          => false,
    'room'          => false,
    'user_id'       => false,
    'user_name'     => false,
    'role'          => false,
    'ip'            => false,
    'ua'            => false,
    'created_at'    => false,
    'client_id'     => false,
    'reply_to'      => false,
    // extensii mențiuni (oricare din acestea dacă există în schema)
    'mentions_json' => false,
    'mentions_ids'  => false,
    'mentions_names'=> false,
  ];

  try {
    $cols = $pdo->query("
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages'
    ")->fetchAll(PDO::FETCH_COLUMN);
    if ($cols) { foreach ($cols as $c) { if (isset($has[$c])) $has[$c] = true; } }
  } catch (Throwable $e) {
    foreach (['message','body','created_at'] as $c) $has[$c] = true; // fallback
  }

  // Alege coloana text
  $textCol = $has['message'] ? 'message' : ($has['body'] ? 'body' : null);
  if (!$textCol) {
    echo json_encode(['ok'=>false,'error'=>'server_error','hint'=>'no_text_column']); exit;
  }
  
  // dacă avem suport pentru reply_to, încercăm să recuperăm un snapshot al mesajului țintă
  $replyPreview = null;
  if ($replyTo > 0 && $has['reply_to']) {
    try {
       $sqlReply = "SELECT id,user_id,user_name,$textCol AS body FROM chat_messages WHERE id = :rid";
      if ($has['room']) $sqlReply .= " AND room = :room";
      $sqlReply .= " LIMIT 1";

      $stR = $pdo->prepare($sqlReply);
      $stR->bindValue(':rid', $replyTo, PDO::PARAM_INT);
      if ($has['room']) $stR->bindValue(':room', 'global', PDO::PARAM_STR);
      $stR->execute();
      $replyPreview = $stR->fetch();
      if (!$replyPreview) {
        $replyTo = 0; // mesajul nu există în cameră
      } else {
        $replyPreview['body'] = mb_substr(trim((string)($replyPreview['body'] ?? '')), 0, 240);
        $replyPreview['user_id'] = isset($replyPreview['user_id']) ? (int)$replyPreview['user_id'] : null;
      }
    } catch (Throwable $e) {
      $replyTo = 0; // nu blocăm trimiterea dacă lookup-ul eșuează
    }
  }

  // ——— Rate-limit per user + IP (idempotent-friendly, ignoră același client_id) + duplicate guard ———
  try {
    if ($has['created_at']) {

      // rate-limit per user (dacă avem user_id)
      if ($has['user_id'] && $uid > 0) {
        // 5 mesaje / 10 secunde
        $whereU = ["user_id = ?"];
        $paramsU = [$uid];
        if ($has['room']) {
          $whereU[] = "room = 'global'";
        }
        if ($has['client_id'] && $cid !== '') {
          $whereU[] = "(client_id IS NULL OR client_id <> ?)";
          $paramsU[] = $cid;
        }

        $st = $pdo->prepare("
          SELECT COUNT(*)
          FROM chat_messages
          WHERE ".implode(' AND ', $whereU)." AND created_at > (NOW() - INTERVAL 10 SECOND)
        ");
        $st->execute($paramsU);
        if ((int)$st->fetchColumn() >= 5) {
          http_response_code(429);
          echo json_encode([
            'ok'          => false,
            'error'       => 'throttled',
            'hint'        => 'prea multe mesaje trimise într-un interval scurt (cont). încearcă din nou peste câteva secunde.',
            'retry_after' => 10,
          ]);
          exit;
        }

        // 20 mesaje / 60 secunde
        $st = $pdo->prepare("
          SELECT COUNT(*)
          FROM chat_messages
          WHERE ".implode(' AND ', $whereU)." AND created_at > (NOW() - INTERVAL 60 SECOND)
        ");
        $st->execute($paramsU);
        if ((int)$st->fetchColumn() >= 20) {
          http_response_code(429);
          echo json_encode([
            'ok'          => false,
            'error'       => 'throttled',
            'hint'        => 'ai trimis prea multe mesaje într-un minut. ia o pauză scurtă și revino.',
            'retry_after' => 60,
          ]);
          exit;
        }
      }

      // rate-limit per IP (independent de user_id)
      if ($has['ip'] && $ip !== '') {
        $whereIP = ["ip = ?"];
        $paramsIP = [$ip];
        if ($has['room']) {
          $whereIP[] = "room = 'global'";
        }
        if ($has['client_id'] && $cid !== '') {
          $whereIP[] = "(client_id IS NULL OR client_id <> ?)";
          $paramsIP[] = $cid;
        }

        // 10 mesaje / 30 secunde per IP
        $st = $pdo->prepare("
          SELECT COUNT(*)
          FROM chat_messages
          WHERE ".implode(' AND ', $whereIP)." AND created_at > (NOW() - INTERVAL 30 SECOND)
        ");
        $st->execute($paramsIP);
        if ((int)$st->fetchColumn() >= 10) {
          http_response_code(429);
          echo json_encode([
            'ok'          => false,
            'error'       => 'throttled',
            'hint'        => 'prea mult trafic de pe acest IP într-un interval foarte scurt. încearcă din nou peste câteva secunde.',
            'retry_after' => 30,
          ]);
          exit;
        }

        // 60 mesaje / 5 minute per IP
        $st = $pdo->prepare("
          SELECT COUNT(*)
          FROM chat_messages
          WHERE ".implode(' AND ', $whereIP)." AND created_at > (NOW() - INTERVAL 300 SECOND)
        ");
        $st->execute($paramsIP);
        if ((int)$st->fetchColumn() >= 60) {
          http_response_code(429);
          echo json_encode([
            'ok'          => false,
            'error'       => 'throttled',
            'hint'        => 'prea multe mesaje trimise de pe acest IP. încearcă din nou peste câteva minute.',
            'retry_after' => 300,
          ]);
          exit;
        }
      }

      // Duplicate 30 sec (același text, același user sau IP, alt client_id)
      $whereD = ["$textCol = ?"];
      $paramsD = [$text];

      if ($has['user_id'] && $uid > 0) {
        $whereD[]  = "user_id = ?";
        $paramsD[] = $uid;
      } elseif ($has['ip'] && $ip !== '') {
        $whereD[]  = "ip = ?";
        $paramsD[] = $ip;
      }

      if ($has['room']) {
        $whereD[] = "room = 'global'";
      }

      $whereD[] = "created_at > (NOW() - INTERVAL 30 SECOND)";

      if ($has['client_id'] && $cid !== '') {
        $whereD[]  = "(client_id IS NULL OR client_id <> ?)";
        $paramsD[] = $cid;
      }

      $stD = $pdo->prepare("
        SELECT COUNT(*)
        FROM chat_messages
        WHERE ".implode(' AND ', $whereD)."
      ");
      $stD->execute($paramsD);
      if ((int)$stD->fetchColumn() > 0) {
        echo json_encode([
          'ok'    => false,
          'error' => 'duplicate',
          'hint'  => 'ai trimis deja exact același mesaj în ultimele secunde.',
        ]);
        exit;
      }
    }
  } catch (Throwable $e) {
    // nu blocăm la erori de throttle/rate-limit/dup
  }

  // ——— Pregătește payload mențiuni pentru DB ———
  // vom salva JSON-ul ['ids'=>[], 'names'=>[]] dacă avem o coloană dedicată; alternativ, ids/names separat (tot JSON string)
  $mentionsJSON = json_encode(['ids'=>$mentionsIds, 'names'=>$mentionNames], JSON_UNESCAPED_UNICODE);

  // ——— Insert dinamic + idempotency pe client_id ———
  $cols = [$textCol];
  $vals = [':text'];
  $bind = [':text' => $text];

  if ($has['room'])      { $cols[]='room';      $vals[]=':room';      $bind[':room'] = 'global'; }
  if ($has['user_id'])   { $cols[]='user_id';   $vals[]=':uid';       $bind[':uid']  = $uid; }
  if ($has['user_name']) { $cols[]='user_name'; $vals[]=':uname';     $bind[':uname']= $name; }
  if ($has['role'])      { $cols[]='role';      $vals[]=':role';      $bind[':role'] = $role; }
  if ($has['ip'])        { $cols[]='ip';        $vals[]=':ip';        $bind[':ip']   = $ip; }
  if ($has['ua'])        { $cols[]='ua';        $vals[]=':ua';        $bind[':ua']   = $ua; }
  if ($has['client_id']) { $cols[]='client_id'; $vals[]=':cid';       $bind[':cid']  = ($cid !== '') ? $cid : null; }
  if ($has['reply_to'])  { $cols[]='reply_to';  $vals[]=':replyto';   $bind[':replyto'] = $replyTo ?: null; }
  if ($has['created_at']){ $cols[]='created_at';$vals[]='FROM_UNIXTIME(:ts)'; $bind[':ts'] = $now; }

  // mențiuni — oricare schemă disponibilă
  if ($has['mentions_json']) {
    $cols[]='mentions_json'; $vals[]=':mjson'; $bind[':mjson'] = $mentionsJSON;
  } else {
    if ($has['mentions_ids'])   { $cols[]='mentions_ids';   $vals[]=':mids';  $bind[':mids']  = json_encode($mentionsIds); }
    if ($has['mentions_names']) { $cols[]='mentions_names'; $vals[]=':mnames';$bind[':mnames']= json_encode($mentionNames, JSON_UNESCAPED_UNICODE); }
  }

  // baza pentru idempotency:
  // — asigură UNIC pe client_id în DB (ex: ALTER TABLE chat_messages ADD UNIQUE KEY uq_chat_client_id (client_id));
  // — ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id) => la retry cu același client_id întoarce același id
  $sql = "INSERT INTO chat_messages (".implode(',', $cols).") VALUES (".implode(',', $vals).")";

  if ($has['client_id'] && $cid !== '') {
    $sql .= " ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)";
  }

  $st  = $pdo->prepare($sql);
  $st->execute($bind);

  $id = (int)$pdo->lastInsertId();
  
  // notificări pentru mențiuni + răspuns direct
  $notifRows = [];
  if ($id > 0) {
    foreach ($mentionsIds as $mid) {
      if ($mid > 0 && $mid !== $uid) {
        $notifRows[] = [
          'user_id'    => $mid,
          'message_id' => $id,
          'kind'       => 'mention',
        ];
      }
    }

    $replyAuthorId = (int)($replyPreview['user_id'] ?? 0);
    if ($replyAuthorId > 0 && $replyAuthorId !== $uid) {
      $notifRows[] = [
        'user_id'    => $replyAuthorId,
        'message_id' => $id,
        'kind'       => 'reply',
      ];
    }

    if ($notifRows) {
      insertChatNotifications($pdo, $notifRows);
    }
  }
// salvăm meta (atașamente + preview link + reply snapshot) pe disc
if ($id > 0) {
  $metaPayload = [];

  if ($attachments) {
    $metaPayload['attachments'] = $attachments;
  }

  if ($preview) {
    $metaPayload['link_preview'] = $preview;
  }

  // snapshot de reply, ca să îl vadă toată lumea, nu doar cel care trimite
  if ($replyPreview && $replyTo) {
    $metaPayload['reply_to'] = (int)$replyTo;
    $metaPayload['reply'] = [
      'id'        => (int)($replyPreview['id'] ?? $replyTo),
      'user_id'   => isset($replyPreview['user_id']) ? (int)$replyPreview['user_id'] : null,
      'user_name' => (string)($replyPreview['user_name'] ?? ''),
      'body'      => (string)($replyPreview['body'] ?? ''),
    ];
  }

  if ($metaPayload) {
    chat_save_meta($id, $metaPayload);
  }
}

  // răspuns: includem și mențiunile (clientul le poate folosi pentru confirmPending)
  $respMentions = [];
  foreach ($mentionNames as $nm) {
    if ($nm==='') continue;
    $respMentions[] = ['user_id'=>null, 'name'=>$nm];
  }
  // dacă am și ids și pot mapa 1:1, încearcă să le asociezi
  if ($mentionsIds && count($mentionsIds) === count($respMentions)) {
    foreach ($mentionsIds as $k=>$mid) {
      if (isset($respMentions[$k])) $respMentions[$k]['user_id'] = (int)$mid;
    }
  }

  echo json_encode([
    'ok'        => true,
    'id'        => $id,
    'ts'        => $now,
    'role'      => $role,
    'client_id' => $has['client_id'] ? ($cid !== '' ? $cid : null) : null,
    'mentions'  => $respMentions,
    'reply_to'  => $replyTo ?: null,
    'reply'     => ($replyPreview && $replyTo)
      ? [
          'id'        => (int)($replyPreview['id'] ?? $replyTo),
           'user_id'   => isset($replyPreview['user_id']) ? (int)$replyPreview['user_id'] : null,
          'user_name' => (string)($replyPreview['user_name'] ?? ''),
          'body'      => (string)($replyPreview['body'] ?? ''),
        ]
      : null,
      'attachments' => $attachments,
    'link_preview'=> $preview,
  ]);
} catch (Throwable $e) {
  http_response_code(200);
  echo json_encode(['ok'=>false,'error'=>'server_error','hint'=>$e->getMessage()]);
}
