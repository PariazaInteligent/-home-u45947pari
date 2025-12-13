<?php
// api/messages_create.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }

// === acces doar pentru admin ===
require __DIR__ . '/../require_admin.php';

// === DB ===
require __DIR__ . '/../db.php';

// === util: răspuns JSON + exit ===
function json_end(int $code, array $payload): void {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

// === citește JSON body ===
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
  json_end(400, ['success'=>false,'error'=>'Body JSON invalid.']);
}

// === extrage & validează câmpuri ===
// tip: 'anunt' sau 'personal'
$tip = isset($input['tip']) ? trim((string)$input['tip']) : '';
if ($tip !== 'anunt' && $tip !== 'personal') {
  json_end(422, ['success'=>false,'error'=>"Câmpul 'tip' trebuie să fie 'anunt' sau 'personal'."]);
}

$titlu    = isset($input['titlu']) ? trim((string)$input['titlu']) : '';
$continut = isset($input['continut']) ? trim((string)$input['continut']) : '';

if ($titlu === '' || $continut === '') {
  json_end(422, ['success'=>false,'error'=>"Câmpurile 'titlu' și 'continut' sunt obligatorii."]);
}

// important/publicat: convertire la 0/1
$important = !empty($input['important']) ? 1 : 0;
$publicat  = array_key_exists('publicat', $input) ? (int)!empty($input['publicat']) : 1;

// targets: necesare doar pentru 'personal'
$targets = [];
if ($tip === 'personal') {
  if (empty($input['targets']) || !is_array($input['targets'])) {
    json_end(422, ['success'=>false,'error'=>"Pentru 'personal', furnizează 'targets' ca listă de user_id."]);
  }
  // normalizează la int și elimină duplicate/negativ
  $targets = array_values(array_unique(array_map(fn($v)=> max(0,(int)$v), $input['targets'])));
  // scoate 0 din listă, dacă apare
  $targets = array_filter($targets, fn($v)=> $v>0);
  if (empty($targets)) {
    json_end(422, ['success'=>false,'error'=>"Lista 'targets' nu conține user_id valide."]);
  }
}

// atașamente opționale: listă de URL-uri
$attachments = [];
if (!empty($input['attachments']) && is_array($input['attachments'])) {
  // păstrează doar string-uri non-goale, taie spații, limitează ~500 chars
  foreach ($input['attachments'] as $u) {
    $u = trim((string)$u);
    if ($u !== '') {
      $attachments[] = mb_substr($u, 0, 500);
    }
  }
}

// autorul din sesiune
$createdBy = (int)($_SESSION['user']['id'] ?? 0);
if ($createdBy <= 0) {
  // practic nu se întâmplă datorită require_admin.php, dar păstrăm fallback
  json_end(401, ['success'=>false,'error'=>'Neautorizat.']);
}

// === INSERT în tranzacție ===
$mysqli->begin_transaction();

try {
  // 1) mesaje
  $sql = "INSERT INTO mesaje (tip, titlu, continut, important, publicat, created_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())";
  $stmt = $mysqli->prepare($sql);
  if (!$stmt) throw new RuntimeException('Prepare mesaje failed: '.$mysqli->error);

  $stmt->bind_param('sssiii', $tip, $titlu, $continut, $important, $publicat, $createdBy);
  if (!$stmt->execute()) throw new RuntimeException('Exec mesaje failed: '.$stmt->error);

  $mesajId = (int)$stmt->insert_id;
  $stmt->close();

  // 2) targets pentru personal
  if ($tip === 'personal') {
    $stmt = $mysqli->prepare("INSERT INTO mesaje_tinte (mesaj_id, user_id) VALUES (?, ?)");
    if (!$stmt) throw new RuntimeException('Prepare tinte failed: '.$mysqli->error);

    foreach ($targets as $uid) {
      $stmt->bind_param('ii', $mesajId, $uid);
      if (!$stmt->execute()) throw new RuntimeException('Exec tinte failed: '.$stmt->error);
    }
    $stmt->close();
  }

  // 3) atașamente opționale (URL)
  if (!empty($attachments)) {
    $stmt = $mysqli->prepare("INSERT INTO mesaje_atase (mesaj_id, file_url, mime, created_at) VALUES (?, ?, ?, NOW())");
    if (!$stmt) throw new RuntimeException('Prepare atase failed: '.$mysqli->error);

    foreach ($attachments as $url) {
      // MIME e opțional; îl poți detecta server-side ulterior dacă vrei
      $mime = null;
      $stmt->bind_param('iss', $mesajId, $url, $mime);
      if (!$stmt->execute()) throw new RuntimeException('Exec atase failed: '.$stmt->error);
    }
    $stmt->close();
  }

  $mysqli->commit();

  json_end(201, [
    'success'   => true,
    'id'        => $mesajId,
    'tip'       => $tip,
    'publicat'  => $publicat,
    'important' => $important
  ]);

} catch (Throwable $e) {
  $mysqli->rollback();
  json_end(500, ['success'=>false,'error'=>'Eroare la creare mesaj','details'=>$e->getMessage()]);
}
