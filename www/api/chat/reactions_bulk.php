<?php
// returnează count-urile pe emoji pentru un set de mesaje
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/../db.php'; // $pdo

$ids = isset($_GET['ids']) ? array_filter(array_map('intval', explode(',', $_GET['ids']))) : [];
if (!$ids) { echo json_encode(['ok'=>true,'items'=>[]]); exit; }

$in  = implode(',', array_fill(0, count($ids), '?'));
$sql = "SELECT message_id, emoji, COUNT(*) AS cnt
        FROM chat_reactions
        WHERE message_id IN ($in)
        GROUP BY message_id, emoji";
$stmt = $pdo->prepare($sql);
$stmt->execute($ids);

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$map  = [];
foreach ($ids as $id) $map[$id] = ['message_id'=>$id, 'counts'=>[]];
foreach ($rows as $r) {
  $mid = (int)$r['message_id'];
  $emo = (string)$r['emoji'];
  $cnt = (int)$r['cnt'];
  $map[$mid]['counts'][$emo] = $cnt;
}
echo json_encode(['ok'=>true,'items'=>array_values($map)]);
