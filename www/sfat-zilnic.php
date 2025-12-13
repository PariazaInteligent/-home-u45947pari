<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$DB_HOST = 'localhost';
$DB_NAME = 'u45947pari_pariaza_inteligent'; // baza ta
$DB_USER = 'u45947pari_api';                      // ← user real
$DB_PASS = '3DSecurity31';                      // ← parolă reală

try {
  $pdo = new PDO(
    "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
    $DB_USER,
    $DB_PASS,
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
  );

  // azi (EET/EEST)
  $today = (new DateTime('now', new DateTimeZone('Europe/Bucharest')))->format('Y-m-d');

  // Preferă sfatul exact pe azi; altfel cel mai recent <= azi; altfel ultimul
  $stmt = $pdo->prepare("SELECT sfat, data FROM sfaturi WHERE data = :today ORDER BY id DESC LIMIT 1");
  $stmt->execute([':today' => $today]);
  $row = $stmt->fetch();

  if (!$row) {
    $stmt = $pdo->prepare("SELECT sfat, data FROM sfaturi WHERE data <= :today ORDER BY data DESC, id DESC LIMIT 1");
    $stmt->execute([':today' => $today]);
    $row = $stmt->fetch();
  }
  if (!$row) {
    $row = $pdo->query("SELECT sfat, data FROM sfaturi ORDER BY data DESC, id DESC LIMIT 1")->fetch();
  }

  $sfat = $row ? trim((string)$row['sfat']) : '';
  $data = $row ? (string)$row['data'] : $today;

  if ($sfat === '') {
    echo '<div class="info-card"><h3><i class="fas fa-info-circle"></i> Sfat Zilnic</h3><p>Nu există încă un sfat în baza de date.</p></div>';
    exit;
  }

  // HTML minimal care se potrivește cu stilurile din sidebar
  echo '<div class="info-card">',
         '<h3><i class="fas fa-info-circle"></i> Sfat Zilnic</h3>',
         '<p>', htmlspecialchars($sfat, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'), '</p>',
         '<small style="opacity:.7">', htmlspecialchars($data, ENT_QUOTES, 'UTF-8'), '</small>',
       '</div>';

} catch (Throwable $e) {
  http_response_code(500);
  // returnează un card cu eroarea (util pt. depanare rapidă)
  echo '<div class="info-card"><h3><i class="fas fa-info-circle"></i> Sfat Zilnic</h3>',
       '<p>Eroare la încărcarea sfatului.</p>',
       '<small style="opacity:.7">', htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8'), '</small>',
       '</div>';
}
