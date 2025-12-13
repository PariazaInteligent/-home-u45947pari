<?php
// /api/bets/create.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/config.php';
$me = only_admin_or_403();
$pdo = require_db();

$raw = file_get_contents('php://input'); $in = json_decode($raw ?: '[]', true) ?: [];
$group_uid = trim((string)($in['group_uid'] ?? ''));
$event     = trim((string)($in['event'] ?? ''));
$sport     = trim((string)($in['sport'] ?? ''));
$league    = trim((string)($in['league'] ?? ''));
$selection = trim((string)($in['selection'] ?? ''));
$odds      = (float)($in['odds'] ?? 0);
$stake_eur = (float)($in['stake_eur'] ?? 0);
$currency  = strtolower(trim((string)($in['currency'] ?? 'eur')));
$event_at  = trim((string)($in['event_at'] ?? '')); // "YYYY-MM-DD HH:MM"
$notes     = trim((string)($in['notes'] ?? ''));

if ($event==='' || $odds<=1.01 || $stake_eur<0.5 || !$event_at) {
  jexit(400, ['ok'=>false,'error'=>'bad_input']);
}
$stake_cents = (int)round($stake_eur*100);
if ($group_uid==='') $group_uid = 'BG-'.date('Y').'-'.substr((string)time(), -5);

$pdo->beginTransaction();
try{
  // 1) Insert bet_group
  $q = $pdo->prepare("INSERT INTO bet_groups
    (group_uid,event,sport,league_name,selection_name,odds,stake_cents,currency,event_at,notes,status,created_at,updated_at)
    VALUES (:uid,:event,:sport,:league,:sel,:odds,:stake,:cur,:ev,:notes,'pending',NOW(),NOW())");
  $q->execute([
    ':uid'=>$group_uid, ':event'=>$event, ':sport'=>$sport, ':league'=>$league, ':sel'=>$selection,
    ':odds'=>$odds, ':stake'=>$stake_cents, ':cur'=>$currency, ':ev'=>$event_at, ':notes'=>$notes
  ]);
  $bet_id = (int)$pdo->lastInsertId();

  // 2) INVESTITORI ELIGIBILI LA T0 (ora meciului): total investit <= event_at
  $q = $pdo->prepare("
    SELECT user_id, COALESCE(SUM(amount_cents),0) AS total_cents
    FROM investments
    WHERE status='succeeded' AND created_at <= :ev
    GROUP BY user_id
    HAVING total_cents > 0
  ");
  $q->execute([':ev'=>$event_at]);
  $rows = $q->fetchAll(PDO::FETCH_ASSOC);

  $sum_all = 0; foreach($rows as $r){ $sum_all += (int)$r['total_cents']; }

  if ($sum_all > 0) {
    $ins = $pdo->prepare("INSERT INTO bet_allocations (bet_group_id,user_id,percent,created_at) VALUES (:bg,:uid,:p,NOW())");
    foreach($rows as $r){
      $pct = (float)$r['total_cents'] / (float)$sum_all; // 0..1
      $ins->execute([':bg'=>$bet_id, ':uid'=>(int)$r['user_id'], ':p'=>round($pct, 5)]);
    }
  }

  $pdo->commit();
  jexit(200, ['ok'=>true,'id'=>$bet_id,'group_uid'=>$group_uid,'allocations'=>count($rows)]);
}catch(Throwable $e){
  $pdo->rollBack();
  jexit(500, ['ok'=>false,'error'=>'db_error']);
}
