<?php
/**
 * DB FIX SCRIPT - Automated snapshots repair + seed
 * Rulează automat prin browser: http://localhost/fix_snapshots_db.php
 */

// DB credentials
$host = 'localhost';
$user = 'u45947pari_api';
$pass = '3DSecurity31';
$db = 'u45947pari_pariaza_inteligent';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("❌ Connection failed: " . $conn->connect_error);
}

echo "<h1>🔧 DB Fix: Snapshots Repair + Seed</h1>";
echo "<pre>";

// Step 1: Find foreign key blocking snapshots
echo "\n=== STEP 1: Finding foreign keys blocking snapshots ===\n";
$result = $conn->query("
    SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        REFERENCED_TABLE_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_NAME = 'snapshots'
    AND TABLE_SCHEMA = '$db'
");

$foreign_keys_to_drop = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "Found FK: {$row['CONSTRAINT_NAME']} on table {$row['TABLE_NAME']}\n";
        $foreign_keys_to_drop[] = [
            'table' => $row['TABLE_NAME'],
            'constraint' => $row['CONSTRAINT_NAME']
        ];
    }
} else {
    echo "No foreign keys found blocking snapshots\n";
}

// Step 2: Drop foreign keys
echo "\n=== STEP 2: Dropping foreign keys ===\n";
foreach ($foreign_keys_to_drop as $fk) {
    $sql = "ALTER TABLE `{$fk['table']}` DROP FOREIGN KEY `{$fk['constraint']}`";
    if ($conn->query($sql)) {
        echo "✅ Dropped FK {$fk['constraint']} from {$fk['table']}\n";
    } else {
        echo "❌ Error dropping FK: " . $conn->error . "\n";
    }
}

// Step 3: Drop snapshots table
echo "\n=== STEP 3: Dropping snapshots table ===\n";
if ($conn->query("DROP TABLE IF EXISTS `snapshots`")) {
    echo "✅ Snapshots table dropped\n";
} else {
    echo "❌ Error: " . $conn->error . "\n";
}

// Step 4: Recreate snapshots with correct structure
echo "\n=== STEP 4: Recreating snapshots table ===\n";
$create_sql = "
CREATE TABLE `snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `snapshot_date` DATE NOT NULL,
  `principal_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `profit_net` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_value` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `share_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `total_fund_value` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `snapshots_user_date_unique` (`user_id`, `snapshot_date`),
  INDEX `snapshots_user_id_idx` (`user_id`),
  INDEX `snapshots_date_idx` (`snapshot_date`),
  
  CONSTRAINT `snapshots_user_id_fkey` 
    FOREIGN KEY (`user_id`) 
    REFERENCES `users`(`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
";

if ($conn->query($create_sql)) {
    echo "✅ Snapshots table recreated with correct structure\n";
} else {
    echo "❌ Error: " . $conn->error . "\n";
    die();
}

// Step 5: Get admin user ID
echo "\n=== STEP 5: Finding admin user ===\n";
$result = $conn->query("SELECT id, email FROM users WHERE email = 'admin@pariazainteligent.ro' LIMIT 1");
if ($result && $result->num_rows > 0) {
    $admin = $result->fetch_assoc();
    $admin_id = $admin['id'];
    echo "✅ Admin user found: {$admin['email']} (ID: $admin_id)\n";
} else {
    echo "❌ Admin user not found - using first user\n";
    $result = $conn->query("SELECT id, email FROM users LIMIT 1");
    if ($result && $result->num_rows > 0) {
        $admin = $result->fetch_assoc();
        $admin_id = $admin['id'];
        echo "Using user: {$admin['email']} (ID: $admin_id)\n";
    } else {
        die("❌ No users found in database\n");
    }
}

// Step 6: Seed snapshots
echo "\n=== STEP 6: Seeding demo snapshots ===\n";
$snapshots = [
    [UUID(), $admin_id, date('Y-m-d', strtotime('-30 days')), 5000.00, -120.00, 4880.00, 2.14, 228000.00],
    [UUID(), $admin_id, date('Y-m-d', strtotime('-20 days')), 5000.00, 200.50, 5200.50, 2.23, 233000.00],
    [UUID(), $admin_id, date('Y-m-d', strtotime('-10 days')), 5000.00, 450.75, 5450.75, 2.28, 239000.00],
    [UUID(), $admin_id, date('Y-m-d'), 5000.00, 620.00, 5620.00, 2.30, 244000.00],
];

function UUID()
{
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff)
    );
}

foreach ($snapshots as $snap) {
    $sql = "INSERT INTO snapshots (id, user_id, snapshot_date, principal_amount, profit_net, total_value, share_percent, total_fund_value, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sssddddd', $snap[0], $snap[1], $snap[2], $snap[3], $snap[4], $snap[5], $snap[6], $snap[7]);
    if ($stmt->execute()) {
        echo "✅ Snapshot inserted: {$snap[2]}\n";
    } else {
        echo "❌ Error: " . $stmt->error . "\n";
    }
}

// Step 7: Update user stats
echo "\n=== STEP 7: Updating user stats ===\n";
$sql = "UPDATE users SET 
    streak_days = 12,
    loyalty_points = 4200,
    tier = 'PRO',
    clearance_level = 2,
    last_checkin_at = DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $admin_id);
if ($stmt->execute()) {
    echo "✅ User stats updated (streak=12, points=4200, tier=PRO)\n";
} else {
    echo "❌ Error: " . $stmt->error . "\n";
}

// Step 8: Insert payout method (if not exists)
echo "\n=== STEP 8: Adding payout method ===\n";
$check = $conn->query("SELECT COUNT(*) as cnt FROM payout_methods WHERE user_id = '$admin_id'");
$row = $check->fetch_assoc();
if ($row['cnt'] == 0) {
    $pm_id = UUID();
    $sql = "INSERT INTO payout_methods (id, user_id, method_type, account_identifier, account_name, is_verified, is_primary, created_at) 
            VALUES (?, ?, 'REVOLUT', '+40712***456', 'Admin User', 1, 1, NOW())";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $pm_id, $admin_id);
    if ($stmt->execute()) {
        echo "✅ Payout method added\n";
    } else {
        echo "❌ Error: " . $stmt->error . "\n";
    }
} else {
    echo "ℹ️  Payout method already exists\n";
}

// Step 9: Verify integrity
echo "\n=== STEP 9: Verification ===\n";
$result = $conn->query("SELECT COUNT(*) as cnt FROM snapshots WHERE user_id = '$admin_id'");
$row = $result->fetch_assoc();
echo "✅ Snapshots count: {$row['cnt']}\n";

$result = $conn->query("SELECT streak_days, loyalty_points, tier FROM users WHERE id = '$admin_id'");
$row = $result->fetch_assoc();
echo "✅ User stats: streak={$row['streak_days']}, points={$row['loyalty_points']}, tier={$row['tier']}\n";

$result = $conn->query("SELECT COUNT(*) as cnt FROM payout_methods WHERE user_id = '$admin_id'");
$row = $result->fetch_assoc();
echo "✅ Payout methods: {$row['cnt']}\n";

echo "\n=== ✅ ALL DONE - Database fixed and seeded ===\n";
echo "</pre>";

$conn->close();
