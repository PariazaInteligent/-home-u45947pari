<?php
// /logout.php — BancaComuna v1
declare(strict_types=1);
@ini_set('display_errors', '0');

session_start();

/**
 * Șterge cookie în toate variantele de path.
 */
function killCookie(string $name): void {
  $secure   = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
  $httponly = true;
  $dom = '';
  $paths = ['/', '/v1', '/admin', '/user'];
  foreach ($paths as $p) {
    setcookie($name, '', time() - 3600, $p, $dom, $secure, $httponly);
  }
}

/**
 * Redirecționează și închide.
 */
function go(string $url): void {
  header('Location: ' . $url, true, 302);
  exit;
}

// 1) Ținem minte selectorul din cookie (dacă există) pentru a-l șterge din DB.
$selector = null;
$rememberCookieNames = ['remember', 'remember_token', 'pi_remember'];
foreach ($rememberCookieNames as $cn) {
  if (!empty($_COOKIE[$cn])) {
    $parts = explode(':', (string)$_COOKIE[$cn], 2); // de forma selector:validator
    $selector = preg_replace('/[^A-Za-z0-9]/', '', $parts[0] ?? '');
  }
  killCookie($cn);
}

// 2) Curățăm sesiunea PHP în mod corect.
$_SESSION = [];
if (ini_get('session.use_cookies')) {
  $p = session_get_cookie_params();
  setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
}
session_destroy();

// 3) Ștergem tokenul "remember me" din DB (dacă putem). Codul e tolerant:
//    doar dacă fișierul DB există și conexiunea merge, ștergem selectorul.
$redirectTo = '/v1/acasa.html';
if (!empty($selector)) {
  $dbCandidates = [
    __DIR__ . '/api/db.php',
    __DIR__ . '/../api/db.php',
  ];
  $dbFile = null;
  foreach ($dbCandidates as $c) { if (is_file($c)) { $dbFile = $c; break; } }

  if ($dbFile) {
    try {
      include $dbFile;        // trebuie să definească $pdo (PDO)
      if (isset($pdo)) {
        $stmt = $pdo->prepare('DELETE FROM remember_tokens WHERE selector = ?');
        $stmt->execute([$selector]);
      }
    } catch (Throwable $e) {
      // Nu stricăm logout-ul dacă DB e jos sau nu există $pdo.
      // Poți loga $e->getMessage() într-un fișier dacă dorești.
    }
  }
}

// 4) Optional: curățăm storage-ul din browser (unde e suportat)
header('Clear-Site-Data: "cookies", "storage"');

// 5) Gata, du-l acasă.
go($redirectTo);
