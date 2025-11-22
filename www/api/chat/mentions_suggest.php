<?php
// /api/chat/mentions_suggest.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');

$me = $_SESSION['user'] ?? null;
if (!$me) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit; }

require __DIR__ . '/../db.php'; // $pdo

$q = trim($_GET['q'] ?? '');
$limit = max(1, min( (int)($_GET['limit'] ?? 10), 20 ));

$sql = "SELECT id, COALESCE(NULLIF(TRIM(name),''), SUBSTRING_INDEX(email,'@',1)) AS name,
               UPPER(role) AS role,
               (CASE WHEN last_seen_at IS NOT NULL AND TIMESTAMPDIFF(SECOND,last_seen_at, NOW()) < 45 THEN 1 ELSE 0 END) AS is_online
        FROM users
        WHERE (name LIKE :k OR email LIKE :k) AND role IN ('USER','ADMIN')
        ORDER BY is_online DESC, name ASC
        LIMIT :lim";

$stmt = $pdo->prepare($sql);
$like = $q !== '' ? $q.'%' : '%';
$stmt->bindValue(':k', $like, PDO::PARAM_STR);
$stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['ok'=>true,'items'=>array_map(function($r){
  return [
    'user_id'   => (int)$r['id'],
    'name'      => (string)$r['name'],
    'role'      => (string)$r['role'],
    'is_online' => (bool)$r['is_online'],
  ];
}, $rows)]);
