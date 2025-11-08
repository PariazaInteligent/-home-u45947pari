<?php
// /api/payments/stripe_create_checkout.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=UTF-8');

if (empty($_SESSION['user']['id'])) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }
require __DIR__ . '/../db.php';
require __DIR__ . '/../../vendor/autoload.php';

\Stripe\Stripe::setApiKey(getenv('STRIPE_SECRET'));

$me = $_SESSION['user'];
$userId = (int)$me['id'];
$amountEur = (float)($_POST['amount_eur'] ?? 0);
if ($amountEur <= 0) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'amount']); exit; }
$amountCents = (int)round($amountEur * 100);

try {
  // Stripe Checkout activează automat Google Pay pe browsere eligibile
  $session = \Stripe\Checkout\Session::create([
    'mode' => 'payment',
    'client_reference_id' => (string)$userId,                 // pentru webhook mapping
    'customer_email' => $me['email'] ?? null,
    'line_items' => [[
      'price_data' => [
        'currency' => 'eur',
        'unit_amount' => $amountCents,
        'product_data' => [ 'name' => 'Depunere fonduri' ],
      ],
      'quantity' => 1,
    ]],
    'success_url' => 'https://exemplu.ro/v1/depozit-succes.html?sid={CHECKOUT_SESSION_ID}',
    'cancel_url'  => 'https://exemplu.ro/v1/depozit-anulat.html',
    'metadata' => ['user_id' => $userId],
    // Google Pay vine prin method type "card" pe Checkout; nu mai e nevoie de setări extra aici
  ]);

  echo json_encode(['ok'=>true, 'url'=>$session->url]);
} catch (\Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'stripe']);
}
