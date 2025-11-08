<?php
header('Content-Type: application/json; charset=utf-8');
try {
  $pdo = new PDO(
    'mysql:host=localhost;dbname=u54947pari_pariaza_inteligent;charset=utf8mb4',
    'u54947pari_api3',
    'ApiX_2233!',
    [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
  );
  $ok = (int)$pdo->query('SELECT 1 AS ok')->fetch()['ok'];
  $n  = (int)$pdo->query('SELECT COUNT(*) AS n FROM transactions')->fetch()['n'];
  echo json_encode(['ok'=>$ok,'transactions'=>$n]); exit;
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error'=>$e->getMessage()]);
}
