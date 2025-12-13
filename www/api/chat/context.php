<?php
// /api/chat/context.php — fetch context around a message
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

session_start();
$me = $_SESSION['user'] ?? null;
session_write_close();

if (!$me) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'auth']);
    exit;
}

$centerId = (int) ($_GET['id'] ?? 0);
if ($centerId <= 0) {
    echo json_encode(['ok' => true, 'items' => []]);
    exit;
}

try {
    require __DIR__ . '/../db.php';
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Checks (same as poll.php)
    $hasRoom = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'room'")->fetch();
    $hasMsg = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'message'")->fetch();
    $hasBody = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'body'")->fetch();
    $hasReplyTo = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'reply_to'")->fetch();
    $hasEditedAt = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'edited_at'")->fetch();
    $hasMentionsJ = (bool) $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'mentions_json'")->fetch();

    $textCol = $hasMsg ? 'message' : ($hasBody ? 'body' : null);
    if (!$textCol) {
        echo json_encode(['ok' => false]);
        exit;
    }

    $tsExpr = "UNIX_TIMESTAMP(created_at)";

    // Select logic
    $selCols = "id,user_id,user_name,role,$textCol AS body,$tsExpr AS ts";
    if ($hasReplyTo)
        $selCols .= ", reply_to";
    if ($hasEditedAt)
        $selCols .= ", UNIX_TIMESTAMP(edited_at) AS edited_at";
    if ($hasMentionsJ)
        $selCols .= ", mentions_json";

    $roomWhere = $hasRoom ? " AND room='global'" : "";

    // 20 before
    $st1 = $pdo->prepare("SELECT $selCols FROM chat_messages WHERE id < :id $roomWhere ORDER BY id DESC LIMIT 20");
    $st1->bindValue(':id', $centerId, PDO::PARAM_INT);
    $st1->execute();
    $before = array_reverse($st1->fetchAll());

    // Center
    $st2 = $pdo->prepare("SELECT $selCols FROM chat_messages WHERE id = :id $roomWhere");
    $st2->bindValue(':id', $centerId, PDO::PARAM_INT);
    $st2->execute();
    $center = $st2->fetchAll();

    // 20 after
    $st3 = $pdo->prepare("SELECT $selCols FROM chat_messages WHERE id > :id $roomWhere ORDER BY id ASC LIMIT 20");
    $st3->bindValue(':id', $centerId, PDO::PARAM_INT);
    $st3->execute();
    $after = $st3->fetchAll();

    $items = array_merge($before, $center, $after);

    // Normalize
    foreach ($items as &$m) {
        if (isset($m['mentions_json'])) {
            $mj = json_decode($m['mentions_json'], true);
            if (is_array($mj)) {
                // simplificat
                $m['mentions'] = []; // nu e critic pentru context
            }
            unset($m['mentions_json']);
        }
        $m['edited'] = !empty($m['edited_at']);
        $m['ts'] = (int) $m['ts'];
        $m['id'] = (int) $m['id'];
    }
    unset($m);

    // Attachments & Previews (DB)
    if ($items) {
        $mids = array_unique(array_column($items, 'id'));
        if ($mids) {
            $in = implode(',', $mids);

            // Attachments
            try {
                $stAtt = $pdo->query("SELECT message_id, url, name, mime, kind, size FROM chat_attachments WHERE message_id IN ($in)");
                $allAtts = $stAtt->fetchAll(PDO::FETCH_GROUP | PDO::FETCH_ASSOC);
                foreach ($items as &$m) {
                    if (isset($allAtts[$m['id']]))
                        $m['attachments'] = $allAtts[$m['id']];
                }
            } catch (Throwable $e) {
            }

            // Previews
            try {
                $stPrev = $pdo->query("SELECT message_id, data_json FROM chat_link_previews WHERE message_id IN ($in)");
                $allPrev = $stPrev->fetchAll(PDO::FETCH_KEY_PAIR);
                foreach ($items as &$m) {
                    if (isset($allPrev[$m['id']])) {
                        $m['link_preview'] = json_decode($allPrev[$m['id']], true);
                    }
                }
            } catch (Throwable $e) {
            }
        }
    }

    // Reply lookup (optional but good for context)
    // (Simplified: we assume frontend handles broken reply links if we don't send details, or we can skip it. 
    // Poll.php includes reply details. We should probably include them if possible. 
    // For brevity/robustness, I will skip complex reply body lookup unless essential. 
    // Dashboard uses reply details to show "Replying to X: ...". 
    // Let's add a quick lookup.)

    if ($hasReplyTo && $items) {
        $rids = [];
        foreach ($items as $m)
            if (!empty($m['reply_to']))
                $rids[] = (int) $m['reply_to'];
        if ($rids) {
            $rids = array_unique($rids);
            $inR = implode(',', $rids);
            $stR = $pdo->query("SELECT id, user_name, $textCol AS body FROM chat_messages WHERE id IN ($inR)");
            $replies = $stR->fetchAll(PDO::FETCH_UNIQUE | PDO::FETCH_ASSOC);
            foreach ($items as &$m) {
                $r = (int) ($m['reply_to'] ?? 0);
                if ($r && isset($replies[$r])) {
                    $m['reply'] = [
                        'id' => $r,
                        'user_name' => $replies[$r]['user_name'],
                        'body' => $replies[$r]['body']
                    ];
                }
            }
        }
    }

    echo json_encode(['ok' => true, 'items' => $items]);

} catch (Throwable $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
