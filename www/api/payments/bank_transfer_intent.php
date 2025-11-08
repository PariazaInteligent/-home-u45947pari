<?php
// /api/payments/bank_transfer_intent.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=UTF-8');
if (empty($_SESSION['user']['id'])) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }
require __DIR__ . '/../db.php';

$userId = (int)$_SESSION['user']['id'];
$amountEur = (float)($_POST['amount_eur'] ?? 0);
if ($amountEur <= 0) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'amount']); exit; }

$amountCents = (int)round($amountEur * 100);
$ref = 'PI-' . $userId . '-' . substr(bin2hex(random_bytes(4)),0,8);

$ins = $pdo->prepare("INSERT INTO payments (user_id, amount_cents, currency, method, provider, provider_ref, status, meta)
                      VALUES (?,?,?,?,?,?,?,?)");
$ins->execute([$userId, $amountCents, 'EUR', 'bank_transfer', 'manual', $ref, 'pending', json_encode(['note'=>'awaiting bank transfer'])]);

echo json_encode([
  'ok'=>true,
  'reference'=>$ref,
  'iban'=>'ROxx XXXX XXXX XXXX XXXX XXXX',      // IBAN-ul tău
  'beneficiar'=>'Nume Beneficiar',
  'detalii'=>"Include referința: $ref",
  'amount_eur'=>$amountEur
]);
