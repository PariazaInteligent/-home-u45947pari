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

echo "=== DESCRIBE users (relevant columns only) ===\n\n";

$result = $conn->query("DESCRIBE users");

if ($result) {
    echo "Field                        | Type                  | Null | Key | Default\n";
    echo "---------------------------- | --------------------- | ---- | --- | -------\n";
    while ($row = $result->fetch_assoc()) {
        // Filter for timestamp and gamification fields
        $field = $row['Field'];
        if (
            strpos($field, 'created') !== false ||
            strpos($field, 'updated') !== false ||
            strpos($field, 'streak') !== false ||
            strpos($field, 'loyalty') !== false ||
            strpos($field, 'tier') !== false ||
            strpos($field, 'clearance') !== false ||
            strpos($field, 'checkin') !== false ||
            strpos($field, 'two_factor') !== false ||
            strpos($field, 'twoFactor') !== false ||
            strpos($field, 'last_login') !== false ||
            strpos($field, 'lastLogin') !== false
        ) {
            printf(
                "%-28s | %-21s | %-4s | %-3s | %s\n",
                $row['Field'],
                $row['Type'],
                $row['Null'],
                $row['Key'],
                $row['Default'] ?? 'NULL'
            );
        }
    }
} else {
    echo "Error: " . $conn->error;
}

$conn->close();
