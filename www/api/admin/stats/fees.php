<?php
// /api/admin/stats/fees.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

session_start();
require __DIR__ . '/../../db.php';

// Verificare Admin
$me = $_SESSION['user'] ?? null;
if (strtoupper($me['role'] ?? '') !== 'ADMIN') {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden']);
    exit;
}

try {
    // 1. Taxe din Retrageri (doar cele finalizate/aprobate)
    $stmt = $pdo->query("
    SELECT SUM(fee_cents) 
    FROM withdrawal_requests 
    WHERE status IN ('approved', 'completed')
  ");
    $withdrawalFeesCents = (int) $stmt->fetchColumn();

    // 2. Taxe din Pariuri (diferența dintre brut și net la pariurile câștigate)
    // Formula: Taxa = (Stake * (Odds - 1)) - ProfitNet
    // Atenție: la half_won stake-ul considerat e jumătate, dar profit_net e deja calculat corect.
    // Mai simplu: recalculăm brutul pentru fiecare pariu câștigat și scădem netul stocat.

    $stmt = $pdo->query("
    SELECT id, stake_cents, odds, status, profit_net_cents
    FROM bet_groups
    WHERE status IN ('won', 'half_won')
  ");

    $bettingFeesCents = 0;

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $stake = (int) $row['stake_cents'];
        $odds = (float) $row['odds'];
        $net = (int) $row['profit_net_cents'];
        $status = $row['status'];

        $gross = 0;
        if ($status === 'won') {
            $gross = (int) round($stake * max(0, $odds - 1));
        } elseif ($status === 'half_won') {
            $gross = (int) round(($stake / 2) * max(0, $odds - 1));
        }

        // Taxa este diferența. Dacă net e null sau 0 (deși e won), ceva e ciudat, dar tratăm matematic.
        // Dacă gross > 0 și net < gross, diferența e taxa.
        if ($gross > 0) {
            $fee = max(0, $gross - $net);
            $bettingFeesCents += $fee;
        }
    }

    $totalFeesCents = $withdrawalFeesCents + $bettingFeesCents;

    echo json_encode([
        'ok' => true,
        'total_fees_eur' => round($totalFeesCents / 100, 2),
        'breakdown' => [
            'withdrawals_eur' => round($withdrawalFeesCents / 100, 2),
            'betting_eur' => round($bettingFeesCents / 100, 2)
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_error', 'details' => $e->getMessage()]);
}
