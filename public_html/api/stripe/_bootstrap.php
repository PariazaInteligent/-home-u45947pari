<?php
// /api/stripe/_bootstrap.php
declare(strict_types=1);

function pi_get_stripe_config(): array {
  $secret = getenv('STRIPE_SECRET') ?: '';
  $whsec  = getenv('STRIPE_WEBHOOK_SECRET') ?: '';

  // fallback la /api/stripe/config.php
  $cfgFile = __DIR__ . '/config.php';
  if (is_file($cfgFile)) {
    $cfg = include $cfgFile;
    if (is_array($cfg)) {
      $secret = $secret ?: ($cfg['STRIPE_SECRET'] ?? '');
      $whsec  = $whsec  ?: ($cfg['STRIPE_WEBHOOK_SECRET'] ?? '');
    }
    if (defined('STRIPE_SECRET'))         $secret = $secret ?: STRIPE_SECRET;
    if (defined('STRIPE_WEBHOOK_SECRET')) $whsec  = $whsec  ?: STRIPE_WEBHOOK_SECRET;
  }

  if (!$secret) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok'=>false,'error'=>'Missing STRIPE_SECRET']);
    exit;
  }
  return ['secret'=>$secret, 'webhook_secret'=>$whsec];
}
