<?php
// api/chat/edit.php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

// doar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'method not allowed']);
    exit;
}

// citește JSON sau fallback la $_POST
$rawInput = file_get_contents('php://input') ?: '';
$input    = json_decode($rawInput, true);
if (!is_array($input)) {
    $input = $_POST;
}

// validare minimă
$messageId = isset($input['message_id']) ? (int)$input['message_id'] : 0;
$newText   = isset($input['text']) ? trim((string)$input['text']) : '';
$csrfBody   = $input['csrf_token'] ?? '';
$csrfHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

// accept either JSON body token sau header X-CSRF-Token
$csrfToken = $csrfBody ?: $csrfHeader;

// verifică user logat
$user      = $_SESSION['user'] ?? null;
$userId    = $user['id'] ?? null;
$userName  = trim((string)($user['name'] ?? ($user['email'] ?? '')));
$userRole  = strtoupper($user['role'] ?? 'GUEST');

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'not authenticated']);
    exit;
}

// verifică CSRF (tokenul folosit în chat comunitate)
$csrfSession = $_SESSION['csrf_token_chat'] ?? '';
if (!$csrfSession || !$csrfToken || !hash_equals($csrfSession, $csrfToken)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'invalid csrf token']);
    exit;
}

if ($messageId <= 0 || $newText === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'invalid data']);
    exit;
}

require_once __DIR__ . '/../db.php'; // EX: aici setezi $pdo = new PDO(...);

$tableName   = 'chat_messages';
$isAdmin     = ($userRole === 'ADMIN');

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // detectăm coloanele disponibile (text, edited_at, user_id/user_name)
    $columns = [];
    try {
        $columns = $pdo->query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages'"
        )->fetchAll(PDO::FETCH_COLUMN);
    } catch (Throwable $e) {
        // dacă INFORMATION_SCHEMA nu e disponibil, continuăm cu lista goală
        $columns = [];
    }

    $has = [
        'message'      => false,
        'body'         => false,
        'message_text' => false,
        'text'         => false,
        'edited_at'    => false,
        'user_id'      => false,
        'user_name'    => false,
    ];
    foreach ($columns as $col) {
        if (isset($has[$col])) {
            $has[$col] = true;
        }
    }

    // fallback pentru persistat „edited” dacă nu avem coloană dedicată
    $hasEditTable = false;
    try {
        $hasEditTable = (bool)$pdo->query("SHOW TABLES LIKE 'chat_message_edits'")->fetch();
    } catch (Throwable $e) {
        $hasEditTable = false;
    }

    // alege coloana de text disponibilă
    if ($has['message']) {
        $textColumn = 'message';
    } elseif ($has['body']) {
        $textColumn = 'body';
    } elseif ($has['message_text']) {
        $textColumn = 'message_text';
    } elseif ($has['text']) {
        $textColumn = 'text';
    } else {
        http_response_code(500);
        echo json_encode(['ok' => false, 'success' => false, 'error' => 'text column not found']);
        exit;
    }

    $setParts = ["{$textColumn} = :text"];
    if ($has['edited_at']) {
        $setParts[] = 'edited_at = NOW()';
    }

    $sql = "UPDATE {$tableName} SET " . implode(', ', $setParts) . " WHERE id = :id";

    if (!$isAdmin) {
        if ($has['user_id'] && $userId) {
            $sql .= " AND user_id = :user_id";
        } elseif ($has['user_name'] && $userName !== '') {
            $sql .= " AND user_name = :user_name";
        } else {
            http_response_code(403);
            echo json_encode(['ok' => false, 'success' => false, 'error' => 'permission check unavailable']);
            exit;
        }
    }

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':text', $newText, PDO::PARAM_STR);
    $stmt->bindValue(':id', $messageId, PDO::PARAM_INT);

    if (!$isAdmin) {
        if ($has['user_id'] && $userId) {
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        } elseif ($has['user_name'] && $userName !== '') {
            $stmt->bindValue(':user_name', $userName, PDO::PARAM_STR);
        }
    }

    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'success' => false, 'error' => 'no permission or message not found']);
        exit;
    }

    $editedAtTs = time();

    // dacă nu avem coloană edited_at, folosim un tabel helper pentru a marca editările
    if (!$has['edited_at']) {
        if (!$hasEditTable) {
            try {
                $pdo->exec(
                    "CREATE TABLE IF NOT EXISTS chat_message_edits (
                        message_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
                        edited_at DATETIME NOT NULL,
                        editor_id BIGINT NULL,
                        editor_name VARCHAR(255) NULL,
                        KEY edited_at_idx (edited_at)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
                );
                $hasEditTable = true;
            } catch (Throwable $e) {
                // dacă nu putem crea tabelul, nu blocăm răspunsul
            }
        }

        if ($hasEditTable) {
            try {
                $up = $pdo->prepare(
                    "INSERT INTO chat_message_edits (message_id, edited_at, editor_id, editor_name)
                     VALUES (:mid, FROM_UNIXTIME(:ts), :uid, :uname)
                     ON DUPLICATE KEY UPDATE edited_at=VALUES(edited_at), editor_id=VALUES(editor_id), editor_name=VALUES(editor_name)"
                );
                $up->bindValue(':mid', $messageId, PDO::PARAM_INT);
                $up->bindValue(':ts', $editedAtTs, PDO::PARAM_INT);
                $up->bindValue(':uid', $userId, PDO::PARAM_INT);
                $up->bindValue(':uname', $userName, PDO::PARAM_STR);
                $up->execute();
            } catch (Throwable $e) {
                // fallback silențios dacă nu reușim să marcăm editarea
            }
        }
    }

    echo json_encode([
        'ok' => true,
        'success' => true,
        'message_id' => $messageId,
        'text' => $newText,
        'edited' => true,
        'edited_at' => $editedAtTs,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'server error']);
}