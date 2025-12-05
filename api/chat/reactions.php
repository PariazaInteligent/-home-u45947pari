<?php
// /api/chat/reactions.php — agregate reacții pentru o listă de mesaje
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

session_start();
$me = $_SESSION['user'] ?? null;
if (!$me) { echo json_encode(['ok'=>false,'error'=>'auth']); exit; }
$uid = (int)($me['id'] ?? 0);

// ids vine ca: ?ids=12,13,14
$idsRaw = isset($_GET['ids']) ? (string)$_GET['ids'] : '';
$ids = array_map('intval', explode(',', $idsRaw));
$ids = array_values(array_filter($ids, function($x){ return $x > 0; })); // <-- fără arrow fn

if (!$ids) { echo json_encode(['ok'=>true,'items'=>[]]); exit; }

require __DIR__ . '/../db.php'; // $pdo
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

try {
  // ---- Agregate pe (message_id, emoji)
  $in = implode(',', array_fill(0, count($ids), '?'));

  $ag = [];
  $st = $pdo->prepare(
    "SELECT message_id, emoji, SUM(active) AS c
     FROM chat_reactions
     WHERE message_id IN ($in)
     GROUP BY message_id, emoji"
  );
  $st->execute($ids);
  while ($r = $st->fetch()) {
    $mid = (int)$r['message_id'];
    if (!isset($ag[$mid])) $ag[$mid] = [];
    $ag[$mid][$r['emoji']] = (int)$r['c'];
  }

  // ---- Reacțiile mele active pentru aceleași mesaje
  $mine = [];
  $st2 = $pdo->prepare(
    "SELECT message_id, emoji
     FROM chat_reactions
     WHERE user_id=? AND active=1 AND message_id IN ($in)"
  );
  $params = array_merge([$uid], $ids);
  $st2->execute($params);
  while ($r = $st2->fetch()) {
    $mid = (int)$r['message_id'];
    if (!isset($mine[$mid])) $mine[$mid] = [];
    $mine[$mid][] = $r['emoji'];
  }

  // ---- Output în aceeași ordine ca lista primită
  $out = [];
  foreach ($ids as $mid) {
    $out[] = [
      'message_id' => (int)$mid,
      'counts'     => isset($ag[$mid]) ? $ag[$mid] : [],
      'mine'       => isset($mine[$mid]) ? $mine[$mid] : [],
    ];
  }

  echo json_encode(['ok'=>true,'items'=>$out]);
} catch (Throwable $e) {
  echo json_encode(['ok'=>false,'error'=>'server_error','hint'=>$e->getMessage()]);
}
