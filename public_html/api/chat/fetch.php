<?php
// /api/chat/fetch.php
// GET: limit?, since_id?, before_id?, around_id?, window?
// Răspuns: { ok:bool, items:[{id,user_id,user_name,role,body,ts(,client_id)?,(mentions)?}] }
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

session_start();
$me = $_SESSION['user'] ?? null;
if (!$me) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'auth']); exit; }
session_write_close();

$limit    = max(1, min(100, (int)($_GET['limit'] ?? 50)));
$sinceId  = (int)($_GET['since_id']  ?? 0);
$beforeId = (int)($_GET['before_id'] ?? 0);
$aroundId = (int)($_GET['around_id'] ?? 0);
$window   = max(1, min(200, (int)($_GET['window'] ?? 30)));

try {
  require __DIR__ . '/../db.php'; // $pdo
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

  // ——— detectăm coloane dinamice ———
  $hasRoom       = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'room'")->fetch();
  $hasMsg        = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'message'")->fetch();
  $hasBody       = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'body'")->fetch();
  $hasCli        = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'client_id'")->fetch();
  $hasCreatedAt  = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'created_at'")->fetch();
  
  $hasEditedAt   = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'edited_at'")->fetch();
  $hasUpdatedAt  = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'updated_at'")->fetch();
  
  $hasMentionsJ  = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'mentions_json'")->fetch();
  
  $hasReplyTo    = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'reply_to'")->fetch();
  $hasUserId     = (bool)$pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'user_id'")->fetch();

  $textCol = $hasMsg ? 'message' : ($hasBody ? 'body' : null);
  if (!$textCol) { echo json_encode(['ok'=>false,'error'=>'no_text_column']); exit; }

  $tsExpr = $hasCreatedAt ? "UNIX_TIMESTAMP(created_at)" : "UNIX_TIMESTAMP(NOW())";

  // coloană SELECT comună
  $selCols = "id,user_id,user_name,role,$textCol AS body,$tsExpr AS ts";
  if ($hasCli)       $selCols .= ", client_id";
  
  if ($hasEditedAt) {
    $selCols .= ", UNIX_TIMESTAMP(edited_at) AS edited_at";
  } elseif ($hasEditTable) {
    $selCols .= ", UNIX_TIMESTAMP(e.edited_at) AS edited_at";
  }
  if ($hasUpdatedAt) $selCols .= ", UNIX_TIMESTAMP(updated_at) AS updated_at";
  
  if ($hasMentionsJ) $selCols .= ", mentions_json";
  
  if ($hasReplyTo)   $selCols .= ", reply_to";
  
  $editedJoin = (!$hasEditedAt && $hasEditTable) ? " LEFT JOIN chat_message_edits e ON e.message_id = chat_messages.id" : "";

  $roomWhere = $hasRoom ? " AND room='global'" : "";

  $items = [];

  if ($sinceId > 0) {
    // mesaje mai noi decât since_id (ASC)
    $sql = "SELECT $selCols
            FROM chat_messages$editedJoin
            WHERE id > :id$roomWhere
            ORDER BY id ASC
            LIMIT :lim";
    $st = $pdo->prepare($sql);
    $st->bindValue(':id',  $sinceId, PDO::PARAM_INT);
    $st->bindValue(':lim', $limit,   PDO::PARAM_INT);
    $st->execute();
    $items = $st->fetchAll();
  } elseif ($beforeId > 0) {
    // mesaje mai vechi decât before_id, întoarse ASC
    $sql = "SELECT * FROM (
              SELECT $selCols
              FROM chat_messages$editedJoin
              WHERE id < :bid$roomWhere
              ORDER BY id DESC
              LIMIT :lim
            ) t ORDER BY t.id ASC";
    $st = $pdo->prepare($sql);
    $st->bindValue(':bid', $beforeId, PDO::PARAM_INT);
    $st->bindValue(':lim', $limit,    PDO::PARAM_INT);
    $st->execute();
    $items = $st->fetchAll();
  } elseif ($aroundId > 0) {
    // fereastră în jurul unui ID (±window), totul ASC
    $olderSql = "SELECT $selCols
                 FROM chat_messages$editedJoin
                 WHERE id < :aid$roomWhere
                 ORDER BY id DESC
                 LIMIT :win";
    $newerSql = "SELECT $selCols
                 FROM chat_messages
                 WHERE id > :aid$roomWhere
                 ORDER BY id ASC
                 LIMIT :win";

    $stO = $pdo->prepare($olderSql);
    $stO->bindValue(':aid', $aroundId, PDO::PARAM_INT);
    $stO->bindValue(':win', $window,   PDO::PARAM_INT);
    $stO->execute();
    $older = $stO->fetchAll();
    $older = array_reverse($older); // înapoi la ASC

    $stC = $pdo->prepare("SELECT $selCols FROM chat_messages$editedJoin WHERE id=:aid".($hasRoom?" AND room='global'":"")." LIMIT 1");
    $stC->bindValue(':aid', $aroundId, PDO::PARAM_INT);
    $stC->execute();
    $center = $stC->fetchAll();

    $stN = $pdo->prepare($newerSql);
    $stN->bindValue(':aid', $aroundId, PDO::PARAM_INT);
    $stN->bindValue(':win', $window,   PDO::PARAM_INT);
    $stN->execute();
    $newer = $stN->fetchAll();

    $items = array_values(array_merge($older, $center, $newer));
  } else {
    // ultimele „limit” mesaje (ASC)
    $sql = "SELECT * FROM (
              SELECT $selCols
              FROM chat_messages$editedJoin
              ".($hasRoom ? "WHERE room='global'" : "")."
              ORDER BY id DESC
              LIMIT :lim
            ) t ORDER BY t.id ASC";
    $st = $pdo->prepare($sql);
    $st->bindValue(':lim', $limit, PDO::PARAM_INT);
    $st->execute();
    $items = $st->fetchAll();
  }

  // ——— normalizează mențiunile (doar dacă avem mentions_json în schemă) ———
  if ($items) {
    foreach ($items as &$m) {
      // mențiuni normalizate
      if ($hasMentionsJ && array_key_exists('mentions_json', $m)) {
        $raw = $m['mentions_json'];
        unset($m['mentions_json']);
        if ($raw !== null && $raw !== '') {
          $mj = json_decode((string)$raw, true);
          if (is_array($mj)) {
            $ids   = array_values(array_map('intval', (array)($mj['ids']   ?? [])));
            $names = array_values(array_map(function($x){ return trim((string)$x); }, (array)($mj['names'] ?? [])));

            // mapare 1:1 pe index, dacă există
            $out = [];
            $n = max(count($ids), count($names));
            for ($i=0; $i<$n; $i++){
              $out[] = [
                'user_id' => $ids[$i]   ?? null,
                'name'    => $names[$i] ?? null,
              ];
            }
            // elimină intrările complet goale
            $out = array_values(array_filter($out, function($r){
              return !($r['user_id']===null && ($r['name']===null || $r['name']===''));
            }));
            if ($out) $m['mentions'] = $out;
          }
        }
      }

      // flag „editat” dacă avem coloana în schemă
      $m['edited'] = false;
      if ($hasEditedAt && array_key_exists('edited_at', $m)) {
        $m['edited_at'] = $m['edited_at'] ? (int)$m['edited_at'] : null;
        $m['edited']    = $m['edited_at'] !== null;
      } elseif ($hasUpdatedAt && array_key_exists('updated_at', $m)) {
        $m['updated_at'] = $m['updated_at'] ? (int)$m['updated_at'] : null;
        $m['edited']     = $m['updated_at'] !== null && ($hasCreatedAt ? $m['updated_at'] > (int)$m['ts'] : true);
      }
      
    }
    unset($m);
  }

// ——— atașează pre-vizualizare pentru reply_to (dacă există coloană) ———
  if ($hasReplyTo && $items) {
    $replyIds = [];
    foreach ($items as $m) {
      $rid = (int)($m['reply_to'] ?? 0);
      if ($rid > 0) $replyIds[] = $rid;
    }

    $replyIds = array_values(array_unique($replyIds));

    $replyMap = [];
    if ($replyIds) {
      $in = implode(',', array_fill(0, count($replyIds), '?'));
      $sqlReply = "SELECT id" . ($hasUserId ? ',user_id' : '') . ",user_name,$textCol AS body FROM chat_messages WHERE id IN ($in)";
      if ($hasRoom) $sqlReply .= " AND room = 'global'";

      $stR = $pdo->prepare($sqlReply);
      foreach ($replyIds as $idx=>$rid) {
        $stR->bindValue($idx+1, $rid, PDO::PARAM_INT);
      }

      $stR->execute();
      $rows = $stR->fetchAll();
      foreach ($rows as $r) {
        $replyMap[(int)$r['id']] = [
          'id'        => (int)$r['id'],
          'user_id'   => $hasUserId && isset($r['user_id']) ? (int)$r['user_id'] : null,
          'user_name' => (string)($r['user_name'] ?? ''),
          'body'      => (string)($r['body'] ?? ''),
        ];
      }
    }

    foreach ($items as &$m) {
      $rid = (int)($m['reply_to'] ?? 0);
      if ($rid > 0 && isset($replyMap[$rid])) {
        $m['reply'] = $replyMap[$rid];
      }
    }
    unset($m);
  }

  echo json_encode(['ok'=>true,'items'=>$items]);
} catch (Throwable $e) {
  http_response_code(200);
  echo json_encode(['ok'=>false,'error'=>'server_error','hint'=>$e->getMessage()]);
}
