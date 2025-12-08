<?php
// /api/bets/create_group.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (empty($_SESSION['user']) || strtoupper($_SESSION['user']['role'] ?? 'USER') !== 'ADMIN') {
  http_response_code(403);
  echo json_encode(['ok'=>false,'error'=>'forbidden']); exit;
}

require __DIR__ . '/../db.php';
require __DIR__ . '/../stripe/config.php'; // pentru PLATFORM_FEE_PCT, reusez config

function jexit($code, $payload){ http_response_code($code); echo json_encode($payload, JSON_UNESCAPED_UNICODE); exit; }

$raw = file_get_contents('php://input');
$in  = json_decode($raw,true) ?: $_POST;

// input
$uid       = trim((string)($in['uid'] ?? ''));
$sport     = trim((string)($in['sport'] ?? ''));
$league    = trim((string)($in['league'] ?? ''));
$event     = trim((string)($in['event'] ?? ''));
$selection = trim((string)($in['selection'] ?? ''));
$odds      = (float)($in['odds'] ?? 2.0);
$stakeEUR  = (float)($in['stake_eur'] ?? 0);
$currency  = strtolower((string)($in['currency'] ?? 'eur'));
$event_at  = trim((string)($in['event_at'] ?? ''));
$note      = trim((string)($in['note'] ?? ''));

if ($uid === '' || $stakeEUR <= 0 || $odds <= 1.0) jexit(400, ['ok'=>false,'error'=>'invalid_input']);

$stake_cents = (int)round($stakeEUR*100);
$snapshot_at = date('Y-m-d H:i:s'); // acum – momentul plasării pariului de către admin
$event_ts    = $event_at ? date('Y-m-d H:i:s', strtotime($event_at)) : null;

try {
  $pdo->beginTransaction();

  // 1) inserăm grupul
  $ins = $pdo->prepare("INSERT INTO bet_groups
    (uid,sport,league,event_name,selection,odds,stake_cents,currency,event_at,snapshot_at,note,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,'PENDING')");
  $ins->execute([$uid,$sport,$league,$event,$selection,$odds,$stake_cents,$currency,$event_ts,$snapshot_at,$note]);
  $group_id = (int)$pdo->lastInsertId();

  // 2) snapshot investitori: toți cu depuneri confirmate până la snapshot_at
  $q = $pdo->prepare("
    SELECT user_id, COALESCE(SUM(amount_cents),0) AS sum_cents
    FROM investments
    WHERE status='succeeded' AND created_at <= :snap
    GROUP BY user_id
    HAVING sum_cents > 0
  ");
  $q->execute([':snap'=>$snapshot_at]);
  $rows = $q->fetchAll(PDO::FETCH_ASSOC);

  $total = 0;
  foreach ($rows as $r) $total += (int)$r['sum_cents'];
  if ($total <= 0) { $pdo->rollBack(); jexit(409, ['ok'=>false,'error'=>'no_eligible_investors']); }

  $insA = $pdo->prepare("INSERT INTO bet_group_allocations (group_id,user_id,percent,snapshot_cents) VALUES (?,?,?,?)");
  foreach ($rows as $r){
    $uidx = (int)$r['user_id'];
    $sumc = (int)$r['sum_cents'];
    $pct  = $sumc / $total; // 0..1
    $insA->execute([$group_id,$uidx,$pct,$sumc]);
  }

  $pdo->commit();
  jexit(200, ['ok'=>true,'group_id'=>$group_id]);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  jexit(500, ['ok'=>false,'error'=>'db_error','message'=>$e->getMessage()]);
}
