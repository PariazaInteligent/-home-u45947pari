<?php
require __DIR__.'/../db.php';
header('Content-Type: application/json');
$ids = isset($_GET['ids']) ? array_filter(array_map('intval', explode(',', $_GET['ids']))) : [];
if (!$ids){ echo json_encode(['ok'=>true,'items'=>[]]); exit; }

// totals
$in = str_repeat('?,', count($ids)-1).'?';
$sql = "SELECT msg_id, emoji, COUNT(*) c FROM chat_reactions WHERE msg_id IN ($in) GROUP BY msg_id, emoji";
$st = $pdo->prepare($sql); $st->execute($ids);
$totals = [];
while($r = $st->fetch(PDO::FETCH_ASSOC)){
  $mid = (int)$r['msg_id'];
  $emo = $r['emoji'];
  $totals[$mid][$emo] = (int)$r['c'];
}

// mine
session_start();
$uid = $_SESSION['user']['id'] ?? 0;
$mine = [];
if ($uid){
  $st = $pdo->prepare("SELECT msg_id, emoji FROM chat_reactions WHERE user_id=? AND msg_id IN ($in)");
  $st->execute(array_merge([$uid], $ids));
  while($r = $st->fetch(PDO::FETCH_ASSOC)){
    $mine[(int)$r['msg_id']][] = $r['emoji'];
  }
}

$out = [];
foreach($ids as $mid){
  $out[] = [
    'msg_id' => $mid,
    'totals' => $totals[$mid] ?? new stdClass(),
    'mine'   => $mine[$mid] ?? []
  ];
}
echo json_encode(['ok'=>true,'items'=>$out], JSON_UNESCAPED_UNICODE);
