<?php
// returns {ok:true, iban, holder_name} or 404-ish
session_start(); header('Content-Type: application/json');
if (empty($_SESSION['user'])) { http_response_code(401); echo json_encode(['ok'=>false]); exit; }
require __DIR__.'/../db.php';
$uid=(int)$_SESSION['user']['id'];
$row=$pdo->prepare("SELECT iban, holder_name FROM payout_profiles WHERE user_id=?"); $row->execute([$uid]);
if($r=$row->fetch(PDO::FETCH_ASSOC)){ echo json_encode(['ok'=>true,'iban'=>$r['iban'],'holder_name'=>$r['holder_name']]); }
else { http_response_code(404); echo json_encode(['ok'=>false]); }
