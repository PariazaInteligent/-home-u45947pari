<?php
// /api/users_search.php
declare(strict_types=1);
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', '0');

function out($arr, int $code=200){ http_response_code($code); echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }

// ---- include-uri robuste
$ok=false;
foreach ([__DIR__.'/require_admin.php', dirname(__DIR__).'/require_admin.php'] as $p){ if(file_exists($p)){ require_once $p; $ok=true; break; } }
if(!$ok) out(['success'=>false,'error'=>'require_admin.php missing'],500);

$ok=false;
foreach ([__DIR__.'/db.php', dirname(__DIR__).'/db.php'] as $p){ if(file_exists($p)){ require_once $p; $ok=true; break; } }
if(!$ok) out(['success'=>false,'error'=>'db.php missing'],500);

// ---- doar admin
if (empty($_SESSION['user']) || (($_SESSION['user']['rol'] ?? '') !== 'admin')) {
  out(['success'=>false,'error'=>'Forbidden'],403);
}

// ---- parametri
$q = trim((string)($_GET['q'] ?? ''));
$limit = (int)($_GET['limit'] ?? 20);
$limit = max(1, min(50, $limit));

if ($q === '') out(['success'=>true,'data'=>[]]);

// pregătim pattern-ul pentru LIKE
// (nu mai folosim ESCAPE — lăsăm LIKE simplu, parametric)
$pattern = "%{$q}%";

// ---- interogare
$sql = "SELECT id, nume, email
        FROM utilizatori
        WHERE nume LIKE ? OR email LIKE ?
        ORDER BY nume ASC
        LIMIT ?";

$stmt = $mysqli->prepare($sql);
if(!$stmt) out(['success'=>false,'error'=>'Prepare failed'],500);

$stmt->bind_param('ssi', $pattern, $pattern, $limit);
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while ($row = $res->fetch_assoc()) {
  $data[] = ['id'=>(int)$row['id'], 'nume'=>$row['nume'], 'email'=>$row['email']];
}
$stmt->close();

out(['success'=>true,'data'=>$data]);
