<?php
// /api/db.php
$DB_HOST = 'localhost';
$DB_NAME = 'u45947pari_pariaza_inteligent';
$DB_USER = 'u45947pari_api';
$DB_PASS = '3DSecurity31';
$dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";
$options = [
  PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES   => false,
];
$pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
