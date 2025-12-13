<?php
// /api/session.php — întoarce starea sesiunii pentru UI-uri statice
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$user = $_SESSION['user'] ?? null;
if (!$user) {
  echo json_encode(['ok'=>true, 'loggedIn'=>false, 'role'=>'GUEST']);
  exit;
}

$role = strtoupper($user['role'] ?? 'USER');
echo json_encode([
  'ok'       => true,
  'loggedIn' => true,
  'role'     => $role,
  'email'    => $user['email'] ?? null,
]);
