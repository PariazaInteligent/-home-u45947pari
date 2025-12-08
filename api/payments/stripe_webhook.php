<?php
// /api/payments/stripe_webhook.php
declare(strict_types=1);
require __DIR__ . '/../db.php';
require __DIR__ . '/../../vendor/autoload.php';

$payload = @file_get_contents('php://input');
$sig = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$endpointSecret = getenv('STRIPE_WEBHOOK_SECRET');

try {
  $event = \Stripe\Webhook::constructEvent($payload, $sig, $endpointSecret);
} catch (\Throwable $e) {
  http_response_code(400); exit('bad sig');
}

$type = $event->type;

try {
  if ($type === 'checkout.session.completed') {
    $session = $event->data->object;
    $amountTotal = (int)$session->amount_total;         // în cenți
    $currency    = strtoupper($session->currency ?? 'EUR');
    $ref         = $session->id;
    $userId      = (int)($session->client_reference_id ?? 0);

    if ($userId > 0 && $amountTotal > 0) {
      // upsert simplu
      $stmt = $pdo->prepare("SELECT id FROM payments WHERE provider='stripe' AND provider_ref=? LIMIT 1");
      $stmt->execute([$ref]);
      $id = $stmt->fetchColumn();

      if ($id) {
        $upd = $pdo->prepare("UPDATE payments SET status='succeeded', amount_cents=?, currency=?, confirmed_at=NOW() WHERE id=?");
        $upd->execute([$amountTotal, $currency, $id]);
      } else {
        $ins = $pdo->prepare("INSERT INTO payments (user_id, amount_cents, currency, method, provider, provider_ref, status, confirmed_at, meta)
                              VALUES (?,?,?,?,?,?,?,?,?)");
        $ins->execute([$userId, $amountTotal, $currency, 'card', 'stripe', $ref, 'succeeded', date('Y-m-d H:i:s'), json_encode(['src'=>'checkout.session.completed'])]);
      }
    }
  }

  // (opțional) payment_intent.succeeded – similar, dacă preferi PI direct
  http_response_code(200);
  echo 'ok';
} catch (\Throwable $e) {
  http_response_code(500);
  echo 'err';
}
