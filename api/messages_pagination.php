<?php
// api/messages_pagination.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }
require __DIR__ . '/../db.php';

function jend(int $code, array $payload){
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// Parametri GET
$page      = max(1, (int)($_GET['page'] ?? 1));
$perPage   = max(1, min(50, (int)($_GET['per_page'] ?? 10))); // max 50 / pagină
$tip       = $_GET['tip'] ?? null;        // 'anunt' | 'personal' | null
$important = isset($_GET['important']) ? (int)$_GET['important'] : null; // 0/1
$search    = trim($_GET['q'] ?? '');
$userId    = $_SESSION['user']['id'] ?? 0;
$userRole  = $_SESSION['user']['rol'] ?? 'utilizator';

$offset = ($page - 1) * $perPage;

// WHERE conditions
$where = [];
$params = [];
$types  = '';

if ($tip) {
    $where[] = "m.tip = ?";
    $params[] = $tip;
    $types   .= 's';
}

if ($important !== null) {
    $where[] = "m.important = ?";
    $params[] = $important;
    $types   .= 'i';
}

if ($search !== '') {
    $where[] = "(m.titlu LIKE CONCAT('%', ?, '%') OR m.continut LIKE CONCAT('%', ?, '%'))";
    $params[] = $search;
    $params[] = $search;
    $types   .= 'ss';
}

// Doar publice pentru user, toate pentru admin
if ($userRole !== 'admin') {
    $where[] = "m.publicat = 1 AND (m.tip='anunt' OR EXISTS(SELECT 1 FROM mesaje_tinte t WHERE t.mesaj_id=m.id AND t.user_id=?))";
    $params[] = $userId;
    $types   .= 'i';
}

$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Count total
$sqlCount = "SELECT COUNT(*) as total FROM mesaje m $whereSql";
$stmt = $mysqli->prepare($sqlCount);
if ($types) $stmt->bind_param($types, ...$params);
$stmt->execute();
$total = $stmt->get_result()->fetch_assoc()['total'] ?? 0;
$stmt->close();

// Pagination query
$sql = "SELECT m.id, m.tip, m.titlu, m.continut, m.important, m.publicat,
               m.created_at, m.updated_at, u.nume AS autor
        FROM mesaje m
        JOIN utilizatori u ON u.id = m.created_by
        $whereSql
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?";

$params2 = $params;
$types2  = $types . 'ii';
$params2[] = $perPage;
$params2[] = $offset;

$stmt = $mysqli->prepare($sql);
$stmt->bind_param($types2, ...$params2);
$stmt->execute();
$res = $stmt->get_result();

$data = [];
while($row = $res->fetch_assoc()){
    $data[] = [
        'id'        => (int)$row['id'],
        'tip'       => $row['tip'],
        'titlu'     => $row['titlu'],
        'continut'  => $row['continut'],
        'important' => (int)$row['important'],
        'publicat'  => (int)$row['publicat'],
        'autor'     => $row['autor'],
        'created_at'=> $row['created_at'],
        'updated_at'=> $row['updated_at'],
    ];
}
$stmt->close();

jend(200, [
    'success'      => true,
    'page'         => $page,
    'per_page'     => $perPage,
    'total'        => (int)$total,
    'total_pages'  => (int)ceil($total / $perPage),
    'items'        => $data
]);
