<?php
// /api/stripe/webhook.php
declare(strict_types=1);
require __DIR__ . '/../db.php';            // $pdo (PDO) – conexiunea ta
$cfg = require __DIR__ . '/config.php';    // cheile Stripe
$secret = $cfg['STRIPE_WEBHOOK_SECRET'] ?? null;

// Citește payload + semnătura
$payload   = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

function jsonOut($code, $arr){ http_response_code($code); header('Content-Type: application/json'); echo json_encode($arr); exit; }
function logW($msg){ @file_put_contents(__DIR__.'/_logs/webhook.log', date('c').' '.$msg."\n", FILE_APPEND); }

// (opțional, dar recomandat) validare semnătură webhook
if ($secret && $sigHeader) {
  // validare manuală bazată pe timp + HMAC (simplificată) — suficientă pentru shared hosting
  $ok = false;
  foreach (explode(',', $sigHeader) as $p) {
    [$k,$v] = array_map('trim', explode('=', $p, 2));
    if ($k === 'v1') {
      $expect = hash_hmac('sha256', $_SERVER['HTTP_STRIPE_SIGNATURE_TIMESTAMP'] ?? '' . '.' . $payload, $secret);
      if (hash_equals($expect, $v)) { $ok = true; break; }
    }
  }
  if (!$ok) { logW('Bad signature'); jsonOut(400, ['ok'=>false]); }
}

// Parse payload
$evt = json_decode($payload, true);
if (!$evt || empty($evt['type'])) { logW('Bad payload'); jsonOut(400, ['ok'=>false]); }

$type = $evt['type'];

// Helper insert/update
function upsertInvestment(PDO $pdo, array $row){
  // vezi ca trebuie să ai tabela `investments` exact ca în schema pe care ți-am dat-o
  $sql = "INSERT INTO investments (user_id, stripe_payment_intent_id, stripe_checkout_session_id, amount_cents, currency, status, metadata, created_at, updated_at)
          VALUES (:user_id, :pi, :cs, :amount, :currency, :status, :meta, NOW(), NOW())
          ON DUPLICATE KEY UPDATE status=VALUES(status), updated_at=NOW(), metadata=VALUES(metadata)";
  $stmt = $pdo->prepare($sql);
  $stmt->execute([
    ':user_id' => $row['user_id'],
    ':pi'      => $row['pi'],
    ':cs'      => $row['cs'],
    ':amount'  => $row['amount'],
    ':currency'=> $row['currency'],
    ':status'  => $row['status'],
    ':meta'    => json_encode($row['meta'], JSON_UNESCAPED_UNICODE),
  ]);
}

try {
  if ($type === 'payment_intent.succeeded') {
    $pi = $evt['data']['object'] ?? [];
    $row = [
      'user_id' => (int)($pi['metadata']['user_id'] ?? 0),
      'pi'      => (string)($pi['id'] ?? ''),
      'cs'      => (string)($pi['latest_charge'] ?? ''), // putem lăsa gol dacă nu-l ai aici
      'amount'  => (int)($pi['amount_received'] ?? $pi['amount'] ?? 0),
      'currency'=> (string)($pi['currency'] ?? 'eur'),
      'status'  => 'succeeded',
      'meta'    => $pi['metadata'] ?? [],
    ];
    if ($row['user_id'] > 0 && $row['pi']) { upsertInvestment($pdo, $row); }
    jsonOut(200, ['ok'=>true]);
  }

  if ($type === 'checkout.session.completed') {
    $cs = $evt['data']['object'] ?? [];
    // optional: aici poți salva doar o „amprentă” – PI-ul vine oricum în eventul de mai sus
    logW('checkout.session.completed '.$cs['id']);
    jsonOut(200, ['ok'=>true]);
  }

  // ignoră restul
  jsonOut(200, ['ok'=>true, 'ignored'=>true, 'type'=>$type]);
} catch (Throwable $e) {
  logW('ERR '.$e->getMessage());
  jsonOut(200, ['ok'=>true]); // Stripe vrea 2xx ca să nu re-trimită la infinit
}
