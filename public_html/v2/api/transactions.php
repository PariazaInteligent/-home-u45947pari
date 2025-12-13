<?php
require_once '_db.php';

$pdo = get_db_connection();

$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;
$offset = isset($_GET['offset']) ? (int) $_GET['offset'] : 0;

// User filter? The prompt says "scanează... ce user folosește ce date".
// The Stats component in Landing Page (v2 demo) seems global (anonymous). 
// But the Dashboard uses user specific.
// I will support optional user_id.
$userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : null;

try {
    // We need a UNION of Ledger and Profit Distributions
    // 1. Ledger
    $ledgerQuery = "
        SELECT 
            l.id as original_id,
            l.created_at,
            l.amount_cents,
            l.kind,
            'ledger' as source,
            l.status as status_or_event
        FROM ledger_tx l
        WHERE l.status IN ('APPROVED', 'SETTLED', 'COMPLETED')
    ";

    // 2. Betting Profits
    $betQuery = "
        SELECT 
            p.id as original_id,
            p.created_at,
            p.amount_cents,
            CASE WHEN p.amount_cents >= 0 THEN 'PROFIT' ELSE 'LOSS' END as kind,
            'bet' as source,
            CONCAT(bg.event, ' - ', bg.selection_name) as status_or_event
        FROM profit_distributions p
        JOIN bet_groups bg ON p.bet_group_id = bg.id
    ";

    $params = [];
    $whereUser = "";

    if ($userId) {
        $ledgerQuery .= " AND l.user_id = ?";
        $betQuery .= " AND p.user_id = ?";
        $params[] = $userId;
        $params[] = $userId;
    }

    $sql = "SELECT * FROM (($ledgerQuery) UNION ALL ($betQuery)) as united 
            ORDER BY created_at DESC 
            LIMIT $limit OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $mapped = array_map(function ($row) {
        // Map to UI format
        // { type: 'PROFIT', label: '...', amount: '+125 RON', date: '14:30:22', hash: '...' }

        $type = 'UNKNOWN';
        $label = '';
        $amountSign = $row['amount_cents'] >= 0 ? '+' : '';
        $amountFormatted = $amountSign . number_format($row['amount_cents'] / 100, 2) . ' EUR';
        // Using EUR as DB is eur. UI mocks say RON but real data is EUR.

        if ($row['source'] === 'ledger') {
            if ($row['kind'] === 'DEPOSIT') {
                $type = 'DEPUNERE';
                $label = 'Alimentare cont';
            } elseif ($row['kind'] === 'WITHDRAWAL') {
                $type = 'RETRAGERE';
                $label = 'Retragere fonduri';
            } else {
                $type = $row['kind'];
                $label = 'Tranzactie';
            }
        } else {
            // Bet
            $type = $row['amount_cents'] >= 0 ? 'PROFIT' : 'PIERDERE';
            $label = $row['status_or_event'];
        }

        return [
            'id' => $row['source'] . '_' . $row['original_id'],
            'type' => $type,
            'label' => $label,
            'amount' => $amountFormatted,
            'date' => date('H:i:s', strtotime($row['created_at'])), // Just time as per mock, or full date? Mock has time.
            'full_date' => $row['created_at'], // Extra for detail
            'hash' => '0x' . substr(md5($row['source'] . $row['original_id']), 0, 8) . '...' // Mock hash
        ];
    }, $rows);

    json_response($mapped);

} catch (Exception $e) {
    json_error($e->getMessage(), 500);
}
