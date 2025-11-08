<?php
// api/messages_update.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }

require __DIR__ . '/../require_admin.php'; // asigură rol=admin
require __DIR__ . '/../db.php';

function jend(int $code, array $payload): void {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

$raw = file_get_contents('php://input');
$in  = json_decode($raw, true);
if (!is_array($in)) {
  jend(400, ['success'=>false, 'error'=>'Body JSON invalid']);
}

$mesajId   = (int)($in['id'] ?? 0);
$titlu     = isset($in['titlu'])     ? trim((string)$in['titlu'])     : null;
$continut  = isset($in['continut'])  ? trim((string)$in['continut'])  : null;
$tip       = isset($in['tip'])       ? trim((string)$in['tip'])       : null; // 'anunt' | 'personal'
$important = isset($in['important']) ? (int)!!$in['important']        : null; // 0/1
$publicat  = isset($in['publicat'])  ? (int)!!$in['publicat']         : null; // 0/1

// opționale: înlocuiesc listele existente când sunt furnizate
$targets      = $in['targets']      ?? null; // array<int user_id>
$attachments  = $in['attachments']  ?? null; // array< {file_url, mime?} >

if ($mesajId <= 0) {
  jend(422, ['success'=>false, 'error'=>"Câmpul 'id' este obligatoriu (>0)."]);
}

if ($tip !== null && !in_array($tip, ['anunt','personal'], true)) {
  jend(422, ['success'=>false, 'error'=>"Câmpul 'tip' trebuie să fie 'anunt' sau 'personal'."]);
}

if ($titlu !== null && $titlu === '') {
  jend(422, ['success'=>false, 'error'=>"Titlul nu poate fi gol."]);
}
if ($titlu !== null && mb_strlen($titlu) > 200) {
  jend(422, ['success'=>false, 'error'=>"Titlul nu poate depăși 200 caractere."]);
}
if ($continut !== null && $continut === '') {
  jend(422, ['success'=>false, 'error'=>"Conținutul nu poate fi gol."]);
}

try {
  // Citește mesajul curent
  $chk = $mysqli->prepare("SELECT id, tip FROM mesaje WHERE id=? LIMIT 1");
  if (!$chk) jend(500, ['success'=>false, 'error'=>'Eroare SELECT: '.$mysqli->error]);
  $chk->bind_param('i', $mesajId);
  $chk->execute();
  $cur = $chk->get_result()->fetch_assoc();
  $chk->close();

  if (!$cur) jend(404, ['success'=>false, 'error'=>'Mesaj inexistent.']);

  // Construiește UPDATE dinamic
  $fields = [];
  $types  = '';
  $vals   = [];

  if ($titlu !== null)     { $fields[] = "titlu=?";     $types.='s'; $vals[]=$titlu; }
  if ($continut !== null)  { $fields[] = "continut=?";  $types.='s'; $vals[]=$continut; }
  if ($tip !== null)       { $fields[] = "tip=?";       $types.='s'; $vals[]=$tip; }
  if ($important !== null) { $fields[] = "important=?"; $types.='i'; $vals[]=$important; }
  if ($publicat !== null)  { $fields[] = "publicat=?";  $types.='i'; $vals[]=$publicat; }

  // Dacă nu se schimbă nimic și nu avem liste de înlocuit, ieșim
  $willReplaceTargets     = is_array($targets);
  $willReplaceAttachments = is_array($attachments);

  if (!$fields && !$willReplaceTargets && !$willReplaceAttachments) {
    jend(200, ['success'=>true, 'message'=>'Nimic de actualizat.']);
  }

  $mysqli->begin_transaction();

  if ($fields) {
    $sql = "UPDATE mesaje SET ".implode(', ', $fields).", updated_at=NOW() WHERE id=?";
    $types .= 'i'; $vals[] = $mesajId;

    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
      $mysqli->rollback();
      jend(500, ['success'=>false, 'error'=>'Eroare UPDATE prepare: '.$mysqli->error]);
    }
    $stmt->bind_param($types, ...$vals);
    if (!$stmt->execute()) {
      $err = $stmt->error; $stmt->close(); $mysqli->rollback();
      jend(500, ['success'=>false, 'error'=>'Eroare la UPDATE: '.$err]);
    }
    $stmt->close();
  }

  // Re-evaluează tipul final (în caz că s-a schimbat în acest update)
  $finalTip = $tip ?? $cur['tip'];

  // targets: doar dacă mesajul e 'personal'
  if ($willReplaceTargets) {
    if ($finalTip !== 'personal') {
      // dacă s-a trecut la 'anunt', curățăm țintele
      $del = $mysqli->prepare("DELETE FROM mesaje_tinte WHERE mesaj_id=?");
      if ($del) { $del->bind_param('i', $mesajId); $del->execute(); $del->close(); }
    } else {
      // normalizează și filtrează IDs
      $uids = array_values(array_unique(array_map(fn($v)=> (int)$v, $targets)));
      // înlocuire completă
      $del = $mysqli->prepare("DELETE FROM mesaje_tinte WHERE mesaj_id=?");
      if (!$del) { $mysqli->rollback(); jend(500, ['success'=>false, 'error'=>'Eroare DELETE tintes: '.$mysqli->error]); }
      $del->bind_param('i', $mesajId);
      $del->execute();
      $del->close();

      if ($uids) {
        $ins = $mysqli->prepare("INSERT INTO mesaje_tinte (mesaj_id, user_id) VALUES (?, ?)");
        if (!$ins) { $mysqli->rollback(); jend(500, ['success'=>false, 'error'=>'Eroare INSERT tintes: '.$mysqli->error]); }
        foreach ($uids as $uid) {
          if ($uid > 0) {
            $ins->bind_param('ii', $mesajId, $uid);
            if (!$ins->execute()) {
              $err = $ins->error; $ins->close(); $mysqli->rollback();
              jend(500, ['success'=>false, 'error'=>'Eroare inserare țintă: '.$err]);
            }
          }
        }
        $ins->close();
      }
    }
  }

  // attachments: înlocuire completă doar dacă a fost furnizat câmpul
  if ($willReplaceAttachments) {
    $delA = $mysqli->prepare("DELETE FROM mesaje_atase WHERE mesaj_id=?");
    if (!$delA) { $mysqli->rollback(); jend(500, ['success'=>false, 'error'=>'Eroare DELETE atașe: '.$mysqli->error]); }
    $delA->bind_param('i', $mesajId);
    $delA->execute();
    $delA->close();

    if (is_array($attachments) && !empty($attachments)) {
      $insA = $mysqli->prepare("INSERT INTO mesaje_atase (mesaj_id, file_url, mime) VALUES (?, ?, ?)");
      if (!$insA) { $mysqli->rollback(); jend(500, ['success'=>false, 'error'=>'Eroare INSERT atașe: '.$mysqli->error]); }
      foreach ($attachments as $att) {
        $url  = isset($att['file_url']) ? trim((string)$att['file_url']) : '';
        $mime = isset($att['mime'])     ? trim((string)$att['mime'])     : null;
        if ($url === '') continue;
        $insA->bind_param('iss', $mesajId, $url, $mime);
        if (!$insA->execute()) {
          $err = $insA->error; $insA->close(); $mysqli->rollback();
          jend(500, ['success'=>false, 'error'=>'Eroare inserare atașament: '.$err]);
        }
      }
      $insA->close();
    }
  }

  $mysqli->commit();

  jend(200, [
    'success' => true,
    'id'      => $mesajId,
    'message' => 'Mesaj actualizat cu succes.'
  ]);

} catch (Throwable $e) {
  if ($mysqli->errno) { $mysqli->rollback(); }
  jend(500, ['success'=>false, 'error'=>'Eroare internă', 'details'=>$e->getMessage()]);
}
