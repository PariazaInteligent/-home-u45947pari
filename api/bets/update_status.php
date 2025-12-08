<?php
// /api/bets/update_status.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/config.php';
$me = only_admin_or_403();
$pdo = require_db();

$raw = file_get_contents('php://input'); $in = json_decode($raw ?: '[]', true) ?: [];
$bet_id = (int)($in['bet_group_id'] ?? 0);
$new    = strtolower((string)($in['status'] ?? ''));
$score  = trim((string)($in['score'] ?? ''));

if ($bet_id<=0 || !in_array($new,['pending','won','lost','void','half_won','half_lost'],true)) {
  jexit(400, ['ok'=>false,'error'=>'bad_input']);
}

$q = $pdo->prepare("SELECT * FROM bet_groups WHERE id=:id LIMIT 1"); $q->execute([':id'=>$bet_id]);
$g = $q->fetch(PDO::FETCH_ASSOC);
if (!$g) jexit(404, ['ok'=>false,'error'=>'not_found']);

$stake = (int)$g['stake_cents'];
$odds  = (float)$g['odds'];

$gross = 0;
switch($new){
  case 'won':       $gross = (int)round($stake * max(0, $odds - 1)); break;
  case 'lost':      $gross = -$stake; break;
  case 'void':      $gross = 0; break;
  case 'half_won':  $gross = (int)round(($stake/2) * max(0, $odds - 1)); break;
  case 'half_lost': $gross = (int)round(-$stake/2); break;
  case 'pending':   $gross = null; // re-deschidere
}

$net = $gross;
if ($gross !== null && $gross > 0) {
  $net = (int)round($gross * (1 - PLATFORM_FEE_PCT)); // scădem comisionul DOAR la profit
}

$pdo->beginTransaction();
try{
  // update group
  $qq = $pdo->prepare("UPDATE bet_groups SET status=:st, score=:sc, profit_net_cents=:p, updated_at=NOW() WHERE id=:id");
  $qq->execute([
    ':st'=>$new, ':sc'=>($score!==''?$score:null), ':p'=>($net===null?null:$net), ':id'=>$bet_id
  ]);

  // Re-distribuiri (idempotent: șterge & recreează)
  $pdo->prepare("DELETE FROM profit_distributions WHERE bet_group_id=:id")->execute([':id'=>$bet_id]);

  if ($net !== null) {
    $allocs = $pdo->prepare("SELECT user_id,percent FROM bet_allocations WHERE bet_group_id=:id");
    $allocs->execute([':id'=>$bet_id]);
    $ins = $pdo->prepare("INSERT INTO profit_distributions (bet_group_id,user_id,amount_cents,created_at) VALUES (:bg,:u,:amt,NOW())");
    foreach($allocs as $a){
      $share = (int)round($net * (float)$a['percent']);
      if ($share !== 0) $ins->execute([':bg'=>$bet_id, ':u'=>(int)$a['user_id'], ':amt'=>$share]);
    }
  }

  $pdo->commit();
  jexit(200, ['ok'=>true,'profit_net_cents'=>$net]);
}catch(Throwable $e){
  $pdo->rollBack();
  jexit(500, ['ok'=>false,'error'=>'db_error']);
}
