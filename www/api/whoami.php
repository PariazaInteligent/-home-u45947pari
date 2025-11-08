<?php
// /api/whoami.php
header('Content-Type: application/json; charset=utf-8');
if (session_status() !== PHP_SESSION_ACTIVE) session_start();

$logged = !empty($_SESSION['user']);
echo json_encode([
  'success'   => true,
  'logged_in' => $logged,
  'id'        => $logged ? (int)($_SESSION['user']['id'] ?? 0) : 0,
  'nume'      => $logged ? ($_SESSION['user']['nume'] ?? null) : null,
  'rol'       => $logged ? ($_SESSION['user']['rol']  ?? 'utilizator') : null,
], JSON_UNESCAPED_UNICODE);
