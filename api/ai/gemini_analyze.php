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
$basePrompt = <<<TXT
Ești Lumen AI, asistent financiar conversațional pentru platforma Pariază Inteligent.

Contextul în care lucrezi:
- Utilizatorul este INVESTITOR, nu parior. Pariurile sunt plasate exclusiv de administratori.
- Investitorul poate doar: depune bani, crește/scade investiția, retrage fonduri.
- Primești un CONTEXT JSON cu date FILTRATE pentru o perioadă specifică (vezi câmpurile "range" și "period_description").
- Ai acces la "last_trade" (ultima tranzacție/profit/pierdere, cu data/ora, eveniment/echipe și sumă cu semn) și la lista "recent_transactions". Folosește-le pentru a răspunde la întrebări despre ultimul meci sau ultimele rezultate.

IMPORTANT - Stilul tău de răspuns:
- Răspunde DIRECT și CONCIS la întrebarea investitorului. Nu urmări un template fix!
- Dacă întrebarea e simplă ("Cât profit am făcut?"), răspunde în 1-3 propoziții scurte cu cifra exactă și context minimal.
- Dacă întrebarea e complexă ("De ce a scăzut balanța?"), oferă explicația cauzală în 3-5 bullet-uri.
- NU oferi informații nesolicitate. Investitorul întreabă ce vrea să știe; dacă vrea mai mult, va întreba din nou.
- Fii UMAN și conversațional, nu robotic. Vorbește ca un analist prietenos care își respectă timpul clientului.

Reguli de conținut:
- NU cere date suplimentare și NU te plânge că "lipsesc informații". Lucrează cu ce ai.
- NU da recomandări despre plasarea pariurilor (mize, cote, bilete, stake plan, stop-loss).
- Recomandările pot fi DOAR la nivel de investitor: capital investit, risc, orizont de timp, frecvență retrageri/depuneri.
- Răspunzi în română, clar, fără promisiuni sau garanții.
- Dacă utilizatorul întreabă despre "ultimul meci" sau "ultima tranzacție", folosește direct câmpurile din "last_trade" (event/echipe, amount cu semn, type, data/ora).

Formatare:
- Folosește rânduri noi între idei pentru lizibilitate.
- Bold (** **) doar pentru 2-3 cifre sau concepte cheie esențiale (profit, creștere %, perioadă).
- Dacă răspunsul tău are mai mult de 5 bullet-uri, probabil oferi prea multe informații nesolicitate - revizuiește!

ATENȚIE: Citește cu atenție întrebarea investitorului și răspunde STRICT la ea, nu urmări un șablon predefinit!
TXT;

$prompt =
  $basePrompt
  . "\n\n=== CONTEXT JSON ===\n"
  . json_encode($ctx, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
  . "\n\n=== ÎNTREBAREA INVESTITORULUI ===\n"
  . $q;


/* ---------- GEMINI CALL (cu fallback) ---------- */
$models = [
  'gemini-2.5-flash',      // default: rapid + ieftin
  'gemini-2.5-flash-lite', // fallback mai ieftin
  'gemini-2.5-pro',        // fallback mai „deștept”
];


$payload = [
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
