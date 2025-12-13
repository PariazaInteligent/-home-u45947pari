<?php
require __DIR__ . '/require_login.php';
$user = $_SESSION['user'];
?>
<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard</title>
</head>
<body style="font-family:Segoe UI, Tahoma, sans-serif;padding:24px">
  <h1>Bun venit, <?=htmlspecialchars($user['nume'] ?? $user['email'])?>!</h1>
  <p>Ai intrat în dashboard.</p>
  <p><a href="logout.php">Delogare</a></p>
</body>
</html>
