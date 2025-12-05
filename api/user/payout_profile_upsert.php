<?php
session_start(); header('Content-Type: application/json');
if (empty($_SESSION['user'])) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'unauth']); exit; }
$inp=json_decode(file_get_contents('php://input'),true) ?: [];
$iban=preg_replace('/[^A-Z0-9]/i','', trim($inp['iban'] ?? ''));
$holder=trim($inp['holder_name'] ?? '');
if(strlen($holder)<4 || strlen($iban)<15 || strlen($iban)>34){ http_response_code(422); echo json_encode(['ok'=>false,'error'=>'invalid']); exit; }
require __DIR__.'/../db.php';
$uid=(int)$_SESSION['user']['id'];
$pdo->prepare("INSERT INTO payout_profiles(user_id,holder_name,iban) VALUES(?,?,?)
               ON DUPLICATE KEY UPDATE holder_name=VALUES(holder_name), iban=VALUES(iban), updated_at=NOW()")
    ->execute([$uid,$holder,$iban]);
echo json_encode(['ok'=>true]);
