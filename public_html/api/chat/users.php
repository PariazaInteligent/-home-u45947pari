<?php
// /api/chat/users.php — returnează o listă unică de user_name din chat (și/sau din tabela users)
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
session_start();
$me = $_SESSION['user'] ?? null;
if (!$me) { echo json_encode(['ok'=>false,'error'=>'auth']); exit; }

require __DIR__.'/../db.php';
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$limit = max(1, min( (int)($_GET['limit'] ?? 400), 1000 ));

$items = [];
try {
  // prioritar din chat_messages
  $sql = "SELECT user_name, MAX(role) AS role FROM chat_messages WHERE user_name IS NOT NULL AND user_name<>'' GROUP BY user_name ORDER BY user_name ASC LIMIT :lim";
  $st = $pdo->prepare($sql);
  $st->bindValue(':lim',$limit,PDO::PARAM_INT);
  $st->execute();
  while($r=$st->fetch(PDO::FETCH_ASSOC)){
    $items[] = ['name'=>$r['user_name'],'role'=>strtoupper($r['role'] ?? 'USER')];
  }

  // dacă ai tabelă users, poți uni și de acolo (fără duplicate)
  try {
    $st2 = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($st2->fetch()){
      $st3 = $pdo->prepare("SELECT name, role FROM users WHERE name IS NOT NULL AND name<>'' ORDER BY name ASC LIMIT :lim");
      $st3->bindValue(':lim',$limit,PDO::PARAM_INT);
      $st3->execute();
      foreach($st3 as $r){
        $n = trim($r['name'] ?? '');
        if ($n && !in_array($n, array_column($items,'name'), true)){
          $items[] = ['name'=>$n,'role'=>strtoupper($r['role'] ?? 'USER')];
        }
      }
    }
  } catch(Throwable $e){ /* opțional */ }

  echo json_encode(['ok'=>true,'items'=>$items]);
} catch(Throwable $e){
  echo json_encode(['ok'=>false,'error'=>'server_error','hint'=>$e->getMessage()]);
}
