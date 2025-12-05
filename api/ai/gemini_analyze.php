<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
session_start();

function log_gemini_error(string $message, array $context = []): void
{
  $logFile = __DIR__ . '/logs/gemini_analyze.log';
  $line = '[' . date('Y-m-d H:i:s') . '] ' . $message;
  if (!empty($context)) {
    $line .= "\n" . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  }
  $line .= "\n" . str_repeat('-', 80) . "\n";
  file_put_contents($logFile, $line, FILE_APPEND);
}

function respond(array $payload): void
{
  http_response_code(200);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

/* ---------- UTIL ---------- */
function read_env_value(string $file, string $key): ?string
{
  if (!is_file($file))
    return null;
  foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $ln) {
    if ($ln[0] === '#')
      continue;
    $p = strpos($ln, '=');
    if ($p === false)
      continue;
    $k = trim(substr($ln, 0, $p));
    if (strcasecmp($k, $key) === 0)
      return trim(substr($ln, $p + 1));
  }
  return null;
}

function http_json(string $url, array $headers = [], $post = null, int $timeout = 15): array
{
  $hasCurl = function_exists('curl_init');
  $err = null;
  $code = 0;
  $raw = '';

  if ($hasCurl) {
    $ch = curl_init($url);
    $h = array_merge(['Accept: application/json'], $headers);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_TIMEOUT => $timeout,
      CURLOPT_HTTPHEADER => $h,
    ]);
    if ($post !== null) {
      curl_setopt($ch, CURLOPT_POST, true);
      $h[] = 'Content-Type: application/json';
      curl_setopt($ch, CURLOPT_HTTPHEADER, $h);
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post));
    }
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch) ?: null;
    curl_close($ch);
  } else {
    // fallback fără cURL
    $opts = [
      'http' => [
        'method' => $post === null ? 'GET' : 'POST',
        'timeout' => $timeout,
        'ignore_errors' => true,
        'header' => implode("\r\n", array_merge(['Accept: application/json'], $headers)),
      ]
    ];
    if ($post !== null) {
      $opts['http']['header'] .= "\r\nContent-Type: application/json";
      $opts['http']['content'] = json_encode($post);
    }
    $ctx = stream_context_create($opts);
    $raw = @file_get_contents($url, false, $ctx);
    if (isset($http_response_header[0]) && preg_match('~\s(\d{3})\s~', $http_response_header[0], $m))
      $code = (int) $m[1];
    else
      $code = $raw !== false ? 200 : 0;
  }
  return [$code, (string) $raw, $err];
}

/* ---------- INPUT ---------- */
$body = json_decode(file_get_contents('php://input') ?: '[]', true) ?: [];
$q = trim((string) ($body['q'] ?? ''));
if ($q === '')
  $q = 'Rezumat rapid al situației mele pe platformă.';

// Obține contextul trimis de frontend (dacă există)
$frontendContext = isset($body['context']) && is_array($body['context']) ? $body['context'] : null;

/* ---------- CHEIE API ---------- */
$envPath = __DIR__ . '/../config/.env';
// gemini 2.5 folosește în docuri v1beta
$API_VER = 'v1beta';

$key = read_env_value($envPath, 'GEMINI_API_KEY');
if (!$key) {
  respond(['ok' => false, 'answer' => 'Cheia API Gemini nu este configurată.', 'error' => 'missing_api_key']);
}

$userId = (int) ($_SESSION['user']['id'] ?? 0);
if (!$userId) {
  respond(['ok' => false, 'answer' => 'Trebuie să fii autentificat pentru a folosi acest serviciu.', 'error' => 'unauthorized']);
}
session_write_close();

require __DIR__ . '/../db.php';

function scalar_query(PDO $pdo, string $sql, array $params = []): int
{
  $st = $pdo->prepare($sql);
  $st->execute($params);
  $v = $st->fetchColumn();
  return (int) ($v === null ? 0 : $v);
}

try {
  // ---- global stats ----
  $total_deposits_cents = scalar_query(
    $pdo,
    "SELECT COALESCE(SUM(amount_cents),0) FROM investments WHERE user_id=:uid AND status='succeeded'",
    ['uid' => $userId]
  );
  $count_deposits = scalar_query(
    $pdo,
    "SELECT COUNT(*) FROM investments WHERE user_id=:uid AND status='succeeded'",
    ['uid' => $userId]
  );

  $total_withdrawals_cents = scalar_query(
    $pdo,
    "SELECT COALESCE(SUM(amount_cents + fee_cents),0) FROM withdrawal_requests WHERE user_id=:uid AND status='APPROVED'",
    ['uid' => $userId]
  );
  $count_withdrawals = scalar_query(
    $pdo,
    "SELECT COUNT(*) FROM withdrawal_requests WHERE user_id=:uid AND status='APPROVED'",
    ['uid' => $userId]
  );

  $pending_withdrawals_cents = scalar_query(
    $pdo,
    "SELECT COALESCE(SUM(amount_cents + fee_cents),0) FROM withdrawal_requests WHERE user_id=:uid AND status='PENDING'",
    ['uid' => $userId]
  );

  $net_profit_cents = scalar_query(
    $pdo,
    "SELECT COALESCE(SUM(amount_cents),0) FROM profit_distributions WHERE user_id=:uid",
    ['uid' => $userId]
  );

  $roi_total = $total_deposits_cents > 0
    ? ($net_profit_cents / $total_deposits_cents) * 100
    : 0.0;

  $current_balance_cents = ($total_deposits_cents + $net_profit_cents) - $total_withdrawals_cents - $pending_withdrawals_cents;
  if ($current_balance_cents < 0) {
    $current_balance_cents = 0;
  }

  // ---- transactions summary ----
  $profit_positive_cents = scalar_query(
    $pdo,
    "SELECT COALESCE(SUM(amount_cents),0) FROM profit_distributions WHERE user_id=:uid AND amount_cents > 0",
    ['uid' => $userId]
  );
  $profit_negative_cents = scalar_query(
    $pdo,
    "SELECT COALESCE(SUM(amount_cents),0) FROM profit_distributions WHERE user_id=:uid AND amount_cents < 0",
    ['uid' => $userId]
  );
  $count_profit = scalar_query(
    $pdo,
    "SELECT COUNT(*) FROM profit_distributions WHERE user_id=:uid AND amount_cents > 0",
    ['uid' => $userId]
  );
  $count_loss = scalar_query(
    $pdo,
    "SELECT COUNT(*) FROM profit_distributions WHERE user_id=:uid AND amount_cents < 0",
    ['uid' => $userId]
  );

  // ---- trades ----
  $tradesStmt = $pdo->prepare(
    "SELECT pd.created_at, pd.amount_cents, bg.event
     FROM profit_distributions pd
     LEFT JOIN bet_groups bg ON pd.bet_group_id = bg.id
     WHERE pd.user_id = :uid
     ORDER BY pd.created_at DESC
     LIMIT 15"
  );
  $tradesStmt->execute(['uid' => $userId]);
  $recent_trades = [];
  while ($row = $tradesStmt->fetch(PDO::FETCH_ASSOC)) {
    $amt = (int) $row['amount_cents'];
    $type = $amt >= 0 ? 'profit' : 'pierdere';
    $recent_trades[] = [
      'datetime' => $row['created_at'],
      'type' => $type,
      'amount' => round(abs($amt) / 100, 2),
      'event' => $row['event'] ?? '',
    ];
  }

  $last_trade = null;
  if (!empty($recent_trades)) {
    $last_trade = $recent_trades[0];
  }

  $modelData = [
    'global_stats' => [
      'total_deposits' => round($total_deposits_cents / 100, 2),
      'count_deposits' => $count_deposits,
      'total_withdrawals' => round($total_withdrawals_cents / 100, 2),
      'count_withdrawals' => $count_withdrawals,
      'net_profit' => round($net_profit_cents / 100, 2),
      'roi_total' => round($roi_total, 2),
      'current_balance' => round($current_balance_cents / 100, 2),
    ],
    'transactions_summary' => [
      'by_type' => [
        'depunere' => [
          'count' => $count_deposits,
          'sum' => round($total_deposits_cents / 100, 2),
        ],
        'retragere' => [
          'count' => $count_withdrawals,
          'sum' => round($total_withdrawals_cents / 100, 2),
        ],
        'profit' => [
          'count' => $count_profit,
          'sum' => round($profit_positive_cents / 100, 2),
        ],
        'pierdere' => [
          'count' => $count_loss,
          'sum' => round(abs($profit_negative_cents) / 100, 2),
        ],
      ],
    ],
    'last_trade' => $last_trade,
    'recent_trades' => $recent_trades,
  ];

  if ($frontendContext !== null) {
    $modelData['frontend_context'] = $frontendContext;
  }
} catch (Throwable $e) {
  log_gemini_error('db_error', ['message' => $e->getMessage()]);
  respond(['ok' => false, 'answer' => 'Nu s-au putut încărca datele necesare pentru analiză. Te rugăm să încerci din nou.', 'error' => 'db_error']);
}

/* ---------- PROMPT ---------- */
$systemPrompt = <<<TXT
Ești modulul „Analiză Avansată Gemini" pentru platforma Pariază Inteligent.
Primești întotdeauna un obiect JSON cu:
- global_stats: depuneri, retrageri, profit net, ROI, sold curent, număr investitori etc.
- transactions_summary: sumar pe tipuri (depuneri, retrageri, profit, pierderi).
- last_trade: ultimul trade cu data, tip, sumă și nume eveniment (echipele).
- recent_trades: lista ultimelor tranzacții de tip profit/pierdere.

Rolul tău este să răspunzi la întrebări ale investitorului despre:
- Ce depuneri are (număr și sumă totală)
- Câte retrageri a făcut și în ce valoare
- Ce profit total a obținut până acum
- Sold curent, randament, evoluția generală
- Ultimul trade și trade-urile recente (echipe, dată, profit/pierdere)
- Comparații pe perioade, dacă sunt disponibile în JSON.

REGULI:
- Folosește DOAR datele din JSON-ul primit. Nu inventa sume, date sau evenimente.
- Dacă o informație lipsește din JSON, spune direct „nu există această informație în datele primite", nu „nu am primit un răspuns valid".
- Răspunde mereu în limba română, clar și concis, în 2–5 fraze.
- Când utilizatorul întreabă:
  - „ce depuneri am?" → răspunzi cu numărul de depuneri și suma totală (ex.: „Ai 5 depuneri, în valoare totală de 1.250 EUR").
  - „câte retrageri am făcut și în valoare de cât?" → număr retrageri + suma totală.
  - „cât profit am obținut până în prezent?" → profitul net all time.
  - „care sunt echipele implicate în ultimul trade și ce profit am făcut?" → folosești câmpul last_trade (event + amount + data).
TXT;

$promptData = json_encode($modelData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

// Construim mesajul complet: system prompt + context + întrebarea investitorului
$fullPrompt = $systemPrompt . "\n\n---\n\nDATE DE CONTEXT (JSON):\n" . $promptData . "\n\n---\n\nÎNTREBARE INVESTITOR:\n" . $q;

// Payload corect pentru API-ul Gemini (v1beta/generateContent)
// IMPORTANT: Nu folosim systemInstruction pentru că nu este suportat în v1beta
// În schimb, combinăm totul într-un singur mesaj de tip user
$payload = [
  'contents' => [
    [
      'role' => 'user',
      'parts' => [
        ['text' => $fullPrompt],
      ],
    ],
  ],
  'generationConfig' => [
    'temperature' => 0.4,
    'topP' => 0.9,
    'maxOutputTokens' => 1024,
  ],
];

/* ---------- GEMINI CALL (cu fallback) ---------- */
$models = [
  'gemini-1.5-flash',      // model stabil și rapid
  'gemini-1.5-pro',        // fallback mai puternic
];

$gc = 0;
$gr = '';
$ge = null;
$usedModel = null;

foreach ($models as $m) {
  $endpoint = "https://generativelanguage.googleapis.com/{$API_VER}/models/{$m}:generateContent";

  list($gc, $gr, $ge) = http_json(
    $endpoint,
    ["x-goog-api-key: {$key}"],
    $payload,
    20
  );

  if ($gc === 200) {
    $usedModel = $m;
    break;
  }

  // Dacă nu e 404 (model inexistent), oprim încercările
  if ($gc !== 404) {
    break;
  }
}

// Tratăm erorile HTTP
if ($gc !== 200) {
  $errorBody = substr((string) $gr, 0, 2000);
  log_gemini_error('gemini_http_error', [
    'status' => $gc,
    'body' => $errorBody,
    'curl_err' => $ge,
    'payload_sent' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
  ]);

  $userMessage = 'Momentan există o problemă tehnică cu serviciul de analiză AI. Echipa noastră a fost notificată și lucrează la rezolvare.';

  if ($gc === 400) {
    $userMessage = 'Formatul cererii către AI este incorect. Am înregistrat eroarea pentru investigare.';
  } elseif ($gc === 401 || $gc === 403) {
    $userMessage = 'Există o problemă cu autentificarea serviciului AI. Te rugăm să contactezi suportul tehnic.';
  } elseif ($gc === 429) {
    $userMessage = 'Am atins limita de cereri către serviciul AI. Te rugăm să încerci din nou în câteva minute.';
  } elseif ($gc >= 500) {
    $userMessage = 'Serviciul AI este temporar indisponibil. Te rugăm să încerci din nou în câteva momente.';
  }

  respond([
    'ok' => false,
    'answer' => $userMessage,
    'error' => "gemini_http_{$gc}",
  ]);
}

$resp = json_decode($gr, true);

// Încercăm să extragem primul text non-gol din candidați
$text = '';

if (isset($resp['candidates']) && is_array($resp['candidates'])) {
  foreach ($resp['candidates'] as $cand) {
    if (empty($cand['content']['parts']) || !is_array($cand['content']['parts'])) {
      continue;
    }
    foreach ($cand['content']['parts'] as $part) {
      if (isset($part['text']) && trim($part['text']) !== '') {
        $text = trim($part['text']);
        break 2; // ieșim din ambele foreach-uri
      }
    }
  }
}

// Dacă modelul a blocat răspunsul (safety), trimitem eroare clară
if ($text === '' && isset($resp['promptFeedback']['blockReason'])) {
  log_gemini_error('gemini_blocked', ['feedback' => $resp['promptFeedback']]);
  respond([
    'ok' => false,
    'answer' => 'Cererea ta a fost blocată de filtrul de siguranță al AI-ului. Te rugăm să reformulezi întrebarea.',
    'error' => 'gemini_blocked',
  ]);
}

// Dacă tot nu avem text, considerăm răspuns gol și dăm detalii pentru debug
if ($text === '') {
  log_gemini_error('gemini_empty_response', ['body' => substr((string) $gr, 0, 2000)]);
  respond([
    'ok' => false,
    'answer' => 'AI-ul nu a putut genera un răspuns. Te rugăm să încerci din nou cu o altă întrebare.',
    'error' => 'gemini_empty_response',
  ]);
}

respond([
  'ok' => true,
  'answer' => $text,
  'error' => null,
  'model' => $usedModel,
]);
