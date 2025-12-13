<?php
// /api/withdrawals/create.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

session_start();

if (empty($_SESSION['user']['id'])) {
    http_response_code(401);
    echo json_encode(['ok'=>false,'error'=>'unauthorized']);
    exit;
}
$userId = (int)$_SESSION['user']['id'];

require __DIR__ . '/../db.php'; // trebuie să îți dea $pdo conectat

// forțăm PDO să arunce excepții ca să nu mai „tacă”
try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Throwable $e) {
    // dacă db.php deja setează ERRMODE_EXCEPTION nu e problemă
}

// -------- helpers mici (copiate din logică existentă) --------

function clamp($x,$a,$b){ return max($a, min($b, $x)); }

function sum_cents(PDO $pdo, string $table, int $uid, ?string $from=null, ?string $to=null, string $extra=''): int {
    $where = 'user_id = :uid';
    if ($extra) $where .= " AND $extra";
    if ($from !== null) $where .= ' AND created_at >= :from';
    if ($to   !== null) $where .= ' AND created_at <  :to';

    $sql = "SELECT COALESCE(SUM(amount_cents),0) FROM {$table} WHERE {$where}";
    $st  = $pdo->prepare($sql);
    $st->bindValue(':uid',$uid,PDO::PARAM_INT);
    if ($from !== null) $st->bindValue(':from',$from);
    if ($to   !== null) $st->bindValue(':to',$to);
    $st->execute();
    return (int)$st->fetchColumn();
}

// sold live = investiții confirmate + profit distribuit (aceeași logică ca /api/wallet/summary.php)
function get_live_balance_cents(PDO $pdo, int $uid): int {
    $inv_all = sum_cents($pdo,'investments',$uid,null,null,"status='succeeded'");
    $pnl_all = sum_cents($pdo,'profit_distributions',$uid,null,null);
    $bal = $inv_all + $pnl_all;
    return max(0,$bal);
}

// bani deja „blocați” în cereri PENDING neresorbate
function get_reserved_pending_cents(PDO $pdo, int $uid): int {
    $sql = "SELECT COALESCE(SUM(amount_cents + fee_cents),0)
            FROM withdrawal_requests
            WHERE user_id=:u AND status='pending' AND fee_mode='on_top'";
    $st = $pdo->prepare($sql);
    $st->execute([':u'=>$uid]);
    return (int)$st->fetchColumn();
}

// recomputăm taxa pe server, ca protecție
function compute_fee_rate_server(?float $client_rate): float {
    // limite „safe”
    $MIN = 0.006; // 0.6%
    $MAX = 0.035; // 3.5%

    if ($client_rate !== null && $client_rate > 0) {
        return clamp($client_rate, $MIN, $MAX);
    }
    // fallback dacă clientul nu ne-a trimis nimic valid
    return 0.012; // 1.2% default
}

// -------- citim request body --------

$raw = file_get_contents('php://input');
$in  = json_decode($raw ?: '[]', true) ?: [];

$amount_eur        = isset($in['amount_eur']) ? (float)$in['amount_eur'] : 0.0;
$client_fee_rate   = isset($in['client_fee_rate']) ? (float)$in['client_fee_rate'] : null;
$fee_mode          = isset($in['fee_mode']) ? (string)$in['fee_mode'] : 'on_top';

// sanity check pe sumă (nu lăsăm să bage prostii gen 9999999999)
if (!is_finite($amount_eur) || $amount_eur <= 0 || $amount_eur > 100000) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'invalid_amount']);
    exit;
}
if ($fee_mode !== 'on_top' && $fee_mode !== 'from_amount') {
    $fee_mode = 'on_top';
}

// -------- calculăm fee, verificăm disponibil --------

$rate          = compute_fee_rate_server($client_fee_rate);
$amount_cents  = (int)round($amount_eur * 100);
$fee_cents     = (int)round($amount_cents * $rate + 50); // +0.50€ fix

$balance_cents  = get_live_balance_cents($pdo,$userId);
$reserved_cents = get_reserved_pending_cents($pdo,$userId);

// impactul real asupra soldului, în modul on_top plătim și taxa peste sumă
if ($fee_mode === 'on_top') {
    $impact_cents = $amount_cents + $fee_cents;
} else {
    // notăm logică, chiar dacă UI folosește 'on_top'
    $impact_cents = $amount_cents;
}

$available_cents = max(0,$balance_cents - $reserved_cents);

if ($impact_cents > $available_cents) {
    http_response_code(409);
    echo json_encode([
        'ok' => false,
        'error' => 'insufficient_funds',
        'available_eur' => round($available_cents/100,2),
    ]);
    exit;
}

// -------- INSERT efectiv în DB --------

try {
    $sql = "INSERT INTO withdrawal_requests
            (user_id, amount_cents, fee_cents, fee_rate, fee_mode, method, status, created_at)
            VALUES
            (:u, :amt, :fee, :rate, :mode, 'bank-transfer', 'pending', NOW())";
    $st = $pdo->prepare($sql);
    $st->execute([
        ':u'    => $userId,
        ':amt'  => $amount_cents,
        ':fee'  => $fee_cents,
        ':rate' => $rate,
        ':mode' => $fee_mode,
    ]);

    $id = (int)$pdo->lastInsertId();

    echo json_encode([
        'ok'        => true,
        'id'        => $id,
        'status'    => 'pending',
        'amount_eur'=> round($amount_cents/100,2),
        'fee_eur'   => round($fee_cents/100,2),
        'fee_rate'  => $rate,
        'fee_mode'  => $fee_mode
    ], JSON_UNESCAPED_UNICODE);
    exit;

} catch (Throwable $e) {
    // AICI e partea nouă: dacă insertul pică (tabela nu există, FK fail etc)
    http_response_code(500);
    echo json_encode([
        'ok'    => false,
        'error' => 'db_insert_failed',
        'msg'   => $e->getMessage(),       // VERY HELPFUL la debugging
        'code'  => $e->getCode(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
