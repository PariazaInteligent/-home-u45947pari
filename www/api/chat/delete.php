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

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$messageId = isset($input['message_id']) ? (int)$input['message_id'] : 0;
$csrfBody  = $input['csrf_token'] ?? '';

$user      = $_SESSION['user'] ?? null;
$userId    = $user['id'] ?? null;
$userRole  = strtoupper($user['role'] ?? 'GUEST');

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'not authenticated']);
    exit;
}

$csrfSession = $_SESSION['csrf_token_chat'] ?? '';
if (!$csrfSession || !$csrfBody || !hash_equals($csrfSession, $csrfBody)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'invalid csrf token']);
    exit;
}

if ($messageId <= 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'invalid data']);
    exit;
}

// TODO: adaptează la conexiunea ta
require_once __DIR__ . '/../config/db.php'; // setează $pdo

$tableName = 'chat_messages'; // schimbă după numele tău de tabel

$isAdmin = ($userRole === 'ADMIN');

// poți face și soft delete (is_deleted = 1), dar ca schelet mergem cu DELETE
$sql = "DELETE FROM {$tableName} WHERE id = :id" . ($isAdmin ? "" : " AND user_id = :user_id");

$stmt = $pdo->prepare($sql);
$stmt->bindValue(':id', $messageId, PDO::PARAM_INT);

if (!$isAdmin) {
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
}

$stmt->execute();

if ($stmt->rowCount() === 0) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'no permission or message not found']);
    exit;
}

echo json_encode([
    'success' => true,
    'message_id' => $messageId,
]);
