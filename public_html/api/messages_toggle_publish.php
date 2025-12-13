<?php
// api/messages_toggle_publish.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }
require __DIR__ . '/../require_admin.php';
require __DIR__ . '/../db.php';

function jend(int $code, array $payload){ http_response_code($code); echo json_encode($payload, JSON_UNESCAPED_UNICODE); exit; }

$raw = file_get_contents('php://input');
$in  = json_decode($raw, true);
if (!is_array($in)) jend(400, ['success'=>false, 'error'=>'Body JSON invalid']);

$id        = (int)($in['id'] ?? 0);
$explicit  = $in['publicat'] ?? null; // 0|1 sau null

if ($id <= 0) jend(422, ['success'=>false, 'error'=>'Parametrul "id" este necesar.']);

// Verifică existența mesajului
$chk = $mysqli->prepare("SELECT id, publicat FROM mesaje WHERE id=?");
if (!$chk) jend(500, ['success'=>false,'error'=>$mysqli->error]);
$chk->bind_param('i', $id);
$chk->execute();
$cur = $chk->get_result()->fetch_assoc();
$chk->close();

if (!$cur) jend(404, ['success'=>false, 'error'=>'Mesaj inexistent.']);

if ($explicit === 0 || $explicit === '0' || $explicit === 1 || $explicit === '1') {
  // Setare explicită
  $new = (int)$explicit;
  $st = $mysqli->prepare("UPDATE mesaje SET publicat=?, updated_at=NOW() WHERE id=?");
  if (!$st) jend(500, ['success'=>false,'error'=>$mysqli->error]);
  $st->bind_param('ii', $new, $id);
  $ok = $st->execute();
  $st->close();
  if (!$ok) jend(500, ['success'=>false,'error'=>'Nu s-a putut actualiza starea.']);
} else {
  // Toggle (inversează)
  $st = $mysqli->prepare("UPDATE mesaje SET publicat = 1 - publicat, updated_at=NOW() WHERE id=?");
  if (!$st) jend(500, ['success'=>false,'error'=>$mysqli->error]);
  $st->bind_param('i', $id);
  $ok = $st->execute();
  $st->close();
  if (!$ok) jend(500, ['success'=>false,'error'=>'Nu s-a putut inversa starea.']);
}

// Citește starea finală
$get = $mysqli->prepare("SELECT id, publicat FROM mesaje WHERE id=?");
$get->bind_param('i', $id);
$get->execute();
$row = $get->get_result()->fetch_assoc();
$get->close();

jend(200, [
  'success'   => true,
  'id'        => (int)$row['id'],
  'publicat'  => (int)$row['publicat'],   // 0/1
  'message'   => $row['publicat'] ? 'Mesaj publicat.' : 'Mesaj setat ca nepublicat.'
]);
