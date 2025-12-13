<?php
// /api/chat/mentions_mark_read.php — marchează notificările de mențiuni/răspunsuri ca citite

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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$ids = array_values(array_unique(array_map('intval', (array)($in['ids'] ?? []))));
$uptoId = max(0, (int)($in['upto_id'] ?? 0));

try {
    require __DIR__ . '/../db.php';
    require __DIR__ . '/notifications_lib.php';

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    ensureChatNotificationsTable($pdo);

    if ($ids) {
        $inP = implode(',', array_fill(0, count($ids), '?'));
        $sql = "UPDATE chat_notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL AND id IN ({$inP})";
        $st = $pdo->prepare($sql);
        $st->bindValue(1, $uid, PDO::PARAM_INT);
        foreach ($ids as $idx => $id) {
            $st->bindValue($idx + 2, $id, PDO::PARAM_INT);
        }
        $st->execute();
    } elseif ($uptoId > 0) {
        $st = $pdo->prepare('UPDATE chat_notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL AND id <= ?');
        $st->execute([$uid, $uptoId]);
    }

    $stCount = $pdo->prepare('SELECT COUNT(*) FROM chat_notifications WHERE user_id = ? AND read_at IS NULL');
    $stCount->execute([$uid]);

    echo json_encode([
        'ok'           => true,
        'unread_count' => (int)$stCount->fetchColumn(),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'server_error']);
}