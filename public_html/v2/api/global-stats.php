<?php
require_once '_db.php';

$pdo = get_db_connection();

try {
    // 1. Count Investors
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'USER'");
    $investors = $stmt->fetch()['count'];

    // 2. Historic Profit (Sum of all positive profit_distributions)
    // Note: If we want Net profit, we sum all. The UI says "Profit Istoric", usually implies Net or Total Gains.
    // Let's sum net for now.
    $stmt = $pdo->query("SELECT SUM(amount_cents) as total FROM profit_distributions");
    $profitCents = $stmt->fetch()['total'] ?? 0;

    // 3. Total Bank
    // Calculated as: Initial Deposits + Profits - Withdrawals
    // Or simpler: Sum of ledger_tx (DEPOSIT - WITHDRAWAL) + Sum of profit_distributions

    // Sum ledger_tx (only SETTLED/APPROVED/COMPLETED)
    // Ledger kinds: DEPOSIT (add), WITHDRAWAL (subtract), ADJUSTMENT (add/sub)
    // Status: APPROVED, SETTLED.

    $stmt = $pdo->query("
        SELECT 
            SUM(CASE 
                WHEN kind = 'DEPOSIT' THEN amount_cents 
                WHEN kind = 'ADJUSTMENT' THEN amount_cents
                WHEN kind = 'WITHDRAWAL' THEN -amount_cents 
                ELSE 0 
            END) as ledger_total
        FROM ledger_tx 
        WHERE status IN ('APPROVED', 'SETTLED', 'COMPLETED')
    ");
    $ledgerTotal = $stmt->fetch()['ledger_total'] ?? 0;

    $totalBankCents = $ledgerTotal + $profitCents;

    // Formatting
    $stats = [
        'investors' => (int) $investors,
        'historic_profit_ron' => number_format($profitCents / 100, 2, '.', ''), // Assuming cents are RON cents or EUR cents? 
        // SQL Data shows 'eur' in investments. UI shows 'RON'.
        // User request: "Dashboard Stats... 42.850 RON".
        // The DB has 'eur'. I should check if there is a currency conversion or if I should just label it EUR or RON.
        // The Prompt says "folosește date reale". If DB is EUR, I should return EUR or convert.
        // I will return the raw value and currency.
        'total_bank' => number_format($totalBankCents / 100, 2, '.', ''),
        'currency' => 'EUR' // Implicit from DB
    ];

    json_response($stats);

} catch (Exception $e) {
    json_error($e->getMessage(), 500);
}
