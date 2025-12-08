<?php
// /api/messages_recipients.php
declare(strict_types=1);
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }
header('Content-Type: application/json; charset=utf-8');

function out($arr, int $code=200){ http_response_code($code); echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }

// include-uri robuste
$ok=false; foreach ([__DIR__.'/require_admin.php', dirname(__DIR__).'/require_admin.php'] as $p){ if(file_exists($p)){ require_once $p; $ok=true; break; } }
if(!$ok) out(['success'=>false,'error'=>'require_admin.php missing'],500);

$ok=false; foreach ([__DIR__.'/db.php', dirname(__DIR__).'/db.php'] as $p){ if(file_exists($p)){ require_once $p; $ok=true; break; } }
if(!$ok) out(['success'=>false,'error'=>'db.php missing'],500);

// doar admin
if (empty($_SESSION['user']) || (($_SESSION['user']['rol'] ?? '') !== 'admin')) {
  out(['success'=>false,'error'=>'Forbidden'],403);
}

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) out(['success'=>false,'error'=>'Missing id'],400);

// select destinatari (nume + email)
$sql = "SELECT u.id, u.nume, u.email
        FROM mesaje_tinte mt
        JOIN utilizatori u ON u.id = mt.user_id
        WHERE mt.mesaj_id = ?
        ORDER BY u.nume ASC";

$stmt = $mysqli->prepare($sql);
if(!$stmt) out(['success'=>false,'error'=>'Prepare failed'],500);
$stmt->bind_param('i', $id);
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($r = $res->fetch_assoc()) {
  $data[] = ['id'=>(int)$r['id'], 'nume'=>$r['nume'], 'email'=>$r['email']];
}
$stmt->close();

out(['success'=>true,'data'=>$data]);
