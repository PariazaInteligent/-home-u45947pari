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

// citește JSON
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// validare minimă
$messageId = isset($input['message_id']) ? (int)$input['message_id'] : 0;
$newText   = isset($input['text']) ? trim((string)$input['text']) : '';
$csrfBody  = $input['csrf_token'] ?? '';

// verifică user logat
$user      = $_SESSION['user'] ?? null;
$userId    = $user['id'] ?? null;
$userRole  = strtoupper($user['role'] ?? 'GUEST');

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'not authenticated']);
    exit;
}

// verifică CSRF (tokenul folosit în chat comunitate)
$csrfSession = $_SESSION['csrf_token_chat'] ?? '';
if (!$csrfSession || !$csrfBody || !hash_equals($csrfSession, $csrfBody)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'invalid csrf token']);
    exit;
}

if ($messageId <= 0 || $newText === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'invalid data']);
    exit;
}

// TODO: adaptează include-ul la conexiunea ta reală:
require_once __DIR__ . '/../config/db.php'; // EX: aici setezi $pdo = new PDO(...);

// IMPORTANT: schimbă numele tabelei și al coloanei după structura ta
// ex: tabela: chat_messages, coloana text: message_text
$tableName   = 'chat_messages';
$textColumn  = 'message_text';

// dacă nu e admin, poate modifica doar propriul mesaj
$isAdmin = ($userRole === 'ADMIN');

// query de update
$sql = "UPDATE {$tableName} 
        SET {$textColumn} = :text, edited_at = NOW()
        WHERE id = :id" . ($isAdmin ? "" : " AND user_id = :user_id");

$stmt = $pdo->prepare($sql);
$stmt->bindValue(':text', $newText, PDO::PARAM_STR);
$stmt->bindValue(':id', $messageId, PDO::PARAM_INT);

if (!$isAdmin) {
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
}

$stmt->execute();

if ($stmt->rowCount() === 0) {
    // fie nu există mesajul, fie nu e al lui
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'no permission or message not found']);
    exit;
}

// succes
echo json_encode([
    'success' => true,
    'message_id' => $messageId,
    'text' => $newText,
]);
