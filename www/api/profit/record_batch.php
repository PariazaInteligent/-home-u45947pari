<?php
// /api/profit/record_batch.php
// Scop: după ce un bet value își schimbă statusul, APELĂM ACEST ENDPOINT cu distribuția pe investitori.
// Securizat prin sesiune: doar ADMIN.
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$me = $_SESSION['user'] ?? null;
if (!$me || strtoupper($me['role'] ?? 'GUEST') !== 'ADMIN') {
  http_response_code(403);
  echo json_encode(['ok'=>false,'error'=>'forbidden']);
  exit;
}

require __DIR__ . '/../db.php';

function jexit(int $code, array $p){ http_response_code($code); echo json_encode($p, JSON_UNESCAPED_UNICODE); exit; }
function body_json(): array {
  $raw = file_get_contents('php://input');
  $j = json_decode($raw ?? '', true);
  return is_array($j) ? $j : [];
}

/*
  Așteptăm JSON de forma:
  {
    "event_uid": "bet_123_status_20251018T220544Z",   // idempotency key (unic)
    "bet_id": 123,
    "status": "WON" | "LOST" | "VOID" | "HALF_WON" | "HALF_LOST" | "PENDING",
    "gross_bank_cents": 250000,  // profit/pierdere BRUTĂ a băncii (poate fi negativ)
    "platform_fee_bps": 800,     // comision platformă în basis points (8% = 800). Aplicat DOAR pe sume pozitive.
    "currency": "eur",
    "allocations": [
      {"user_id": 7, "share_bps": 2500},  // 25.00% din profitul băncii
      {"user_id": 11, "share_bps": 7500}  // 75.00%
    ],
    "note": "Distribuție după meciul X"
  }
*/

$in = body_json();
$event_uid = trim((string)($in['event_uid'] ?? ''));
$bet_id    = (int)($in['bet_id'] ?? 0);
$status    = strtoupper((string)($in['status'] ?? ''));
$gross_bank_cents = (int)($in['gross_bank_cents'] ?? 0);
$fee_bps   = (int)($in['platform_fee_bps'] ?? 0);
$currency  = strtolower((string)($in['currency'] ?? 'eur'));
$alloc     = is_array($in['allocations'] ?? null) ? $in['allocations'] : [];
$note      = substr((string)($in['note'] ?? ''), 0, 250);

$valid_status = ['PENDING','WON','LOST','VOID','HALF_WON','HALF_LOST'];
if (!$event_uid || !$bet_id || !in_array($status, $valid_status, true) || !$alloc) {
  jexit(400, ['ok'=>false,'error'=>'bad_request']);
}

try {
  $pdo->beginTransaction();

  foreach ($alloc as $a) {
    $uid = (int)($a['user_id'] ?? 0);
    $bps = (int)($a['share_bps'] ?? 0); // 10000 = 100%
    if ($uid <= 0 || $bps <= 0) continue;

    // Partea investitorului din profitul/pierderea brută a băncii
    $gross_share = (int)round($gross_bank_cents * $bps / 10000);

    // Comision DOAR pe sume pozitive
    $fee = 0;
    if ($gross_share > 0 && $fee_bps > 0) {
      $fee = (int)round($gross_share * $fee_bps / 10000);
    }

    $net = $gross_share - $fee;

    // Folosim un event UID per utilizator (idempotency) — ca să putem re-trimite fără dubluri
    $row_event = $event_uid . '_u' . $uid;

    $stmt = $pdo->prepare("
      INSERT INTO profit_ledger (event_uid, user_id, bet_id, status, gross_cents, fee_cents, net_cents, currency, note, created_at, updated_at)
      VALUES (:event_uid, :uid, :bet, :status, :gross, :fee, :net, :currency, :note, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        gross_cents=VALUES(gross_cents),
        fee_cents=VALUES(fee_cents),
        net_cents=VALUES(net_cents),
        status=VALUES(status),
        note=VALUES(note),
        updated_at=NOW()
    ");
    $stmt->execute([
      ':event_uid' => $row_event,
      ':uid'       => $uid,
      ':bet'       => $bet_id,
      ':status'    => $status,
      ':gross'     => $gross_share,
      ':fee'       => $fee,
      ':net'       => $net,
      ':currency'  => $currency,
      ':note'      => $note,
    ]);
  }

  $pdo->commit();
  jexit(200, ['ok'=>true]);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  jexit(500, ['ok'=>false,'error'=>'db_error','message'=>$e->getMessage()]);
}
