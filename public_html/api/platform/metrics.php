<?php
// /api/platform/metrics.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require __DIR__ . '/../db.php';

// investitori activi = users.is_active=1
$investors = 0;
$pending   = 0;
$liq       = 0.75; // poți lega de un tabel propriu, deocamdată constant

try {
  $investors = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE is_active=1")->fetchColumn();
  $pending   = (int)$pdo->query("SELECT COUNT(*) FROM withdrawal_requests WHERE status='pending'")->fetchColumn();
} catch (Throwable $e) {}

echo json_encode([
  'investors_total'      => $investors,
  'pending_withdrawals'  => $pending,
  'liquidity_ratio'      => $liq
], JSON_UNESCAPED_UNICODE);
