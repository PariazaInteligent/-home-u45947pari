<?php
// /api/chat/mentions_unread.php — listează mențiunile/răspunsurile necitite pentru utilizatorul curent

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

session_start();
$me = $_SESSION['user'] ?? null;
if (!$me || !isset($me['id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'unauthorized']);
    exit;
}
$uid = (int)$me['id'];
session_write_close();

$limit = max(1, min(50, (int)($_GET['limit'] ?? 30)));

try {
    require __DIR__ . '/../db.php';
    require __DIR__ . '/notifications_lib.php';

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    ensureChatNotificationsTable($pdo);

    $has = [
        'room'          => false,
        'message'       => false,
        'body'          => false,
        'created_at'    => false,
        'reply_to'      => false,
        'mentions_json' => false,
        'user_id'       => false,
    ];

    try {
        $cols = $pdo->query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages'"
        )->fetchAll(PDO::FETCH_COLUMN);
        foreach ($cols as $c) {
            if (isset($has[$c])) {
                $has[$c] = true;
            }
        }
    } catch (Throwable $e) {
        foreach (['message', 'body', 'created_at', 'user_id'] as $c) {
            $has[$c] = true;
        }
    }

    $textCol = $has['message'] ? 'message' : ($has['body'] ? 'body' : null);
    if (!$textCol) {
        echo json_encode(['ok' => false, 'error' => 'no_text_column']);
        exit;
    }

    $tsExpr = $has['created_at'] ? 'UNIX_TIMESTAMP(m.created_at)' : 'UNIX_TIMESTAMP(NOW())';

    $sel = "n.id AS notif_id,n.kind,n.message_id,$tsExpr AS ts,m.user_id,m.user_name,m.role,{$textCol} AS body";
    if ($has['reply_to']) {
        $sel .= ', m.reply_to';
    }
    if ($has['mentions_json']) {
        $sel .= ', m.mentions_json';
    }

    $whereRoom = $has['room'] ? " AND m.room = 'global'" : '';

    $sql = "SELECT {$sel}
            FROM chat_notifications n
            JOIN chat_messages m ON m.id = n.message_id{$whereRoom}
            WHERE n.user_id = :uid AND n.read_at IS NULL
            ORDER BY n.id DESC
            LIMIT :lim";

    $st = $pdo->prepare($sql);
    $st->bindValue(':uid', $uid, PDO::PARAM_INT);
    $st->bindValue(':lim', $limit, PDO::PARAM_INT);
    $st->execute();
    $items = $st->fetchAll();

    $stCount = $pdo->prepare('SELECT COUNT(*) FROM chat_notifications WHERE user_id = ? AND read_at IS NULL');
    $stCount->execute([$uid]);
    $unreadCount = (int)$stCount->fetchColumn();

    // normalizează mențiunile
    if ($items) {
        foreach ($items as &$m) {
            if ($has['mentions_json'] && array_key_exists('mentions_json', $m)) {
                $raw = $m['mentions_json'];
                unset($m['mentions_json']);
                if ($raw !== null && $raw !== '') {
                    $mj = json_decode((string)$raw, true);
                    if (is_array($mj)) {
                        $ids = array_values(array_map('intval', (array)($mj['ids'] ?? [])));
                        $names = array_values(array_map(fn($x) => trim((string)$x), (array)($mj['names'] ?? [])));
                        $out = [];
                        $n = max(count($ids), count($names));
                        for ($i = 0; $i < $n; $i++) {
                            $row = [
                                'user_id' => $ids[$i] ?? null,
                                'name'    => $names[$i] ?? null,
                            ];
                            if (!($row['user_id'] === null && ($row['name'] === null || $row['name'] === ''))) {
                                $out[] = $row;
                            }
                        }
                        if ($out) {
                            $m['mentions'] = $out;
                        }
                    }
                }
            }
        }
        unset($m);
    }

    // atașează snapshot pentru reply_to
    if ($items && $has['reply_to']) {
        $replyIds = [];
        foreach ($items as $m) {
            $rid = (int)($m['reply_to'] ?? 0);
            if ($rid > 0) {
                $replyIds[] = $rid;
            }
        }
        $replyIds = array_values(array_unique($replyIds));
        if ($replyIds) {
            $in = implode(',', array_fill(0, count($replyIds), '?'));
            $sqlReply = "SELECT id,user_id,user_name,{$textCol} AS body FROM chat_messages WHERE id IN ({$in})";
            if ($has['room']) {
                $sqlReply .= " AND room = 'global'";
            }
            $stR = $pdo->prepare($sqlReply);
            foreach ($replyIds as $idx => $rid) {
                $stR->bindValue($idx + 1, $rid, PDO::PARAM_INT);
            }
            $stR->execute();
            $map = [];
            foreach ($stR->fetchAll() as $row) {
                $map[(int)$row['id']] = [
                    'id'        => (int)$row['id'],
                    'user_id'   => isset($row['user_id']) ? (int)$row['user_id'] : null,
                    'user_name' => (string)($row['user_name'] ?? ''),
                    'body'      => mb_substr(trim((string)($row['body'] ?? '')), 0, 240),
                ];
            }
            foreach ($items as &$m) {
                $rid = (int)($m['reply_to'] ?? 0);
                if ($rid > 0 && isset($map[$rid])) {
                    $m['reply'] = $map[$rid];
                }
            }
            unset($m);
        }
    }

    echo json_encode([
        'ok'            => true,
        'unread_count'  => $unreadCount,
        'items'         => $items,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error']);
}