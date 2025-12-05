<?php
// /api/user/withdrawals/processing_stats.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

session_start();

// convertim toate erorile în excepții => nu mai rămâne 500 „mut”
set_error_handler(function($sev,$msg,$file,$line){
  throw new ErrorException($msg, 0, $sev, $file, $line);
});

try {
  if (empty($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit;
  }
  $uid = (int)($_SESSION['user']['id'] ?? 0);
  if ($uid <= 0) {
    http_response_code(401);
    echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit;
  }

  // <-- IMPORTANT: db.php este în /api/db.php
  require dirname(__DIR__, 2) . '/db.php';  // /api/user/withdrawals -> (..,2) = /api

  // Media pe ultimele 365 zile, doar cereri aprobate cu ambele timestamp-uri
  $sql = "
    SELECT
      AVG(TIMESTAMPDIFF(SECOND, wr.created_at, wr.processed_at)) AS avg_secs,
      COUNT(*) AS n
    FROM withdrawal_requests wr
    WHERE wr.user_id = :uid
      AND wr.status = 'approved'
      AND wr.created_at IS NOT NULL
      AND wr.processed_at IS NOT NULL
      AND wr.processed_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)
  ";

  $st = $pdo->prepare($sql);
  $st->execute([':uid' => $uid]);
  $row = $st->fetch(PDO::FETCH_ASSOC) ?: ['avg_secs'=>null,'n'=>0];

  $avg = is_null($row['avg_secs']) ? 0.0 : (float)$row['avg_secs'];
  $n   = (int)$row['n'];

  echo json_encode(['ok'=>true, 'avg_seconds'=>$avg, 'n'=>$n]); exit;

} catch (Throwable $e) {
  // log pe server, răspuns curat în JSON
  error_log('[processing_stats.php] '.$e->getMessage().' @ '.$e->getFile().':'.$e->getLine());
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error']); exit;
}
