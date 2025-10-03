<?php
// api/data.php

// --- START: Configuration ---
$defaultConfig = [
    'host' => 'localhost',
    'port' => '3306',
    'name' => 'database_name',
    'user' => 'username',
    'pass' => 'password',
];

$db_host = getenv('DB_HOST') ?: $defaultConfig['host'];
$db_port = getenv('DB_PORT') ?: $defaultConfig['port'];
$db_name = getenv('DB_NAME') ?: $defaultConfig['name'];
$db_user = getenv('DB_USER') ?: $defaultConfig['user'];
$db_pass = getenv('DB_PASS') ?: $defaultConfig['pass'];
// --- END: Configuration ---

// --- Headers & Security ---
// Permite cereri de la orice origine. Pentru producție, ar trebui restricționat la domeniul tău.
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// --- Database Connection ---
try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $db_host, $db_port, $db_name);
    $pdo = new PDO($dsn, $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// --- Endpoint Routing ---
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

// Maparea dintre numele folosite în frontend și numele tabelelor din baza de date
$allowed_tables = [
    'globalStats'      => 'global_stats',
    'users'            => 'users',
    'transactions'     => 'transactions',
    'dailyHistory'     => 'daily_history',
    'announcements'    => 'announcements',
    'userMessages'     => 'user_messages',
    'investmentAlerts' => 'investment_alerts',
    'feedback'         => 'feedback',
    'platformSettings' => 'app_settings',
    'referrals'        => 'referrals',
    'calendarEvents'   => 'calendar_events',
    'investmentGoals'  => 'investment_goals',
    'bets'             => 'bets'
];

if (!array_key_exists($endpoint, $allowed_tables)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid endpoint requested."]);
    exit();
}

$table_name = $allowed_tables[$endpoint];

// --- Data Fetching ---
try {
    $stmt = $pdo->prepare("SELECT * FROM " . $table_name);
    $stmt->execute();
    $data = $stmt->fetchAll();

    // NOTĂ IMPORTANTĂ: Baza de date returnează datele într-un format "plat".
    // Frontend-ul se așteaptă la structuri complexe (ex: un obiect 'profileData' în interiorul fiecărui utilizator).
    // Pe viitor, vom rafina acest script pentru a construi JSON-ul exact cum trebuie,
    // posibil prin interogări mai complexe (JOINs) sau procesare în PHP.
    // Deocamdată, frontend-ul va face o transformare de bază.

    // global_stats este un singur obiect, nu un array.
    if ($endpoint === 'globalStats' && count($data) >= 1) {
        echo json_encode($data[0]);
    } else {
        echo json_encode($data);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed: " . $e->getMessage()]);
    exit();
}
?>