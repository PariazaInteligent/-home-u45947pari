<?php
// /api/admin/withdrawals/decision.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

session_start();
if (empty($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit;
}
$me = $_SESSION['user'];
$role = strtoupper($me['role'] ?? 'USER');
if ($role !== 'ADMIN') {
  http_response_code(403);
  echo json_encode(['ok'=>false,'error'=>'forbidden']); exit;
}

require __DIR__ . '/../../api/db.php'; // ajustă dacă path-ul e diferit

// === parse input JSON ===
$raw = file_get_contents('php://input');
$in  = json_decode($raw, true) ?? [];

$wid    = isset($in['request_id']) ? (int)$in['request_id'] : 0;
$action = strtolower(trim($in['action'] ?? ''));

if ($wid <= 0 || !in_array($action, ['approve','reject'], true)) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>'bad_request']); exit;
}

try {
  $pdo->beginTransaction();

  // luăm cererea + user info și blocăm rândul pt siguranță
  $st = $pdo->prepare("
    SELECT wr.id,
           wr.user_id,
           wr.amount_cents,
           wr.fee_cents,
           wr.fee_rate,
           wr.fee_mode,
           wr.status,
           wr.method,
           wr.created_at,
           u.email AS user_email,
           u.bank_iban AS user_iban,  -- dacă la tine coloana se numește altfel (ex: iban), schimbă aici
           u.name      AS user_name
      FROM withdrawal_requests wr
      JOIN users u ON u.id = wr.user_id
     WHERE wr.id = :wid
     FOR UPDATE
  ");
  $st->execute([':wid'=>$wid]);
  $req = $st->fetch(PDO::FETCH_ASSOC);

  if (!$req) {
    $pdo->rollBack();
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'not_found']); exit;
  }

  if ($req['status'] !== 'pending') {
    // deja procesată de alt admin?
    $pdo->rollBack();
    http_response_code(409);
    echo json_encode(['ok'=>false,'error'=>'already_processed']); exit;
  }

  $uid          = (int)$req['user_id'];
  $amountCents  = (int)$req['amount_cents']; // cât intră efectiv la user
  $feeCents     = (int)$req['fee_cents'];    // taxa platformei
  $grossBlocked = $amountCents + $feeCents;  // asta am blocat anterior din sold
  $method       = $req['method'] ?: 'bank-transfer';

  if ($action === 'reject') {
    // 1. marchează cererea ca respinsă
    $stU = $pdo->prepare("
      UPDATE withdrawal_requests
         SET status='rejected',
             processed_at=NOW(),
             updated_at=NOW()
       WHERE id=:wid
    ");
    $stU->execute([':wid'=>$wid]);

    // 2. ledger_tx: punem banii înapoi (sumă pozitivă == deblochează)
    $metaReject = [
      'request_id' => $wid,
      'note'       => 'withdrawal_rejected_refund_blocked_funds'
    ];
    $stL = $pdo->prepare("
      INSERT INTO ledger_tx (user_id, kind, status, amount_cents, method, meta)
      VALUES (:uid,'WITHDRAWAL_REQUEST','REJECTED',:amt,:method,:meta)
    ");
    $stL->execute([
      ':uid'    => $uid,
      ':amt'    => $grossBlocked, // +X => adăugăm la soldul disponibil
      ':method' => $method,
      ':meta'   => json_encode($metaReject, JSON_UNESCAPED_UNICODE),
    ]);

    $pdo->commit();
    echo json_encode(['ok'=>true,'result'=>'rejected']); exit;
  }

  // === approve flow ===

  // încercăm să determinăm dacă putem face payout "automat"
  // dacă ai integrat un provider bancar, aici ai trimite cererea reală la provider
  // Deocamdată doar decidem modul.
  $iban = trim((string)($req['user_iban'] ?? '')); // poate fi gol
  $payoutMode = $iban !== '' ? 'auto' : 'manual';

  // construim meta pentru ledger_tx ca să știm ulterior cum a fost plătit
  $metaApprove = [
    'request_id'      => $wid,
    'payout_mode'     => $payoutMode,        // 'auto' vs 'manual'
    'method'          => $method,            // ex. 'bank-transfer'
    'amount_eur'      => $amountCents / 100, // cât primește userul
    'fee_eur'         => $feeCents / 100,    // cât a costat taxa
    'gross_blocked_eur' => $grossBlocked / 100,
    'iban'            => $iban !== '' ? $iban : null,
    // poți salva aici raspunsul providerului bancar când integrezi plățile reale
    'note'            => ($payoutMode === 'manual'
                         ? 'manual_transfer_required'
                         : 'auto_payout_initiated')
  ];

  // 1. marcăm cererea ca aprobată
  $stU = $pdo->prepare("
    UPDATE withdrawal_requests
       SET status='approved',
           processed_at=NOW(),
           updated_at=NOW()
     WHERE id=:wid
  ");
  $stU->execute([':wid'=>$wid]);

  // 2. ledger_tx: marcăm retragerea efectivă
  //    NOTĂ: la momentul cererii PENDING am deja un ledger_tx cu amount_cents = -(amount+fee)
  //    deci aici NU mai scoatem încă o dată banii din sold.
  //    Facem doar un eveniment de tip WITHDRAWAL, status APPROVED, amount_cents = 0.
  $stL = $pdo->prepare("
    INSERT INTO ledger_tx (user_id, kind, status, amount_cents, method, meta)
    VALUES (:uid,'WITHDRAWAL','APPROVED',0,:method,:meta)
  ");
  $stL->execute([
    ':uid'    => $uid,
    ':method' => $method,
    ':meta'   => json_encode($metaApprove, JSON_UNESCAPED_UNICODE),
  ]);

  $pdo->commit();

  echo json_encode([
    'ok'          => true,
    'result'      => 'approved',
    'payout_mode' => $payoutMode
  ]);
  exit;

} catch (Throwable $e) {
  if ($pdo->inTransaction()) { $pdo->rollBack(); }
  http_response_code(500);
  echo json_encode([
    'ok'=>false,
    'error'=>'server_error',
    'detail'=>$e->getMessage(),
  ]);
  exit;
}
