<?php
// /api/stripe/create_checkout_session.php
declare(strict_types=1);
session_start();

// ---------- Config & hardening ----------
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

error_reporting(E_ALL);
ini_set('display_errors', '0'); // nu trimitem erori brute către client

$LOG_DIR = __DIR__ . '/_logs';
if (!is_dir($LOG_DIR)) { @mkdir($LOG_DIR, 0755, true); }
$LOG_FILE = $LOG_DIR . '/create_checkout_' . date('Y-m-d') . '.log';
function logf(string $msg) {
  global $LOG_FILE;
  @file_put_contents($LOG_FILE, '['.date('H:i:s')."] $msg\n", FILE_APPEND);
}

// Încarcă cheile + helperii (fără Composer)
$cfgFile = __DIR__ . '/config.php';
if (!file_exists($cfgFile)) {
  logf('FATAL: missing config.php');
  http_response_code(500);
  echo json_encode(['ok'=>false, 'error'=>'config_missing']);
  exit;
}
require $cfgFile; // definește STRIPE_SECRET_KEY, APP_BASE_URL, helperi fee etc.

if (empty(STRIPE_SECRET_KEY)) {
  logf('FATAL: STRIPE_SECRET_KEY is empty');
  http_response_code(500);
  echo json_encode(['ok'=>false, 'error'=>'stripe_key_missing']);
  exit;
}

// ---------- Helpers ----------
function base_url(): string {
  // forțează https pe producție
  $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
  return 'https://' . $host;
}
function get_json_body(): array {
  $raw = file_get_contents('php://input');
  $j = json_decode($raw ?? '', true);
  if (is_array($j)) return $j;
  // fallback pentru form-POST
  return $_POST ?? [];
}

// ---------- Input & validation ----------
$in = get_json_body();
logf('REQ ' . ($_SERVER['REMOTE_ADDR'] ?? '?') . ' body=' . json_encode($in));

$currency  = strtolower($in['currency'] ?? 'eur');

// 1) Compatibilitate veche: amount_eur = BRUT (exact cât incasează Stripe înainte de fee)
$gross_eur = isset($in['amount_eur']) ? (float)$in['amount_eur'] : null;

// 2) Nou: NET dorit — calculăm BRUTul estimat pentru a acoperi taxa Stripe
if ($gross_eur === null) {
  $net_eur = null;
  if (isset($in['net_eur']))          $net_eur = (float)$in['net_eur'];
  if (isset($in['amount_net_eur']))   $net_eur = (float)$in['amount_net_eur'];
  if ($net_eur !== null) {
    // round up la 2 zecimale (asigurăm acoperirea fee-ului)
    $gross_eur = ceil(gross_from_desired_net($net_eur) * 100) / 100;
  }
}

// fallback: dacă nici acum nu avem brut, încearcă "amount"
if ($gross_eur === null && isset($in['amount'])) {
  $gross_eur = (float)$in['amount'];
}

$gross_eur = (float)($gross_eur ?? 0);
$amountCents = (int)round($gross_eur * 100);

// Stripe minim 0.50
if ($amountCents < 50) {
  http_response_code(400);
  $msg = 'amount_too_small';
  logf("ERR 400 $msg amount_cents=$amountCents");
  echo json_encode(['ok'=>false, 'error'=>$msg]);
  exit;
}
if (!in_array($currency, ['eur','usd','gbp','ron','pln','huf'], true)) {
  http_response_code(400);
  $msg = 'unsupported_currency';
  logf("ERR 400 $msg currency=$currency");
  echo json_encode(['ok'=>false, 'error'=>$msg]);
  exit;
}

// meta (opțional)
$userId = (int)($_SESSION['user']['id'] ?? 0);
$email  = (string)($_SESSION['user']['email'] ?? ($in['email'] ?? ''));

// Estimări de taxă/NET doar pentru UX (în DB vei salva NET-ul real via webhook)
$fee_est  = estimate_fee_on_gross($gross_eur);
$net_est  = max(0.0, $gross_eur - $fee_est);

// ---------- Stripe call (fără SDK) ----------
$successUrl = APP_BASE_URL . '/v1/thanks.html?session_id={CHECKOUT_SESSION_ID}';
$cancelUrl  = APP_BASE_URL . '/v1/investitii.php?cancel=1';

// Construim payload URL-encoded
$fields = [
  'payment_method_types[0]'                       => 'card',
  'mode'                                          => 'payment',
  'line_items[0][quantity]'                       => 1,
  'line_items[0][price_data][currency]'           => $currency,
  'line_items[0][price_data][unit_amount]'        => $amountCents,                // BRUTUL care acoperă taxa
  'line_items[0][price_data][product_data][name]' => 'Investiție în Banca Comună',
  'success_url'                                   => $successUrl,
  'cancel_url'                                    => $cancelUrl,
  // metadata pentru reconciliere/rapoarte
  'metadata[user_id]'                             => $userId,
  'metadata[email]'                               => $email,
  'metadata[source]'                              => 'investitii.php',
  'metadata[gross_eur]'                           => number_format($gross_eur, 2, '.', ''),
  'metadata[fee_est_eur]'                         => number_format($fee_est, 2, '.', ''),
  'metadata[net_est_eur]'                         => number_format($net_est, 2, '.', ''),
  'metadata[currency]'                            => $currency,
  'metadata[version]'                             => 'v1-fee-aware',
];

// Prefill email (ajută UX la checkout)
if ($email !== '') {
  $fields['customer_email'] = $email;
}

$ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt_array($ch, [
  CURLOPT_POST            => true,
  CURLOPT_POSTFIELDS      => http_build_query($fields),
  CURLOPT_HTTPHEADER      => [
    'Authorization: Bearer ' . STRIPE_SECRET_KEY,
    'Content-Type: application/x-www-form-urlencoded',
  ],
  CURLOPT_RETURNTRANSFER  => true,
  CURLOPT_TIMEOUT         => 30,
]);
$respBody = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

logf("STRIPE http=$httpCode body=$respBody curlerr=" . ($curlErr ?: '-'));

if ($respBody === false || $curlErr) {
  http_response_code(502);
  echo json_encode(['ok'=>false, 'error'=>'stripe_unreachable']);
  exit;
}

$resp = json_decode($respBody, true);
if ($httpCode >= 400 || !is_array($resp) || empty($resp['id'])) {
  http_response_code(400);
  $code = $resp['error']['code'] ?? 'bad_request';
  $msg  = $resp['error']['message'] ?? 'Bad Request';
  logf("ERR 400 stripe_error code=$code msg=$msg");
  echo json_encode(['ok'=>false, 'error'=>$code, 'message'=>$msg]);
  exit;
}

// OK
echo json_encode([
  'ok'               => true,
  'id'               => $resp['id'],
  'url'              => $resp['url'] ?? null,
  'amount_cents'     => $amountCents,                 // BRUT (cât încasezi înainte de fee)
  'currency'         => $currency,
  'fee_est_eur'      => round($fee_est, 2),
  'net_est_eur'      => round($net_est, 2),
]);
