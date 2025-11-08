<?php
// (opțional în prod) comentează două linii de mai jos
ini_set('display_errors', 1);
error_reporting(E_ALL);

if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }

// Conectare MySQLi – completează cu datele tale reale
$DB_HOST = 'localhost';
$DB_USER = 'u45947pari_api';
$DB_PASS = '3DSecurity31';
$DB_NAME = 'u45947pari_pariaza_inteligent';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
$mysqli->set_charset('utf8mb4');
