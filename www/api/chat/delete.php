<?php
// api/chat/delete.php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'method not allowed']);
    exit;
}

// citește JSON sau folosește $_POST dacă nu este JSON valid
$rawInput = file_get_contents('php://input') ?: '';
$input    = json_decode($rawInput, true);
if (!is_array($input)) {
    $input = $_POST;
}

$messageId = isset($input['message_id']) ? (int)$input['message_id'] : 0;
$csrfBody   = $input['csrf_token'] ?? '';
$csrfHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

// acceptă token din corp sau header X-CSRF-Token
$csrfToken = $csrfBody ?: $csrfHeader;

$user      = $_SESSION['user'] ?? null;
$userId    = $user['id'] ?? null;
$userName  = trim((string)($user['name'] ?? ($user['email'] ?? '')));
$userRole  = strtoupper($user['role'] ?? 'GUEST');

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'not authenticated']);
    exit;
}

$csrfSession = $_SESSION['csrf_token_chat'] ?? '';
if (!$csrfSession || !$csrfToken || !hash_equals($csrfSession, $csrfToken)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'invalid csrf token']);
    exit;
}

if ($messageId <= 0) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'invalid data']);
    exit;
}

require_once __DIR__ . '/../db.php'; // setează $pdo

$tableName = 'chat_messages'; // schimbă după numele tău de tabel
$isAdmin   = ($userRole === 'ADMIN');

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // verificăm dacă avem coloane de proprietar în tabel
    $columns = [];
    try {
        $columns = $pdo->query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages'"
        )->fetchAll(PDO::FETCH_COLUMN);
    } catch (Throwable $e) {
        $columns = [];
    }

    $hasUserId   = in_array('user_id', $columns, true);
    $hasUserName = in_array('user_name', $columns, true);

    $sql = "DELETE FROM {$tableName} WHERE id = :id";
    if (!$isAdmin) {
        if ($hasUserId && $userId) {
            $sql .= " AND user_id = :user_id";
        } elseif ($hasUserName && $userName !== '') {
            $sql .= " AND user_name = :user_name";
        } else {
            http_response_code(403);
            echo json_encode(['ok' => false, 'success' => false, 'error' => 'permission check unavailable']);
            exit;
        }
    }

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':id', $messageId, PDO::PARAM_INT);

    if (!$isAdmin) {
        if ($hasUserId && $userId) {
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        } elseif ($hasUserName && $userName !== '') {
            $stmt->bindValue(':user_name', $userName, PDO::PARAM_STR);
        }
    }

    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'success' => false, 'error' => 'no permission or message not found']);
        exit;
    }

    echo json_encode([
        'ok' => true,
        'success' => true,
        'message_id' => $messageId,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'success' => false, 'error' => 'server error']);
}