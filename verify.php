<?php
declare(strict_types=1);
session_start();
$token = (string)($_GET['t'] ?? '');
if ($token===''){ header('Location: /v1/login.html'); exit; }

require __DIR__ . '/api/db.php';
$th = hash('sha256',$token);

$st = $pdo->prepare("
  SELECT ev.id, ev.user_id, u.role, u.email
  FROM email_verifications ev
  JOIN users u ON u.id=ev.user_id
  WHERE ev.token_hash=:t AND ev.used_at IS NULL AND ev.expires_at > NOW()
  LIMIT 1
");
$st->execute([':t'=>$th]);
$row = $st->fetch(PDO::FETCH_ASSOC);
if (!$row) { echo 'Link invalid sau expirat.'; exit; }

$pdo->prepare("UPDATE email_verifications SET used_at=NOW() WHERE id=:id")->execute([':id'=>$row['id']]);
$pdo->prepare("UPDATE users SET email_verified_at=NOW() WHERE id=:id")->execute([':id'=>$row['user_id']]);

$_SESSION['user'] = ['id'=>(int)$row['user_id'],'email'=>$row['email'],'role'=>strtoupper($row['role'] ?? 'USER')];

$DASHBOARD = ['ADMIN'=>'/v1/dashboard-admin.html','USER'=>'/v1/dashboard-investitor.html'];
$role = strtoupper($row['role'] ?? 'USER');
header('Location: '.($DASHBOARD[$role] ?? '/v1/dashboard-investitor.html'));
exit;
