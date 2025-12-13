<?php
// api/messages_delete.php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }

// doar admin
require __DIR__ . '/../require_admin.php';
require __DIR__ . '/../db.php';

function json_end(int $code, array $payload): void {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

// Citește input JSON (POST)
$body = file_get_contents('php://input');
$input = json_decode($body, true);

if (!is_array($input)) {
  json_end(400, ['success'=>false, 'error'=>'Body JSON invalid. Aștept {"id": <int>, "soft": true|false}']);
}

$mesajId = (int)($input['id'] ?? 0);
$soft    = !empty($input['soft']); // default hard delete

if ($mesajId <= 0) {
  json_end(422, ['success'=>false, 'error'=>"Câmpul 'id' este obligatoriu și trebuie să fie > 0."]);
}

// Verifică existența
$chk = $mysqli->prepare("SELECT id, tip, publicat FROM mesaje WHERE id = ?");
if (!$chk) json_end(500, ['success'=>false, 'error'=>'Eroare prepare SELECT: '.$mysqli->error]);
$chk->bind_param('i', $mesajId);
$chk->execute();
$res = $chk->get_result();
$row = $res->fetch_assoc();
$chk->close();

if (!$row) {
  json_end(404, ['success'=>false, 'error'=>'Mesajul nu există.']);
}

try {
  if ($soft) {
    // dezpublică (soft delete)
    $stmt = $mysqli->prepare("UPDATE mesaje SET publicat = 0, updated_at = NOW() WHERE id = ?");
    if (!$stmt) json_end(500, ['success'=>false, 'error'=>'Eroare prepare UPDATE: '.$mysqli->error]);
    $stmt->bind_param('i', $mesajId);
    if (!$stmt->execute()) {
      $stmt->close();
      json_end(500, ['success'=>false, 'error'=>'Eroare la dezpublicare: '.$stmt->error]);
    }
    $stmt->close();

    json_end(200, [
      'success'  => true,
      'action'   => 'soft_delete',
      'id'       => $mesajId,
      'message'  => 'Mesajul a fost dezpublicat (publicat=0).'
    ]);

  } else {
    // hard delete (cascade spre mesaje_tinte, mesaje_atase, mesaje_citiri)
    $stmt = $mysqli->prepare("DELETE FROM mesaje WHERE id = ?");
    if (!$stmt) json_end(500, ['success'=>false, 'error'=>'Eroare prepare DELETE: '.$mysqli->error]);
    $stmt->bind_param('i', $mesajId);
    if (!$stmt->execute()) {
      $stmt->close();
      json_end(500, ['success'=>false, 'error'=>'Eroare la ștergere: '.$stmt->error]);
    }
    $affected = $stmt->affected_rows;
    $stmt->close();

    if ($affected < 1) {
      json_end(409, ['success'=>false, 'error'=>'Nu s-a putut șterge (poate a fost deja șters).']);
    }

    json_end(200, [
      'success'  => true,
      'action'   => 'hard_delete',
      'id'       => $mesajId,
      'message'  => 'Mesajul a fost șters definitiv.'
    ]);
  }
} catch (Throwable $e) {
  json_end(500, ['success'=>false, 'error'=>'Eroare internă.', 'details'=>$e->getMessage()]);
}
