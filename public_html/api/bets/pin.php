<?php
// /api/bets/pin.php
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['user'])) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'err'=>'auth']);
  exit;
}

$user_id = $_SESSION['user']['id'] ?? 0;
if (!$user_id) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'err'=>'auth']);
  exit;
}

// citim JSON din body
$raw = file_get_contents('php://input');
$in = json_decode($raw, true) ?: [];

$bet_group_id = isset($in['bet_group_id']) ? (int)$in['bet_group_id'] : 0;
$wantPinned   = !empty($in['pinned']); // true / false

if ($bet_group_id <= 0) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'err'=>'bad_id']);
  exit;
}

require __DIR__ . '/../db.php';

try {
  if ($wantPinned) {
    // îl adăugăm ca favorit (INSERT IGNORE ca să nu explodeze dacă există deja)
    $stmt = $pdo->prepare("
      INSERT IGNORE INTO user_bet_pins (user_id, bet_group_id, created_at)
      VALUES (?, ?, NOW())
    ");
    $stmt->execute([$user_id, $bet_group_id]);
  } else {
    // îl scoatem din favorite
    $stmt = $pdo->prepare("
      DELETE FROM user_bet_pins
      WHERE user_id = ? AND bet_group_id = ?
    ");
    $stmt->execute([$user_id, $bet_group_id]);
  }

  echo json_encode([
    'ok'     => true,
    'pinned' => $wantPinned
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'err'=>'db']);
}
