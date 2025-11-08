<?php
// require_admin.php
// 1. Include mai întâi autentificarea de bază
require __DIR__ . '/require_login.php';

// 2. Verifică rolul
if (empty($_SESSION['user']) || ($_SESSION['user']['rol'] ?? '') !== 'admin') {
    // Utilizatorul nu are acces → redirecționează
    header('Location: layout.html#dashboard.php');
    exit;
}
