<?php
// api/messages_list.php
header('Content-Type: application/json; charset=utf-8');
if (session_status() !== PHP_SESSION_ACTIVE) session_start();

require __DIR__ . '/../db.php';

$userId   = isset($_SESSION['user']['id'])  ? (int)$_SESSION['user']['id']  : 0;
$userRole = $_SESSION['user']['rol'] ?? 'utilizator';
$isAdmin  = ($userRole === 'admin');

/* ---------- Parametri ---------- */
$page    = max(1, (int)($_GET['page'] ?? 1));
$limit   = max(1, min(100, (int)($_GET['limit'] ?? ($_GET['per_page'] ?? 20))));
$offset  = ($page - 1) * $limit;

$tab       = ($_GET['tab'] ?? 'anunturi');           // 'anunturi' | 'personale' | 'toate' (doar admin)
$q         = trim((string)($_GET['q'] ?? ''));       // căutare text
$unread    = isset($_GET['unread']) ? (int)$_GET['unread'] : 0; // 1 = doar necitite (relativ la user curent)
$important = (isset($_GET['important']) && $_GET['important'] !== '') ? (int)$_GET['important'] : null; // 0/1/NULL
$scope     = strtolower(trim((string)($_GET['scope'] ?? 'mine'))); // 'mine' (implicit) | 'all' (doar admin la personale)
$idFilter  = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
    $where  = [];
    $typesW = '';
    $valsW  = [];

    /* ---------- Tab & scope ---------- */
    if ($tab === 'anunturi') {
        $where[] = "m.tip = 'anunt'";
        if (!$isAdmin) $where[] = "m.publicat = 1";
    } elseif ($tab === 'personale') {
        $where[] = "m.tip = 'personal'";
        // admin vede toate DOAR cu scope=all; altfel fiecare își vede doar mesajele
        $adminSeeAll = ($isAdmin && $scope === 'all');
        if (!$adminSeeAll) {
            $where[]  = "m.id IN (SELECT mesaj_id FROM mesaje_tinte WHERE user_id = ?)";
            $typesW  .= 'i';
            $valsW[]  = $userId;
        }
    } else { // 'toate'
        if (!$isAdmin) {
            $where[] = "m.tip = 'anunt'";
            $where[] = "m.publicat = 1";
        }
    }

    /* ---------- Filtre suplimentare ---------- */
    // ID specific
    if ($idFilter > 0) {
        $where[] = "m.id = ?";
        $typesW .= 'i';
        $valsW[] = $idFilter;
    }

    // Important (0/1)
    if ($important !== null) {
        $where[] = "m.important = ?";
        $typesW .= 'i';
        $valsW[] = $important;
    }

    // Căutare text
    if ($q !== '') {
        $where[] = "(m.titlu LIKE ? OR m.continut LIKE ?)";
        $like    = "%$q%";
        $typesW .= 'ss';
        $valsW[]  = $like;
        $valsW[]  = $like;
    }

    // Doar necitite (pentru userul curent), pentru ORICE tab (inclusiv anunțuri)
    if ($unread === 1 && $userId > 0) {
        $where[] = "NOT EXISTS (SELECT 1 FROM mesaje_citiri mc WHERE mc.mesaj_id = m.id AND mc.user_id = ?)";
        $typesW .= 'i';
        $valsW[] = $userId;
    }

    $whereSQL = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    /* ---------- COUNT ---------- */
    $sqlCount  = "SELECT COUNT(*) AS total FROM mesaje m $whereSQL";
    $stmtCount = $mysqli->prepare($sqlCount);
    if ($typesW !== '') $stmtCount->bind_param($typesW, ...$valsW);
    $stmtCount->execute();
    $totalRow = $stmtCount->get_result()->fetch_assoc();
    $total    = (int)($totalRow['total'] ?? 0);
    $stmtCount->close();

    $pages = max(1, (int)ceil($total / $limit));

    /* ---------- SELECT listare (include flagul 'unread' relativ la user curent) ---------- */
    // Pentru a determina 'unread' eficient, facem LEFT JOIN pe citirea user-ului curent.
    $preTypes     = '';
    $preVals      = [];
    $joinUnread   = '';
    $unreadSelect = '0 AS unread';
    if ($userId > 0) {
        $joinUnread   = "LEFT JOIN mesaje_citiri mc_u ON mc_u.mesaj_id = m.id AND mc_u.user_id = ?";
        $unreadSelect = "(mc_u.user_id IS NULL) AS unread";
        $preTypes    .= 'i';
        $preVals[]    = $userId;
    }

    $sql = "SELECT m.id, m.tip, m.titlu, m.continut,
                   m.important, m.publicat,
                   m.created_at, m.updated_at,
                   u.nume AS autor,
                   $unreadSelect
            FROM mesaje m
            JOIN utilizatori u ON u.id = m.created_by
            $joinUnread
            $whereSQL
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?";

    // Ordinea parametrilor = JOIN(unread) + WHERE + LIMIT/OFFSET
    $types = $preTypes . $typesW . 'ii';
    $vals  = array_merge($preVals, $valsW, [$limit, $offset]);

    $stmt = $mysqli->prepare($sql);
    if ($types !== '') $stmt->bind_param($types, ...$vals);
    $stmt->execute();
    $res = $stmt->get_result();

    $items = [];
    while ($row = $res->fetch_assoc()) {
        $items[] = [
            'id'               => (int)$row['id'],
            'tip'              => $row['tip'],
            'titlu'            => $row['titlu'],
            'continut'         => $row['continut'],
            'important'        => (int)$row['important'],
            'publicat'         => (int)$row['publicat'],
            'created_at'       => $row['created_at'],
            'created_at_human' => ($row['created_at'] ? date('Y-m-d H:i', strtotime($row['created_at'])) : null),
            'updated_at'       => $row['updated_at'],
            'autor'            => $row['autor'],
            'unread'           => (bool)($row['unread'] ?? 0), // disponibil și pentru anunțuri
        ];
    }
    $stmt->close();

    echo json_encode([
        'success'   => true,
        'tab'       => $tab,
        'scope'     => ($tab === 'personale' ? ($isAdmin ? $scope : 'mine') : null),
        'q'         => $q,
        'unread'    => $unread,
        'important' => $important,
        'page'      => $page,
        'pages'     => $pages,
        'limit'     => $limit,
        'total'     => $total,
        // compat: atât 'items' (nou), cât și 'data' (vechi)
        'items'     => $items,
        'data'      => $items
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Eroare server: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
