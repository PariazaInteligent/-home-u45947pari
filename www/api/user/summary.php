<?php
// /api/user/summary.php
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

require __DIR__ . '/../db.php'; // $pdo

/**
 * RANGE HANDLING (există deja în dashboard și îl păstrăm)
 * Acceptă ?range=today sau orice altceva (=all)
 */
function resolve_range(string $range): array {
  $r = strtolower(trim($range));
  if ($r !== 'today') {  // tot ce nu e "today" => all
    return ['key' => 'all', 'from' => null, 'to' => null];
  }
  $from = (new DateTimeImmutable('today'))->setTime(0,0,0);
  $to   = $from->modify('+1 day');
  return [
    'key'  => 'today',
    'from' => $from->format('Y-m-d H:i:s'),
    'to'   => $to->format('Y-m-d H:i:s'),
  ];
}

/**
 * SUMĂ (în cents) dintr-un tabel pentru user, eventual filtrat pe interval și condiții extra
 */
function sum_cents(PDO $pdo, string $table, int $uid, ?string $from, ?string $to, string $extraWhere=''): int {
  $where = 'user_id = :uid';
  if ($extraWhere) $where .= " AND $extraWhere";
  if ($from !== null) $where .= ' AND created_at >= :from';
  if ($to   !== null) $where .= ' AND created_at <  :to';

  $sql = "SELECT COALESCE(SUM(amount_cents),0) FROM {$table} WHERE {$where}";
  $st  = $pdo->prepare($sql);
  $st->bindValue(':uid', $uid, PDO::PARAM_INT);
  if ($from !== null) $st->bindValue(':from', $from);
  if ($to   !== null) $st->bindValue(':to',   $to);
  $st->execute();
  return (int)$st->fetchColumn();
}

/**
 * SUMĂ (în cents) pentru retrageri: amount_cents + fee_cents
 * (asta e ce iese efectiv din "banca comună": banii trimiși userului + taxa platformei)
 * status poate fi 'APPROVED', 'PENDING', etc.; dacă e null -> toate
 */
function sum_withdraw_total_out(PDO $pdo, int $uid, ?string $status): int {
  $where = 'user_id = :uid';
  if ($status !== null) {
    $where .= ' AND status = :st';
  }

  // SUM(amount_cents + fee_cents)
  $sql = "SELECT COALESCE(SUM(amount_cents + fee_cents),0)
          FROM withdrawal_requests
          WHERE $where";

  $st = $pdo->prepare($sql);
  $st->bindValue(':uid', $uid, PDO::PARAM_INT);
  if ($status !== null) {
    $st->bindValue(':st', $status, PDO::PARAM_STR);
  }
  $st->execute();
  $v = $st->fetchColumn();
  return (int)($v === null ? 0 : $v);
}

// ==== 1. Determinăm intervalul cerut (pentru dashboard) ====
$rangeInfo = resolve_range($_GET['range'] ?? 'all');
$rangeKey  = $rangeInfo['key'];
$from      = $rangeInfo['from'];
$to        = $rangeInfo['to'];

// ==== 2. Fluxuri în fereastra selectată ====
$invested_cents_window = sum_cents(
  $pdo,
  'investments',
  $userId,
  $from,
  $to,
  "status='succeeded'"
);
$profit_cents_window = sum_cents(
  $pdo,
  'profit_distributions',
  $userId,
  $from,
  $to
);

// ==== 3. Sold de deschidere (înainte de perioadă) ====
$opening_balance_cents = 0;
if ($rangeKey === 'today') {
  $inv_before = sum_cents(
    $pdo,
    'investments',
    $userId,
    null,
    $from,
    "status='succeeded'"
  );
  $pnl_before = sum_cents(
    $pdo,
    'profit_distributions',
    $userId,
    null,
    $from
  );
  $opening_balance_cents = $inv_before + $pnl_before;
}

// ==== 4. KPIs pentru dashboard (aceleași ca înainte) ====
// Dacă range = all, dashboard vrea imagine totală:
if ($rangeKey === 'today') {
  $closing_balance_cents = $opening_balance_cents + $invested_cents_window + $profit_cents_window;

  // ce afișăm ca "Sold curent" în dashboard pentru azi:
  $display_balance_cents = $opening_balance_cents + $profit_cents_window;

  $period_return_pct = $opening_balance_cents > 0
    ? ($profit_cents_window / $opening_balance_cents) * 100.0
    : 0.0;

  $invested_cents = $invested_cents_window;
  $profit_cents   = $profit_cents_window;
} else {
  // range = all (sau orice altceva)
  $inv_all = sum_cents(
    $pdo,
    'investments',
    $userId,
    null,
    null,
    "status='succeeded'"
  );
  $pnl_all = sum_cents(
    $pdo,
    'profit_distributions',
    $userId,
    null,
    null
  );

  $opening_balance_cents     = 0; // baseline cont
  $invested_cents            = $inv_all;
  $profit_cents              = $pnl_all;
  $closing_balance_cents     = $inv_all + $pnl_all;
  $display_balance_cents     = $closing_balance_cents; // "Sold curent" total
  $period_return_pct         = $inv_all > 0
    ? ($pnl_all / $inv_all) * 100.0
    : 0.0;
}

// ==== 5. SOLD DISPONIBIL PENTRU RETRAGERE (folosit în retrageri.php) ====
// Asta e mereu "all time", nu doar 'today'.
// Formula:
//   sold_brut_cents = investiții_all + profit_all - sume_deja_plătite_userului (inclusiv taxe)
//   available_alltime_cents = sold_brut_cents - sume_blocate_în_PENDING
// Unde sume_deja_plătite_userului = retrageri APPROVED (amount+fee)
// și sume_blocate_în_PENDING = retrageri PENDING (amount+fee)

$inv_all_total = sum_cents(
  $pdo,
  'investments',
  $userId,
  null,
  null,
  "status='succeeded'"
);
$pnl_all_total = sum_cents(
  $pdo,
  'profit_distributions',
  $userId,
  null,
  null
);

// cât a ieșit deja definitiv din platformă pentru acest user:
$approved_out_cents = sum_withdraw_total_out($pdo, $userId, 'APPROVED');

// cât este ținut deja "rezervat" în cereri neprocesate:
$pending_lock_cents = sum_withdraw_total_out($pdo, $userId, 'PENDING');

// sold brut (toți banii generați de user minus ce i-am trimis deja)
$sold_brut_cents = $inv_all_total + $pnl_all_total - $approved_out_cents;
if ($sold_brut_cents < 0) { $sold_brut_cents = 0; }

// sold disponibil = sold brut minus ce e deja cerut dar încă neprocesat
$available_alltime_cents = $sold_brut_cents - $pending_lock_cents;
if ($available_alltime_cents < 0) { $available_alltime_cents = 0; }

// pentru retrageri.php noi întoarcem "balance_eur" = acest sold disponibil:
$balance_eur = $available_alltime_cents / 100.0;

// ==== 6. Răspuns final ====
// păstrăm câmpurile vechi (dashboard) + adăugăm câmpurile noi pentru retrageri.
echo json_encode([
  'ok'                        => true,

  // --- chei folosite de dashboard-investitor.php ---
  'range'                     => $rangeKey,
  'from'                      => $from,
  'to'                        => $to,
  'invested_cents'            => $invested_cents,          // “Suma investită”
  'profit_cents'              => $profit_cents,            // “Profit total”
  'opening_balance_cents'     => $opening_balance_cents,   // sold înainte de perioadă
  'closing_balance_cents'     => $closing_balance_cents,   // sold contabil la finalul perioadei
  'display_balance_cents'     => $display_balance_cents,   // ce afișăm ca “Sold curent”
  'period_return_pct'         => $period_return_pct,       // ce afișăm ca “Creștere %”

  // --- chei NOI pentru pagina Retrageri ---
  // balance_eur este exact ce citește retrageri.php -> loadSummary()
  'balance_eur'               => $balance_eur,

  // info extra care poate ajuta la debugging / viitoare UI
  'withdraw' => [
    'sold_brut_cents'        => $sold_brut_cents,          // (investiții + profit - deja plătit)
    'pending_lock_cents'     => $pending_lock_cents,       // blocat în PENDING
    'available_cents'        => $available_alltime_cents,  // disponibil real pt cerere nouă
    'approved_out_cents'     => $approved_out_cents,       // deja virat (amount+fee)
    'invested_total_cents'   => $inv_all_total,            // total depuneri confirmate
    'profit_total_cents'     => $pnl_all_total,            // total profit distribuit
  ],
], JSON_UNESCAPED_UNICODE);
