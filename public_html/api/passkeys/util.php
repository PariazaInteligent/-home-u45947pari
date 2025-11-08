<?php
// /api/passkeys/util.php


declare(strict_types=1);
session_start();


require_once __DIR__ . '/../db.php'; // adaptează dacă ai altă cale
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../../lib/webauthn/Binary/ByteBuffer.php';
require_once __DIR__ . '/../../lib/webauthn/WebAuthn.php';

use lbuchs\WebAuthn\WebAuthn;
use lbuchs\WebAuthn\Binary\ByteBuffer;


function json_out($arr, int $code=200): void {
http_response_code($code);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo json_encode($arr, JSON_UNESCAPED_SLASHES);
exit;
}


function require_method(string $m): void {
if (strcasecmp($_SERVER['REQUEST_METHOD'] ?? '', $m) !== 0) {
json_out(['ok'=>false,'err'=>'method_not_allowed'], 405);
}
}


function b64u(string $bin): string {
return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}


function b64u_dec(string $b64u): string {
$b64 = strtr($b64u, '-_', '+/');
return base64_decode($b64 . str_repeat('=', (4 - strlen($b64) % 4) % 4));
}


function ensure_user_handle(mysqli $db, int $userId): string {
$stmt = $db->prepare('SELECT user_handle FROM users WHERE id=?');
$stmt->bind_param('i', $userId);
$stmt->execute();
$stmt->bind_result($uh);
if ($stmt->fetch() && !empty($uh)) { $stmt->close(); return $uh; }
$stmt->close();
$uh = random_bytes(32);
$stmt = $db->prepare('UPDATE users SET user_handle=? WHERE id=?');
$stmt->bind_param('si', $uh, $userId);
$stmt->execute();
return $uh;
}


function find_user_by_email(mysqli $db, string $email): ?array {
$stmt = $db->prepare('SELECT id, email, role, user_handle FROM users WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
return $row ?: null;
}


function find_user_by_credential_id(mysqli $db, string $credIdBin): ?array {
$stmt = $db->prepare('SELECT u.id,u.email,u.role,u.user_handle FROM webauthn_credentials w JOIN users u ON u.id=w.user_id WHERE w.credential_id=? LIMIT 1');
$stmt->bind_param('s', $credIdBin);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
}