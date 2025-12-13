<?php
// /v2/api/_db.php

// Disable error display for API (return JSON errors instead)
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');

function get_db_connection() {
    // Reusing credentials from root db.php if possible, but for isolation we redefine them based on known values
    // found in public_html/db.php
    $DB_HOST = 'localhost';
    $DB_USER = 'u45947pari_api';
    $DB_PASS = '3DSecurity31';
    $DB_NAME = 'u45947pari_pariaza_inteligent';

    try {
        $dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        return new PDO($dsn, $DB_USER, $DB_PASS, $options);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Database connection failed']);
        exit;
    }
}

function json_response($data) {
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

function json_error($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}
