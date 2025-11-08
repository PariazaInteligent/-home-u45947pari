<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);

$DB_HOST = 'localhost';
$DB_NAME = 'u54947pari_pariaza_inteligent';
$DB_USER = 'u54947pari_api';          // ← userul creat în cPanel
$DB_PASS = ')nqw~^gmYMn&5PXs';    // ← parola userului

function out($d,$c=200){ http_response_code($c); echo json_encode($d,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
function j($s){ if($s===null||$s==='')return null; $x=json_decode($s,true); return json_last_error()===JSON_ERROR_NONE?$x:['raw'=>$s]; }

$endpoint = $_GET['endpoint'] ?? '';
$noDb = ['dailyHistory','announcements','userMessages','investmentAlerts','feedback','platformSettings','referrals','calendarEvents','investmentGoals','bets'];
if(in_array($endpoint,$noDb,true)) out([]);

try{
  $pdo=new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",$DB_USER,$DB_PASS,[
    PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
  ]);
}catch(Throwable $e){ out(['error'=>'DB_CONNECT_ERROR','message'=>$e->getMessage()],500); }

try{
  switch($endpoint){
    case 'users':
      $rows=$pdo->query("SELECT id,email,name,avatar,role,is_active AS isActive,is_global_admin AS isGlobalAdmin,profile_data FROM users")->fetchAll();
      out(array_map(fn($r)=>[
        'id'=>(string)$r['id'],'email'=>(string)($r['email']??''),'name'=>(string)($r['name']??'Utilizator'),
        'avatar'=>$r['avatar']??null,'role'=>(string)($r['role']??'USER'),
        'isActive'=>(bool)($r['isActive']??true),'isGlobalAdmin'=>(bool)($r['isGlobalAdmin']??false),
        'profileData'=>j($r['profile_data']??null) ?? new stdClass(),
      ],$rows));

    case 'transactions':
      $sql="SELECT t.id,t.timestamp,t.user_id,t.admin_id,t.type,t.status,t.amount,t.description,t.details,
                   u.name AS investor_name
            FROM transactions t
            LEFT JOIN users u ON u.id=t.user_id
            ORDER BY t.timestamp DESC
            LIMIT 500";
      $rows=$pdo->query($sql)->fetchAll();
      out(array_map(fn($r)=>[
        'id'=>(string)$r['id'],
        'timestamp'=>date('c',strtotime($r['timestamp']??'now')),
        'userId'=>isset($r['user_id'])?(string)$r['user_id']:null,
        'adminId'=>isset($r['admin_id'])?(string)$r['admin_id']:null,
        'type'=>(string)($r['type']??'ADMIN_ACTION'),
        'status'=>(string)($r['status']??'COMPLETED'),
        'amount'=>isset($r['amount'])?(float)$r['amount']:null,
        'description'=>$r['description']??null,
        'details'=>j($r['details']??null),
        'investorName'=>$r['investor_name']??null,
      ],$rows));

    case 'globalStats':
      $sum=$pdo->query("SELECT COALESCE(SUM(amount),0) s FROM transactions WHERE type='INVESTMENT_APPROVAL' AND status='COMPLETED'")->fetch()['s'] ?? 0;
      $cnt=$pdo->query("SELECT COUNT(DISTINCT user_id) c FROM transactions WHERE type='INVESTMENT_APPROVAL' AND status='COMPLETED'")->fetch()['c'] ?? 0;
      out(['totalInvested'=>(float)$sum,'totalProfitDistributed'=>0,'activeInvestors'=>(int)$cnt]);

    default: out(['error'=>'UNKNOWN_ENDPOINT'],400);
  }
}catch(Throwable $e){ out(['error'=>'UNHANDLED_EXCEPTION','message'=>$e->getMessage()],500); }
