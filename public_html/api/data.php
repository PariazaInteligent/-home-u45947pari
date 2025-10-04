<?php
// --- CONFIG ---
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');

$DB_HOST = 'localhost';
$DB_NAME = 'u54947pari_pariaza_inteligent';   // <- înlocuiește cu numele tău exact
$DB_USER = 'u45947pari_admin_pariaza';                     // <- utilizator MySQL
$DB_PASS = '3DSecurity31';                   // <- parola MySQL
$DSN = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";

// --- HELPERS ---
function send_json($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function safe_json_decode($s) {
  if ($s === null) return null;
  $s = trim((string)$s);
  if ($s === '') return null;
  $x = json_decode($s, true);
  return (json_last_error() === JSON_ERROR_NONE) ? $x : ['raw' => $s];
}

try {
  $pdo = new PDO($DSN, $DB_USER, $DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
} catch (Throwable $e) {
  send_json(['error' => 'DB_CONNECT_ERROR', 'message' => $e->getMessage()], 500);
}

$endpoint = $_GET['endpoint'] ?? '';

try {
  switch ($endpoint) {
    case 'users': {
      // Adaptează la structura ta de tabel `users`
      $sql = "SELECT 
                id, email, name, avatar, role, 
                is_active AS isActive, 
                is_global_admin AS isGlobalAdmin,
                profile_data
              FROM users";
      $rows = $pdo->query($sql)->fetchAll();

      $out = array_map(function($r) {
        return [
          'id'            => (string)$r['id'],
          'email'         => (string)($r['email'] ?? ''),
          'name'          => (string)($r['name'] ?? 'Utilizator'),
          'avatar'        => $r['avatar'] ?? null,
          'role'          => (string)($r['role'] ?? 'USER'),
          'isActive'      => (bool)($r['isActive'] ?? true),
          'isGlobalAdmin' => (bool)($r['isGlobalAdmin'] ?? false),
          // dacă ai JSON în coloana profile_data
          'profileData'   => safe_json_decode($r['profile_data'] ?? null) ?? new stdClass(),
        ];
      }, $rows);

      send_json($out);
    }

    case 'transactions': {
      // Tabelul tău `transactions` din screenshot
      $sql = "SELECT id, timestamp, user_id, admin_id, type, status, amount, description, details
              FROM transactions
              ORDER BY timestamp DESC
              LIMIT 500";
      $rows = $pdo->query($sql)->fetchAll();

      $out = array_map(function($r) {
        return [
          'id'          => (string)$r['id'],
          'timestamp'   => date('c', strtotime($r['timestamp'] ?? 'now')),
          'userId'      => isset($r['user_id'])  ? (string)$r['user_id']  : null,
          'adminId'     => isset($r['admin_id']) ? (string)$r['admin_id'] : null,
          'type'        => (string)($r['type'] ?? 'ADMIN_ACTION'),
          'status'      => (string)($r['status'] ?? 'COMPLETED'),
          'amount'      => isset($r['amount']) ? floatval($r['amount']) : null,
          'description' => $r['description'] ?? null,
          // `details` poate conține JSON sau poate fi NULL
          'details'     => safe_json_decode($r['details'] ?? null),
        ];
      }, $rows);

      send_json($out);
    }

    // Endpoints pe care le cere frontend-ul tău — întoarce obiecte/tablouri valide chiar dacă sunt goale:
    case 'globalStats':
      // opțional: calcule rapide, ca să eviți fallback-ul demo
      $sum = $pdo->query("SELECT COALESCE(SUM(amount),0) AS s 
                          FROM transactions 
                          WHERE type='INVESTMENT_APPROVAL' AND status='COMPLETED'")->fetch()['s'] ?? 0;
      $investors = $pdo->query("SELECT COUNT(DISTINCT user_id) AS c 
                                FROM transactions 
                                WHERE type='INVESTMENT_APPROVAL' AND status='COMPLETED'")->fetch()['c'] ?? 0;
      send_json([
        'totalInvested'          => floatval($sum),
        'totalProfitDistributed' => 0,
        'activeInvestors'        => intval($investors),
      ]);

    case 'dailyHistory':        send_json([]);  // dacă nu ai tabel, întoarce gol
    case 'announcements':       send_json([]);
    case 'userMessages':        send_json([]);
    case 'investmentAlerts':    send_json([]);
    case 'feedback':            send_json([]);
    case 'platformSettings':    send_json([]);  // dacă nu-l folosești, gol
    case 'referrals':           send_json([]);
    case 'calendarEvents':      send_json([]);
    case 'investmentGoals':     send_json([]);
    case 'bets':                send_json([]);

    default:
      send_json(['error' => 'UNKNOWN_ENDPOINT'], 400);
  }
} catch (Throwable $e) {
  send_json(['error' => 'UNHANDLED_EXCEPTION', 'message' => $e->getMessage()], 500);
}
