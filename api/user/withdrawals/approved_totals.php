<?php
// /api/user/withdrawals/approved_totals.php
header('Content-Type: application/json; charset=utf-8');
session_start();

if (empty($_SESSION['user'])) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit; }
$uid = (int)($_SESSION['user']['id'] ?? 0);
if ($uid <= 0) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit; }

require __DIR__ . '/../../api/db.php'; // $pdo

$range = $_GET['range'] ?? 'all';
$dateWhere = '';
if ($range === 'today') {
  // doar retragerile procesate azi
  $dateWhere = "AND wr.processed_at >= CURRENT_DATE AND wr.processed_at < CURRENT_DATE + INTERVAL 1 DAY";
}

try {
  // Luăm câmpurile posibile; calculăm fee în PHP ca să fim compatibili cu diverse coloane
  $sql = "
    SELECT
      wr.amount_cents,
      wr.fee_total_cents,
      wr.fee_cents,
      wr.fee_fixed_cents,
      wr.fee_rate_bps,
      wr.fee_rate_millis,
      wr.fee_rate_pct
    FROM withdrawal_requests wr
    WHERE wr.user_id = :uid
      AND wr.status = 'approved'
      AND wr.processed_at IS NOT NULL
      $dateWhere
  ";
  $st = $pdo->prepare($sql);
  $st->execute([':uid'=>$uid]);

  $sumAmt = 0;      // total sume solicitate (cents)
  $sumFee = 0;      // total taxe (cents)
  foreach ($st as $r) {
    $amt = (int)($r['amount_cents'] ?? 0);
    $sumAmt += $amt;

    // încercăm, în ordine: fee_total_cents, fee_cents, (rate% * amount) + fee_fixed_cents, altfel 0
    $fee = 0;
    if (isset($r['fee_total_cents']) && $r['fee_total_cents'] !== null) {
      $fee = (int)$r['fee_total_cents'];
    } elseif (isset($r['fee_cents']) && $r['fee_cents'] !== null) {
      $fee = (int)$r['fee_cents'];
    } else {
      $fixed = (int)($r['fee_fixed_cents'] ?? 0); // dacă ai persistat +0,99€ la aprobare, e aici
      $ratePct = null;

      if (isset($r['fee_rate_pct']) && $r['fee_rate_pct'] !== null)      $ratePct = (float)$r['fee_rate_pct'];
      elseif (isset($r['fee_rate_bps']) && $r['fee_rate_bps'] !== null)  $ratePct = ((int)$r['fee_rate_bps'])/100.0;
      elseif (isset($r['fee_rate_millis']) && $r['fee_rate_millis'] !== null) $ratePct = ((int)$r['fee_rate_millis'])/1000.0;

      $perc = $ratePct !== null ? (int)ceil($amt * ($ratePct/100.0)) : 0;
      $fee  = $perc + $fixed;
    }

    $sumFee += max(0, $fee);
  }

  echo json_encode([
    'ok'          => true,
    'amount_cents'=> $sumAmt,
    'fee_cents'   => $sumFee,
    'outflow_cents' => $sumAmt + $sumFee, // cât iese din portofel (inclusiv taxe)
  ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error']);
}
