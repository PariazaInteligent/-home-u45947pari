<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
session_start();

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
  http_response_code(503);
  echo json_encode(['ok' => false, 'error' => 'missing_api_key', '.env' => $envPath]);
  exit;
}

/* ---------- CONTEXT ---------- */
$ctx = ['stage' => 'context'];

// Dacă avem context de la frontend, îl folosim
if ($frontendContext !== null) {
  $ctx['investor_data'] = $frontendContext;

  // Adăugăm descriere umană pentru perioada
  $range = $frontendContext['range'] ?? 'all';
  switch ($range) {
    case 'today':
      $rangeLabel = 'doar ziua de azi';
      break;
    case '7d':
      $rangeLabel = 'ultimele 7 zile';
      break;
    case '30d':
      $rangeLabel = 'ultima lună';
      break;
    default:
      $rangeLabel = 'toată perioada (de la început)';
  }
  $ctx['period_description'] = "Datele sunt filtrate pentru: {$rangeLabel}";


} else {
  // Fallback: încercăm să obținem datele direct (comportament vechi)
  $cookieHdr = 'Cookie: PHPSESSID=' . session_id();

  list($c1, $r1) = http_json('https://pariazainteligent.ro/api/user/summary.php?range=today', [$cookieHdr]);
  if ($c1 === 200 && ($j = json_decode($r1, true)) && !empty($j['ok']))
    $ctx['today'] = $j;

  list($c2, $r2) = http_json('https://pariazainteligent.ro/api/user/summary.php?range=all', [$cookieHdr]);
  if ($c2 === 200 && ($k = json_decode($r2, true)) && !empty($k['ok']))
    $ctx['all'] = $k;

  list($c3, $r3) = http_json('https://pariazainteligent.ro/api/user/withdrawals/processing_stats.php', [$cookieHdr]);
  if ($c3 === 200 && ($m = json_decode($r3, true)) && !empty($m['ok']))
    $ctx['avgProc'] = $m;
}

/* ---------- PROMPT ---------- */
$systemPrompt = <<<TXT
ești „analiză avansată gemini” pentru platforma pariază inteligent.
primești întotdeauna un obiect json cu:
- global_stats: total depuneri, total retrageri, profit net, roi, sold curent, număr investitori etc.
- period_stats: statistici pe ultimele 7 zile, 30 de zile și all time.
- last_trade: ultimul trade cu data, tip (profit sau pierdere), sumă și numele evenimentului (echipele).
- recent_trades: lista ultimelor tranzacții de tip profit/pierdere.
- transactions_summary: depuneri, retrageri, profit, pierderi – număr și sumă totală pentru fiecare tip.

rolul tău este să răspunzi la întrebări ale investitorului despre:
- ce depuneri are (număr și sumă totală)
- câte retrageri a făcut și în ce valoare
- ce profit total a obținut până acum
- sold curent, randament, evoluția generală
- ultimul trade și trade-urile recente (echipe, dată, profit/pierdere)
- comparații pe perioade (ultimele 7 zile, ultimele 30 de zile, all time)

reguli:
- folosește întotdeauna DOAR datele primite în json. nu inventa sume, date sau evenimente.
- dacă o informație lipsește din json, spune direct că nu există în datele trimise, nu că „nu ai primit un răspuns valid”.
- răspunde în limba română, clar și concis, în 2–5 fraze.
- când investitorul întreabă:
  - „ce depuneri am?” → răspunzi cu numărul de depuneri și suma totală a acestora (ex: „ai 5 depuneri, în valoare totală de 1.250 eur”).
  - „cate retrageri am facut si in valoare de cat?” → răspunzi cu numărul de retrageri și suma totală (ex: „ai făcut 3 retrageri, în total 400 eur”).
  - „cat profit am obtinut pana in prezent?” → răspunzi cu profitul net all time (ex: „profitul tău net până acum este de 327 eur”).
  - „care este ultimul trade?” sau „care sunt echipele implicate in ultimul trade si ce profit am facut?” → folosești câmpul last_trade (event + amount + data).
- dacă întrebarea conține termeni din afara domeniului (politică, viață personală etc.), spune politicos că răspunzi doar pe baza datelor financiare și de tranzacții.

TXT;

$prompt = "Context investitor (JSON):\n"
  . json_encode($ctx, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
  . "\n\nÎntrebarea investitorului: " . $q;


/* ---------- GEMINI CALL (cu fallback) ---------- */
$models = [
  'gemini-2.5-flash',      // default: rapid + ieftin
  'gemini-2.5-flash-lite', // fallback mai ieftin
  'gemini-2.5-pro',        // fallback mai „deștept”
];


$payload = [
    'systemInstruction' => [
    'parts' => [
      ['text' => $systemPrompt]
    ]
  ],
  'contents' => [
    [
      'parts' => [
        ['text' => $prompt],
      ],
    ],
  ],
  'generationConfig' => [
    'temperature' => 0.4,
    'topP' => 0.9,
    // îi dăm mai mult loc de răspuns textual
    'maxOutputTokens' => 1024,
    // dezactivăm thinking-ul care mănâncă tot bugetul
    'thinkingConfig' => [
      'thinkingBudget' => 0,
    ],
  ],

];


$gc = 0;
$gr = '';
$ge = null;
$usedModel = null;
foreach ($models as $m) {
  $endpoint = "https://generativelanguage.googleapis.com/{$API_VER}/models/{$m}:generateContent";

  // cheie în header, cum cere docul actual
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

  // dacă nu e 404 (model inexistent), nu mai are sens să încercăm altele
  if ($gc !== 404) {
    break;
  }
}

if ($gc !== 200) {
  http_response_code(502);
  echo json_encode([
    'ok' => false,
    'error' => "gemini_http_{$gc}",
    'detail' => $gr ? substr($gr, 0, 800) : null,
  ], JSON_UNESCAPED_UNICODE);
  exit;
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
  http_response_code(502);
  echo json_encode([
    'ok' => false,
    'error' => 'gemini_blocked',
    'detail' => $resp['promptFeedback'],
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

// dacă tot nu avem text, considerăm răspuns gol și dăm detalii pentru debug
if ($text === '') {
  http_response_code(502);
  echo json_encode([
    'ok' => false,
    'error' => 'gemini_empty_response',
    'detail' => substr($gr ?? '', 0, 800),
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

// succes: trimitem textul către frontend
echo json_encode([
  'ok' => true,
  'model' => $usedModel,
  'text' => $text,
], JSON_UNESCAPED_UNICODE);
