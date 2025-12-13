<?php
// /api/chat/poll.php
// GET parameters: limit?, since_id?, before_id?, around_id?, window?, edited_since?, deleted_since?
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

$limit = max(1, min(100, (int) ($_GET['limit'] ?? 50)));
$sinceId = (int) ($_GET['since_id'] ?? 0);
$beforeId = (int) ($_GET['before_id'] ?? 0);
$aroundId = (int) ($_GET['around_id'] ?? 0);
$window = max(1, min(200, (int) ($_GET['window'] ?? 30)));
$editedSince = (int) ($_GET['edited_since'] ?? 0);
$deletedSince = (int) ($_GET['deleted_since'] ?? 0);

try {
  require __DIR__ . '/../db.php'; // $pdo
  require __DIR__ . '/meta_lib.php';
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

  // Detect optional columns
  $hasRoom = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'room'")->fetch();
  $hasMsg = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'message'")->fetch();
  $hasBody = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'body'")->fetch();
  $hasCli = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'client_id'")->fetch();
  $hasCreatedAt = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'created_at'")->fetch();
  $hasEditedAt = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'edited_at'")->fetch();
  $hasEditTable = (bool) $pdo->query("SHOW TABLES LIKE 'chat_message_edits'")->fetch();
  $hasUpdatedAt = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'updated_at'")->fetch();
  $hasMentionsJ = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'mentions_json'")->fetch();
  $hasReplyTo = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'reply_to'")->fetch();
  $hasUserId = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'user_id'")->fetch();
  $hasDeletedAt = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'deleted_at'")->fetch();

  $textCol = $hasMsg ? 'message' : ($hasBody ? 'body' : null);
  if (!$textCol) {
    echo json_encode(['ok' => false, 'error' => 'no_text_column']);
    exit;
  }

  $tsExpr = $hasCreatedAt ? "UNIX_TIMESTAMP(created_at)" : "UNIX_TIMESTAMP(NOW())";

  // Base SELECT columns
  $selCols = "id,user_id,user_name,role,$textCol AS body,$tsExpr AS ts";
  if ($hasCli)
    $selCols .= ", client_id";
  if ($hasEditedAt) {
    $selCols .= ", UNIX_TIMESTAMP(edited_at) AS edited_at";
  } elseif ($hasEditTable) {
    $selCols .= ", UNIX_TIMESTAMP(e.edited_at) AS edited_at";
  }
  if ($hasUpdatedAt)
    $selCols .= ", UNIX_TIMESTAMP(updated_at) AS updated_at";
  if ($hasMentionsJ)
    $selCols .= ", mentions_json";
  if ($hasReplyTo)
    $selCols .= ", reply_to";
  if ($hasDeletedAt) {
    $selCols .= ", CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END AS is_deleted, UNIX_TIMESTAMP(deleted_at) AS deleted_at";
  }

  $editedJoin = (!$hasEditedAt && $hasEditTable) ? " LEFT JOIN chat_message_edits e ON e.message_id = chat_messages.id" : "";
  $roomWhere = $hasRoom ? " AND room='global'" : "";

  $items = [];
  if ($sinceId > 0) {
    $sql = "SELECT $selCols FROM chat_messages$editedJoin WHERE id > :id$roomWhere ORDER BY id ASC LIMIT :lim";
    $st = $pdo->prepare($sql);
    $st->bindValue(':id', $sinceId, PDO::PARAM_INT);
    $st->bindValue(':lim', $limit, PDO::PARAM_INT);
    $st->execute();
    $items = $st->fetchAll();
  } elseif ($beforeId > 0) {
    $sql = "SELECT * FROM (\n                  SELECT $selCols FROM chat_messages$editedJoin WHERE id < :bid$roomWhere ORDER BY id DESC LIMIT :lim\n                ) t ORDER BY t.id ASC";
    $st = $pdo->prepare($sql);
    $st->bindValue(':bid', $beforeId, PDO::PARAM_INT);
    $st->bindValue(':lim', $limit, PDO::PARAM_INT);
    $st->execute();
    $items = $st->fetchAll();
  } elseif ($aroundId > 0) {
    $olderSql = "SELECT $selCols FROM chat_messages$editedJoin WHERE id < :aid$roomWhere ORDER BY id DESC LIMIT :win";
    $newerSql = "SELECT $selCols FROM chat_messages WHERE id > :aid$roomWhere ORDER BY id ASC LIMIT :win";
    $stO = $pdo->prepare($olderSql);
    $stO->bindValue(':aid', $aroundId, PDO::PARAM_INT);
    $stO->bindValue(':win', $window, PDO::PARAM_INT);
    $stO->execute();
    $older = $stO->fetchAll();
    $older = array_reverse($older);

    $stC = $pdo->prepare("SELECT $selCols FROM chat_messages$editedJoin WHERE id=:aid" . ($hasRoom ? " AND room='global'" : "") . " LIMIT 1");
    $stC->bindValue(':aid', $aroundId, PDO::PARAM_INT);
    $stC->execute();
    $center = $stC->fetchAll();

    $stN = $pdo->prepare($newerSql);
    $stN->bindValue(':aid', $aroundId, PDO::PARAM_INT);
    $stN->bindValue(':win', $window, PDO::PARAM_INT);
    $stN->execute();
    $newer = $stN->fetchAll();

    $items = array_values(array_merge($older, $center, $newer));
  } else {
    $sql = "SELECT * FROM (\n                  SELECT $selCols FROM chat_messages$editedJoin" . ($hasRoom ? " WHERE room='global'" : "") . "\n                  ORDER BY id DESC\n                  LIMIT :lim\n                ) t ORDER BY t.id ASC";
    $st = $pdo->prepare($sql);
    $st->bindValue(':lim', $limit, PDO::PARAM_INT);
    $st->execute();
    $items = $st->fetchAll();
  }

  // Normalize mentions and edited flag
  if ($items) {
    foreach ($items as &$m) {
      if ($hasMentionsJ && array_key_exists('mentions_json', $m)) {
        $raw = $m['mentions_json'];
        unset($m['mentions_json']);
        if ($raw !== null && $raw !== '') {
          $mj = json_decode((string) $raw, true);
          if (is_array($mj)) {
            $ids = array_values(array_map('intval', (array) ($mj['ids'] ?? [])));
            $names = array_values(array_map(function ($x) {
              return trim((string) $x);
            }, (array) ($mj['names'] ?? [])));
            $out = [];
            $n = max(count($ids), count($names));
            for ($i = 0; $i < $n; $i++) {
              $out[] = ['user_id' => $ids[$i] ?? null, 'name' => $names[$i] ?? null];
            }
            $out = array_values(array_filter($out, function ($r) {
              return !($r['user_id'] === null && ($r['name'] === null || $r['name'] === ''));
            }));
            if ($out)
              $m['mentions'] = $out;
          }
        }
      }
      // edited flag
      $m['edited'] = false;
      if ($hasEditedAt && array_key_exists('edited_at', $m)) {
        $m['edited_at'] = $m['edited_at'] ? (int) $m['edited_at'] : null;
        $m['edited'] = $m['edited_at'] !== null;
      } elseif ($hasUpdatedAt && array_key_exists('updated_at', $m)) {
        $m['updated_at'] = $m['updated_at'] ? (int) $m['updated_at'] : null;
        $m['edited'] = $m['updated_at'] !== null && ($hasCreatedAt ? $m['updated_at'] > (int) $m['ts'] : true);
      }
    }
    unset($m);
  }

  // Reply preview handling
  if ($hasReplyTo && $items) {
    $replyIds = [];
    foreach ($items as $m) {
      $rid = (int) ($m['reply_to'] ?? 0);
      if ($rid > 0)
        $replyIds[] = $rid;
    }
    $replyIds = array_values(array_unique($replyIds));
    $replyMap = [];
    if ($replyIds) {
      $in = implode(',', array_fill(0, count($replyIds), '?'));
      $sqlReply = "SELECT id" . ($hasUserId ? ',user_id' : '') . ",user_name,$textCol AS body FROM chat_messages WHERE id IN ($in)";
      if ($hasRoom)
        $sqlReply .= " AND room = 'global'";
      $stR = $pdo->prepare($sqlReply);
      foreach ($replyIds as $idx => $rid) {
        $stR->bindValue($idx + 1, $rid, PDO::PARAM_INT);
      }
      $stR->execute();
      $rows = $stR->fetchAll();
      foreach ($rows as $r) {
        $replyMap[(int) $r['id']] = [
          'id' => (int) $r['id'],
          'user_id' => $hasUserId && isset($r['user_id']) ? (int) $r['user_id'] : null,
          'user_name' => (string) ($r['user_name'] ?? ''),
          'body' => (string) ($r['body'] ?? ''),
        ];
      }
    }
    foreach ($items as &$m) {
      $rid = (int) ($m['reply_to'] ?? 0);
      if ($rid > 0 && isset($replyMap[$rid])) {
        $m['reply'] = $replyMap[$rid];
      }
    }
    unset($m);
  }

  // Attach meta (attachments, link preview) from DB
  if ($items) {
    $mids = [];
    foreach ($items as $m) {
      $id = (int) ($m['id'] ?? 0);
      if ($id > 0)
        $mids[] = $id;
    }
    $mids = array_unique($mids);

    if ($mids) {
      $in = implode(',', $mids);

      // 1. Attachments
      // Check if table exists (simple try/catch or assume created by send.php)
      // We assume table exists because send.php creates it. If not, catch will handle it.
      try {
        $stAtt = $pdo->query("SELECT message_id, url, name, mime, kind, size FROM chat_attachments WHERE message_id IN ($in) ORDER BY id ASC");
        $allAtts = $stAtt->fetchAll(PDO::FETCH_GROUP | PDO::FETCH_ASSOC);
        // FETCH_GROUP groups by first column (message_id). 
        // Note: fetchAll(PDO::FETCH_GROUP) returns array like [ msg_id => [ {url...}, {url...} ] ]
        // But the first column is removed from the row in some PDO versions? No, usually it is used as key.
        // Actually fetchAll(PDO::FETCH_GROUP | PDO::FETCH_ASSOC) removes the grouping column from the result arrays.
        // So we get: [ 123 => [ ['url'=>'...', ...], ... ] ]

        foreach ($items as &$m) {
          $id = (int) ($m['id'] ?? 0);
          if (isset($allAtts[$id])) {
            $m['attachments'] = $allAtts[$id];
          }
        }
        unset($m);
      } catch (Throwable $e) { /* ignore if table missing */
      }

      // 2. Link Previews
      try {
        $stPrev = $pdo->query("SELECT message_id, data_json FROM chat_link_previews WHERE message_id IN ($in)");
        $allPrev = $stPrev->fetchAll(PDO::FETCH_KEY_PAIR);
        // [ msg_id => data_json ]

        foreach ($items as &$m) {
          $id = (int) ($m['id'] ?? 0);
          if (isset($allPrev[$id])) {
            $dec = json_decode($allPrev[$id], true);
            if ($dec)
              $m['link_preview'] = $dec;
          }
        }
        unset($m);
      } catch (Throwable $e) { /* ignore */
      }
    }
  }

  // Typing users
  $typing = [];
  try {
    $stTyping = $pdo->prepare("SELECT user_id, user_name FROM chat_typing WHERE until_ts > NOW() AND room = 'global' ORDER BY until_ts DESC LIMIT 20");
    $stTyping->execute();
    $typing = $stTyping->fetchAll(PDO::FETCH_ASSOC);
  } catch (Throwable $e) {
    $typing = [];
  }

  // Edited messages since
  $editedMessages = [];
  if ($editedSince > 0 && ($hasEditedAt || $hasEditTable)) {
    $colRef = $hasEditedAt ? 'edited_at' : 'e.edited_at';
    try {
      $editedSql = "SELECT $selCols FROM chat_messages$editedJoin WHERE $colRef IS NOT NULL AND UNIX_TIMESTAMP($colRef) > :edited_since $roomWhere ORDER BY $colRef DESC LIMIT 50";
      $stEdited = $pdo->prepare($editedSql);
      $stEdited->bindValue(':edited_since', $editedSince, PDO::PARAM_INT);
      $stEdited->execute();
      $editedMessages = $stEdited->fetchAll();
      foreach ($editedMessages as &$em) {
        $em['edited'] = true;
        $em['edited_at'] = $em['edited_at'] ? (int) $em['edited_at'] : null;
        if ($hasMentionsJ && array_key_exists('mentions_json', $em)) {
          $raw = $em['mentions_json'];
          unset($em['mentions_json']);
          if ($raw !== null && $raw !== '') {
            $mj = json_decode((string) $raw, true);
            if (is_array($mj)) {
              $ids = array_values(array_map('intval', (array) ($mj['ids'] ?? [])));
              $names = array_values(array_map(function ($x) {
                return trim((string) $x);
              }, (array) ($mj['names'] ?? [])));
              $out = [];
              $n = max(count($ids), count($names));
              for ($i = 0; $i < $n; $i++) {
                $out[] = ['user_id' => $ids[$i] ?? null, 'name' => $names[$i] ?? null];
              }
              $out = array_values(array_filter($out, function ($r) {
                return !($r['user_id'] === null && ($r['name'] === null || $r['name'] === ''));
              }));
              if ($out)
                $em['mentions'] = $out;
            }
          }
        }
      }
      unset($em);
    } catch (Throwable $e) {
      $editedMessages = [];
    }
  }

  // Deleted messages since
  $deletedMessages = [];
  if ($deletedSince > 0 && $hasDeletedAt) {
    $delSql = "SELECT id, UNIX_TIMESTAMP(deleted_at) AS deleted_at FROM chat_messages WHERE deleted_at IS NOT NULL AND UNIX_TIMESTAMP(deleted_at) > :dsince ORDER BY deleted_at ASC";
    $stDel = $pdo->prepare($delSql);
    $stDel->bindValue(':dsince', $deletedSince, PDO::PARAM_INT);
    $stDel->execute();
    $deletedMessages = $stDel->fetchAll();
  }

  echo json_encode([
    'ok' => true,
    'items' => $items,
    'typing' => $typing,
    'edited_messages' => $editedMessages,
    'deleted_messages' => $deletedMessages,
  ]);
} catch (Throwable $e) {
  http_response_code(200);
  echo json_encode(['ok' => false, 'error' => 'server_error', 'hint' => $e->getMessage()]);
}
?>