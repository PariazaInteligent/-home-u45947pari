<?php
// Quick DB inspection script
$host = 'localhost';
$user = 'u45947pari_api';
$pass = '3DSecurity31';
$db = 'u45947pari_pariaza_inteligent';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "=== DESCRIBE snapshots ===\n";
$result = $conn->query("DESCRIBE snapshots");
if ($result) {
    while ($row = $result->fetch_assoc()) {
        echo "{$row['Field']} | {$row['Type']} | {$row['Null']} | {$row['Key']}\n";
    }
} else {
    echo "Table does not exist or error: " . $conn->error . "\n";
}

echo "\n=== SELECT sample from snapshots ===\n";
$result = $conn->query("SELECT * FROM snapshots LIMIT 1");
if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    print_r($row);
} else {
    echo "No rows or error: " . $conn->error . "\n";
}

echo "\n=== Get admin user ID ===\n";
$result = $conn->query("SELECT id, email FROM users WHERE email = 'admin@pariazainteligent.ro' LIMIT 1");
if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo "User ID: {$row['id']}\n";
    echo "Email: {$row['email']}\n";
    
    // Save ID for seed script
    file_put_contents(__DIR__ . '/admin_user_id.txt', $row['id']);
} else {
    echo "Admin user not found\n";
}

$conn->close();
echo "\n=== Done ===\n";
