<?php
// /api/investments/by_session.php
declare(strict_types=1);

// ===== Headers & safety =====
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

error_reporting(E_ALL);
ini_set('display_errors', '0'); // nu arătăm erori brute în producție

// ===== Small helpers =====
function jexit(int $code, array $payload) {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}
function log_line(string $sid, string $msg) {
  $dir = __DIR__ . '/../stripe/_logs';
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  @file_put_contents(
    $dir . '/by_session_' . preg_replace('~[^a-zA-Z0-9_\-]~', '_', $sid) . '.log',
    '['.date('Y-m-d H:i:s')."] ".$msg.PHP_EOL,
    FILE_APPEND
  );
}
function stripe_get(string $url, string $secret, int $timeout = 20): array {
  $ch = curl_init();
  curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPAUTH       => CURLAUTH_BASIC,
    CURLOPT_USERPWD        => $secret . ':',
    CURLOPT_TIMEOUT        => $timeout,
  ]);
  $res  = curl_exec($ch);
  $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err  = curl_error($ch);
  curl_close($ch);
  if ($err) throw new Exception('cURL: '.$err);
  $payload = json_decode((string)$res, true);
  if ($http >= 400 || !is_array($payload)) {
    throw new Exception("Stripe HTTP $http: ".substr((string)$res,0,500));
  }
  return $payload;
}

// ===== Input =====
$sid = trim((string)($_GET['session_id'] ?? ''));
if ($sid === '' || !preg_match('~^cs_[A-Za-z0-9_]+~', $sid)) {
  jexit(400, ['ok'=>false, 'error'=>'invalid_session_id']);
}

// ===== Config & DB =====
require __DIR__ . '/../stripe/config.php'; // cheie Stripe
require __DIR__ . '/../db.php';            // $pdo (PDO)

// Obține secretul indiferent de denumire
$stripe_secret =
  (isset($STRIPE_SECRET) ? $STRIPE_SECRET : null)
  ?? (defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : null)
  ?? (getenv('STRIPE_SECRET_KEY') ?: null);

if (!$stripe_secret) {
  log_line($sid, 'Missing Stripe secret key');
  jexit(500, ['ok'=>false, 'error'=>'server_misconfigured']);
}

// ===== Stripe: Checkout Session + expand pentru PaymentIntent / Charge / Balance TXN =====
try {
  $sess = stripe_get(
    "https://api.stripe.com/v1/checkout/sessions/".rawurlencode($sid)
      ."?expand[]=payment_intent"
      ."&expand[]=payment_intent.latest_charge"
      ."&expand[]=payment_intent.latest_charge.balance_transaction"
      ."&expand[]=customer",
    $stripe_secret
  );
} catch (Throwable $e) {
  log_line($sid, 'Stripe fetch session failed: '.$e->getMessage());
  jexit(502, ['ok'=>false, 'error'=>'stripe_unreachable']);
}

// ===== Extract data =====
$pi            = $sess['payment_intent'] ?? null;
$pi_id         = is_array($pi) ? ($pi['id'] ?? null) : (is_string($pi) ? $pi : null);
$pi_status     = is_array($pi) ? ($pi['status'] ?? null) : null;
$payment_status= $sess['payment_status'] ?? null; // 'paid' / 'unpaid'
$currency      = strtolower($sess['currency'] ?? ($pi['currency'] ?? 'eur'));
$email         = $sess['customer_details']['email'] ?? ($sess['customer_email'] ?? null);
$amount_total  = (int)($sess['amount_total'] ?? ($pi['amount'] ?? 0)); // brut (cenți) pentru fallback

// Dacă nu s-a confirmat încă, răspundem 202 -> front-ul mai face polling
if ($pi_status !== 'succeeded' && $payment_status !== 'paid') {
  log_line($sid, "Pending: pi_status={$pi_status}, payment_status={$payment_status}");
  jexit(202, ['ok'=>true, 'status'=>'pending']);
}

// ===== Charge + Balance Transaction (NET după taxe) =====
$charge      = null;
$charge_id   = null;
$bal_txn     = null;
$bal_txn_id  = null;

if (is_array($pi) && !empty($pi['latest_charge'])) {
  if (is_array($pi['latest_charge'])) {
    $charge    = $pi['latest_charge'];
    $charge_id = $charge['id'] ?? null;
    if (!empty($charge['balance_transaction'])) {
      if (is_array($charge['balance_transaction'])) {
        $bal_txn    = $charge['balance_transaction'];
        $bal_txn_id = $bal_txn['id'] ?? null;
      } elseif (is_string($charge['balance_transaction'])) {
        $bal_txn_id = $charge['balance_transaction'];
      }
    }
  } elseif (is_string($pi['latest_charge'])) {
    $charge_id = $pi['latest_charge'];
  }
}

// Dacă nu avem încă balance_transaction expandat, îl cerem separat
if (!$bal_txn && $charge_id) {
  try {
    $charge_full = stripe_get(
      "https://api.stripe.com/v1/charges/".rawurlencode($charge_id)."?expand[]=balance_transaction",
      $stripe_secret
    );
    if (is_array($charge_full)) {
      $charge = $charge_full;
      if (!empty($charge_full['balance_transaction'])) {
        if (is_array($charge_full['balance_transaction'])) {
          $bal_txn    = $charge_full['balance_transaction'];
          $bal_txn_id = $bal_txn['id'] ?? null;
        } elseif (is_string($charge_full['balance_transaction'])) {
          $bal_txn_id = $charge_full['balance_transaction'];
        }
      }
    }
  } catch (Throwable $e) {
    log_line($sid, 'Fetch charge failed: '.$e->getMessage());
  }
}

// Ca ultim fallback, dacă tot nu avem obiectul balance_transaction, îl cerem direct:
if (!$bal_txn && $bal_txn_id) {
  try {
    $bal_txn = stripe_get(
      "https://api.stripe.com/v1/balance_transactions/".rawurlencode($bal_txn_id),
      $stripe_secret
    );
  } catch (Throwable $e) {
    log_line($sid, 'Fetch balance_txn failed: '.$e->getMessage());
  }
}

// Calcul sume (cenți)
$gross_cents = null;
$fee_cents   = null;
$net_cents   = null;

if (is_array($bal_txn)) {
  $gross_cents = isset($bal_txn['amount']) ? (int)$bal_txn['amount'] : null; // valoarea brută
  $fee_cents   = isset($bal_txn['fee'])    ? (int)$bal_txn['fee']    : null; // total taxe Stripe
  $net_cents   = isset($bal_txn['net'])    ? (int)$bal_txn['net']    : null; // după taxe (ce rămâne)
}

// Fallback-uri prietenoase (fără presupuneri complicate)
if ($gross_cents === null) $gross_cents = (int)$amount_total;
if ($net_cents   === null) $net_cents   = (int)$amount_total; // dacă nu avem balance_txn, salvăm brutul
if ($fee_cents   === null) $fee_cents   = (int)max(0, $gross_cents - $net_cents);

$user_id = (int)($sess['metadata']['user_id'] ?? ($pi['metadata']['user_id'] ?? 0));

// ===== Resolve user_id dacă nu a venit din metadata =====
if ($user_id <= 0) {
  @session_start();
  if (!empty($_SESSION['user']['id'])) {
    $user_id = (int)$_SESSION['user']['id'];
  }
}
if ($user_id <= 0 && $email) {
  $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
  $stmt->execute([':email'=>$email]);
  $user_id = (int)($stmt->fetchColumn() ?: 0);
}
if ($user_id <= 0) {
  log_line($sid, 'Could not resolve user_id (no metadata/session/email match)');
}

// ===== Insert only once (idempotent) =====
try {
  $q = $pdo->prepare("SELECT id FROM investments WHERE stripe_payment_intent_id = :pi OR stripe_checkout_session_id = :sid LIMIT 1");
  $q->execute([':pi'=>$pi_id, ':sid'=>$sid]);
  $exists = (int)($q->fetchColumn() ?: 0);

  if (!$exists) {
    $ins = $pdo->prepare("
      INSERT INTO investments
      (user_id, stripe_payment_intent_id, stripe_checkout_session_id, amount_cents, currency, status, metadata, created_at, updated_at)
      VALUES (:user_id, :pi, :sid, :amount, :currency, :status, :metadata, NOW(), NOW())
    ");

    // amount_cents = NET după taxe (dorința ta)
    $md = json_encode([
      'session_id'       => $sid,
      'email'            => $email,
      'charge_id'        => $charge_id,
      'balance_txn_id'   => $bal_txn_id,
      'gross_cents'      => $gross_cents,
      'fee_cents'        => $fee_cents,
      'net_cents'        => $net_cents,
      'raw'              => ['payment_status'=>$payment_status, 'pi_status'=>$pi_status],
    ], JSON_UNESCAPED_UNICODE);

    $ins->execute([
      ':user_id'  => $user_id ?: null,
      ':pi'       => $pi_id,
      ':sid'      => $sid,
      ':amount'   => $net_cents,   // <<<<< NET (după taxe)
      ':currency' => $currency,
      ':status'   => 'succeeded',
      ':metadata' => $md,
    ]);

    log_line($sid, "Inserted investment id=".$pdo->lastInsertId()." user_id=".$user_id." net_cents=".$net_cents." fee_cents=".$fee_cents." gross_cents=".$gross_cents);
  } else {
    log_line($sid, "Investment already exists for sid/pi");
  }
} catch (Throwable $e) {
  log_line($sid, "DB error: ".$e->getMessage());
  jexit(500, ['ok'=>false, 'error'=>'db_error']);
}

// ===== Done =====
jexit(200, [
  'ok'        => true,
  'status'    => 'succeeded',
  'currency'  => $currency,
  'pi'        => $pi_id,
  'user_id'   => $user_id,
  'amount'    => $net_cents,        // NET (cenți) salvat în DB
  'gross'     => $gross_cents,      // informativ
  'fee'       => $fee_cents,        // informativ
]);
