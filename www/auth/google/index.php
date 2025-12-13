<?php
declare(strict_types=1);
session_start();

$cfg = require __DIR__ . '/../../api/google_oauth_config.php'; // << corect

$state = bin2hex(random_bytes(16));
$nonce = bin2hex(random_bytes(16));
$_SESSION['g_state'] = $state;
$_SESSION['g_nonce'] = $nonce;

$params = [
  'client_id'     => $cfg['client_id'],
  'redirect_uri'  => $cfg['redirect_uri'],
  'response_type' => 'code',
  'scope'         => 'openid email profile',
  'access_type'   => 'offline',
  'include_granted_scopes' => 'true',
  'prompt'        => 'consent',
  'state'         => $state,
  'nonce'         => $nonce,
];
header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params));
exit;
