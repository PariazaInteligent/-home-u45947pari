<?php
// api/messages_mark_read.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
if (session_status() !== PHP_SESSION_ACTIVE) session_start();

require __DIR__ . '/../db.php';

/* ===== Auth ===== */
$userId   = isset($_SESSION['user']['id'])  ? (int)$_SESSION['user']['id']  : 0;
$userRole = $_SESSION['user']['rol'] ?? 'utilizator';
$isAdmin  = ($userRole === 'admin');

if ($userId <= 0) {
  http_response_code(401);
  echo json_encode([
    'success' => false,
    'error'   => 'Trebuie să fii autentificat pentru a marca mesaje ca citite.'
  ]);
  exit;
}

/* ===== Method & input ===== */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode([
    'success' => false,
    'error'   => 'Metodă invalidă. Folosește POST.'
  ]);
  exit;
}

// Acceptă JSON sau form-data
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  // fallback pe application/x-www-form-urlencoded
  $data = $_POST;
}

$mesajId = isset($data['mesaj_id']) ? (int)$data['mesaj_id'] : 0;

if ($mesajId <= 0) {
  http_response_code(400);
  echo json_encode([
    'success' => false,
    'error'   => 'ID mesaj invalid.'
  ]);
  exit;
}

/* ===== Verificare drept de acces la mesaj =====
   - anunț: orice utilizator poate marca DOAR dacă e publicat (sau dacă este admin)
   - personal: doar dacă există țintire către userul curent
*/
try {
  // EXISTS pe mesajul solicitat cu regulile de vizibilitate
  $sql = "
    SELECT 1
      FROM mesaje m
     WHERE m.id = ?
       AND (
             (m.tip = 'anunt'   AND (? = 1 OR m.publicat = 1))
          OR (m.tip = 'personal' AND EXISTS (
                SELECT 1 FROM mesaje_tinte t
                 WHERE t.mesaj_id = m.id AND t.user_id = ?
              ))
           )
     LIMIT 1
  ";
  $stmt = $mysqli->prepare($sql);
  $adminInt = $isAdmin ? 1 : 0;
  $stmt->bind_param('iii', $mesajId, $adminInt, $userId);
  $stmt->execute();
  $okAccess = (bool)$stmt->get_result()->fetch_row();
  $stmt->close();

  if (!$okAccess) {
    http_response_code(403);
    echo json_encode([
      'success' => false,
      'error'   => 'Nu ai dreptul să marchezi acest mesaj ca citit.'
    ]);
    exit;
  }

  /* ===== Marchează ca citit =====
     Folosim ON DUPLICATE KEY pentru idempotentă.
     (asumă cheie unică (mesaj_id, user_id) în mesaje_citiri)
  */
  $stmt = $mysqli->prepare("
    INSERT INTO mesaje_citiri (mesaj_id, user_id, read_at)
    VALUES (?, ?, NOW())
    ON DUPLICATE KEY UPDATE read_at = NOW()
  ");
  $stmt->bind_param('ii', $mesajId, $userId);
  $ok = $stmt->execute();
  $stmt->close();

  if (!$ok) {
    throw new RuntimeException('Eșec la actualizarea bazei de date.');
  }

  echo json_encode([
    'success'  => true,
    'mesaj_id' => $mesajId,
    'read_at'  => date('Y-m-d H:i:s')
  ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'error'   => 'Eroare server: ' . $e->getMessage()
  ], JSON_UNESCAPED_UNICODE);
}
