<?php
// Helperi pentru notificări dedicate mențiunilor/răspunsurilor din chat

declare(strict_types=1);

function ensureChatNotificationsTable(PDO $pdo): void
{
    static $ensured = false;
    if ($ensured) {
        return;
    }

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS chat_notifications (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            message_id INT NOT NULL,
            kind VARCHAR(16) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            read_at DATETIME DEFAULT NULL,
            UNIQUE KEY uq_user_msg_kind (user_id, message_id, kind),
            KEY idx_user_unread (user_id, read_at, id),
            KEY idx_msg_kind (message_id, kind)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $ensured = true;
}

function insertChatNotifications(PDO $pdo, array $rows): void
{
    if (!$rows) {
        return;
    }

    ensureChatNotificationsTable($pdo);

    $stmt = $pdo->prepare(
        'INSERT IGNORE INTO chat_notifications (user_id, message_id, kind) VALUES (:uid, :mid, :kind)'
    );

    foreach ($rows as $row) {
        $uid = (int)($row['user_id'] ?? 0);
        $mid = (int)($row['message_id'] ?? 0);
        $kind = trim((string)($row['kind'] ?? ''));
        if ($uid <= 0 || $mid <= 0 || $kind === '') {
            continue;
        }
        $stmt->execute([
            ':uid'  => $uid,
            ':mid'  => $mid,
            ':kind' => $kind,
        ]);
    }
}