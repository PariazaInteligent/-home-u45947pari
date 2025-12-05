<?php
// /api/stripe/selftest.php
header('Content-Type: application/json; charset=utf-8');
$logDir = __DIR__ . '/_logs';
@mkdir($logDir, 0775, true);
$ok = [
  'php' => PHP_VERSION,
  'curl_ext' => extension_loaded('curl'),
  'log_dir_exists' => is_dir($logDir),
  'log_dir_writable' => is_writable($logDir),
  'config_exists' => file_exists(__DIR__.'/config.php'),
  'secret_defined' => false,
];
if (file_exists(__DIR__.'/config.php')) {
  require __DIR__.'/config.php';
  $ok['secret_defined'] = defined('STRIPE_SECRET_KEY');
}
echo json_encode($ok, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
