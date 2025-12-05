<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
session_start();
function log_gemini_error(string $message, array $context = []): void
{
  $logFile = __DIR__ . '/gemini_analyze.log';
  $line = date('c') . ' ' . $message;
  if (!empty($context)) {
    $line .= ' ' . json_encode($context, JSON_UNESCAPED_UNICODE);
  }
  file_put_contents($logFile, $line . "\n", FILE_APPEND);
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
  respond(['ok' => false, 'answer' => null, 'error' => 'missing_api_key']);
}

$userId = (int) ($_SESSION['user']['id'] ?? 0);
if (!$userId) {
  respond(['ok' => false, 'answer' => null, 'error' => 'unauthorized']);
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
  respond(['ok' => false, 'answer' => null, 'error' => 'db_error']);
}

/* ---------- PROMPT ---------- */
$systemPrompt = <<<TXT
ești modulul „analiză avansată gemini” pentru platforma pariază inteligent.
primești întotdeauna un obiect json cu:
- global_stats: depuneri, retrageri, profit net, roi, sold curent, număr investitori etc.
- transactions_summary: sumar pe tipuri (depuneri, retrageri, profit, pierderi).
- last_trade: ultimul trade cu data, tip, sumă și nume eveniment (echipele).
- recent_trades: lista ultimelor tranzacții de tip profit/pierdere.


rolul tău este să răspunzi la întrebări ale investitorului despre:
- ce depuneri are (număr și sumă totală)
- câte retrageri a făcut și în ce valoare
- ce profit total a obținut până acum
- sold curent, randament, evoluția generală
- ultimul trade și trade-urile recente (echipe, dată, profit/pierdere)
- comparații pe perioade, dacă sunt disponibile în json.

reguli:
- folosește DOAR datele din jsonul primit. nu inventa sume, date sau evenimente.
- dacă o informație lipsește din json, spune direct „nu există această informație în datele primite”, nu „nu am primit un răspuns valid”.
- răspunde mereu în limba română, clar și concis, în 2–5 fraze.
- când utilizatorul întreabă:
  - „ce depuneri am?” → răspunzi cu numărul de depuneri și suma totală (ex.: „ai 5 depuneri, în valoare totală de 1.250 eur”).
  - „cate retrageri am facut si in valoare de cat?” → număr retrageri + suma totală.
  - „cat profit am obtinut pana in prezent?” → profitul net all time.
  - „care sunt echipele implicate in ultimul trade si ce profit am facut?” → folosești câmpul last_trade (event + amount + data).

TXT;

$promptData = json_encode($modelData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);


$payload = [
'systemInstruction' => [
    'parts' => [
      ['text' => $systemPrompt],
    ],
  ],
  'contents' => [
    [
         'role' => 'user',
      'parts' => [
        ['text' => "Context de date (JSON):\n{$promptData}"],
      ],
    ],
    [
      'role' => 'user',
      'parts' => [
        ['text' => "Întrebarea investitorului: {$q}"],
      ],
    ],
  ],
  'generationConfig' => [
    'temperature' => 0.4,
    'topP' => 0.9,
    
    'maxOutputTokens' => 1024,
    
    'thinkingConfig' => [
      'thinkingBudget' => 0,
    ],
  ],
];

/* ---------- GEMINI CALL (cu fallback) ---------- */
$models = [
  'gemini-2.5-flash',      // default: rapid + ieftin
  'gemini-2.5-flash-lite', // fallback mai ieftin
  'gemini-2.5-pro',        // fallback mai „deștept”
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

  if ($gc !== 404) {
    break;
  }
}

if ($gc !== 200) {
  log_gemini_error('gemini_http_error', ['status' => $gc, 'body' => substr((string) $gr, 0, 800), 'curl_err' => $ge]);
  respond([
    'ok' => false,
    'answer' => null,
    'error' => "gemini_http_{$gc}",
     ]);
}

$resp = json_decode($gr, true);

// încercăm să extragem primul text non-gol din candidați
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

// dacă modelul a blocat răspunsul (safety), trimitem eroare clară
if ($text === '' && isset($resp['promptFeedback']['blockReason'])) {
 log_gemini_error('gemini_blocked', ['feedback' => $resp['promptFeedback']]);
  respond([
    'ok' => false,
    'answer' => null,
    'error' => 'gemini_blocked',
     ]);
}

// dacă tot nu avem text, considerăm răspuns gol și dăm detalii pentru debug
if ($text === '') {
 log_gemini_error('gemini_empty_response', ['body' => substr((string) $gr, 0, 800)]);
  respond([
    'ok' => false,
    'answer' => null,
    'error' => 'gemini_empty_response',
    ]);
}

respond([
  'ok' => true,
  'answer' => $text,
  'error' => null,
  'model' => $usedModel,
]);
