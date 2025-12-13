<?php
// /api/wallet/summary.php
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

require __DIR__ . '/../db.php'; // trebuie să existe $pdo (PDO)

function scalarSum(PDO $pdo, string $sql, int $uid): int {
  $st = $pdo->prepare($sql);
  $st->execute([':uid'=>$uid]);
  return (int)$st->fetchColumn();
}

$invested_cents = 0;
$profit_cents   = 0;
$locked_cents   = 0;

try {
  // total depus efectiv (status = succeeded)
  $invested_cents = scalarSum(
    $pdo,
    "SELECT COALESCE(SUM(amount_cents),0)
     FROM investments
     WHERE user_id=:uid AND status='succeeded'",
    $userId
  );

  // total profit distribuit către user
  $profit_cents = scalarSum(
    $pdo,
    "SELECT COALESCE(SUM(amount_cents),0)
     FROM profit_distributions
     WHERE user_id=:uid",
    $userId
  );

  // sume deja cerute la retragere (inclusiv taxă), atât PENDING cât și APPROVED
  $locked_cents = scalarSum(
    $pdo,
    "SELECT COALESCE(SUM(amount_cents + fee_cents),0)
     FROM withdrawal_requests
     WHERE user_id=:uid
       AND status IN ('pending','approved')",
    $userId
  );
} catch (Throwable $e) {
  // dacă pică ceva la DB, lăsăm 0 peste tot
}

$gross_cents     = $invested_cents + $profit_cents;         // tot ce ai produs în platformă
$available_cents = $gross_cents - $locked_cents;            // minus ce e deja blocat pt retrageri
if ($available_cents < 0) $available_cents = 0;

echo json_encode([
  'ok'            => true,
  'balance_cents' => $available_cents,
  'balance_eur'   => round($available_cents / 100, 2),

  // info ajutătoare pt debugging (poți șterge în producție)
  'debug' => [
    'invested_cents' => $invested_cents,
    'profit_cents'   => $profit_cents,
    'locked_cents'   => $locked_cents,
    'gross_cents'    => $gross_cents
  ]
], JSON_UNESCAPED_UNICODE);
