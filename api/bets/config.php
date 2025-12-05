<?php
// /api/bets/config.php
// Comision platformă aplicat la PROFIT (nu la pierderi).
// Modificat la 10% conform cererii.
const PLATFORM_FEE_PCT = 0.10;

function require_db(): PDO
{
  require __DIR__ . '/../db.php'; // expune $pdo
  return $pdo;
}

function only_admin_or_403(): array
{
  session_start();
  if (empty($_SESSION['user'])) {
    http_response_code(401);
    exit;
  }
  $me = $_SESSION['user'];
  if (strtoupper($me['role'] ?? '') !== 'ADMIN') {
    http_response_code(403);
    exit;
  }
  return $me;
}

function jexit(int $code, array $payload)
{
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}
