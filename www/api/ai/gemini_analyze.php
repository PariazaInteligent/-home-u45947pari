<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
session_start();

/* ---------- UTIL ---------- */
function read_env_value(string $file, string $key): ?string {
  if (!is_file($file)) return null;
  foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $ln) {
    if ($ln[0]==='#') continue;
    $p = strpos($ln, '=');
    if ($p===false) continue;
    $k = trim(substr($ln, 0, $p));
    if (strcasecmp($k,$key)===0) return trim(substr($ln, $p+1));
  }
  return null;
}

function http_json(string $url, array $headers=[], $post=null, int $timeout=15): array {
  $hasCurl = function_exists('curl_init');
  $err = null; $code = 0; $raw = '';

  if ($hasCurl) {
    $ch = curl_init($url);
    $h  = array_merge(['Accept: application/json'], $headers);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_TIMEOUT        => $timeout,
      CURLOPT_HTTPHEADER     => $h,
    ]);
    if ($post !== null) {
      curl_setopt($ch, CURLOPT_POST, true);
      $h[] = 'Content-Type: application/json';
      curl_setopt($ch, CURLOPT_HTTPHEADER, $h);
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post));
    }
    $raw  = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err  = curl_error($ch) ?: null;
    curl_close($ch);
  } else {
    // fallback fără cURL
    $opts = [
      'http' => [
        'method'  => $post===null ? 'GET' : 'POST',
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
      $code = (int)$m[1];
    else
      $code = $raw!==false ? 200 : 0;
  }
  return [$code, (string)$raw, $err];
}

/* ---------- INPUT ---------- */
$body = json_decode(file_get_contents('php://input') ?: '[]', true) ?: [];
$q    = trim((string)($body['q'] ?? ''));
if ($q==='') $q = 'Rezumat rapid al situației mele pe platformă.';

/* ---------- CHEIE API ---------- */
$envPath = __DIR__ . '/../config/.env';
$API_VER = 'v1'; // NU v1beta

$key     = read_env_value($envPath, 'GEMINI_API_KEY');
if (!$key) {
  http_response_code(503);
  echo json_encode(['ok'=>false,'error'=>'missing_api_key','.env'=>$envPath]); exit;
}

/* ---------- CONTEXT (opțional; nu blocăm dacă pică) ---------- */
$cookieHdr = 'Cookie: PHPSESSID=' . session_id();
$ctx = ['stage'=>'context','today'=>null,'all'=>null,'avgProc'=>null];

list($c1,$r1) = http_json('https://pariazainteligent.ro/api/user/summary.php?range=today', [$cookieHdr]);
if ($c1===200 && ($j=json_decode($r1,true)) && !empty($j['ok'])) $ctx['today']=$j;

list($c2,$r2) = http_json('https://pariazainteligent.ro/api/user/summary.php?range=all', [$cookieHdr]);
if ($c2===200 && ($k=json_decode($r2,true)) && !empty($k['ok'])) $ctx['all']=$k;

list($c3,$r3) = http_json('https://pariazainteligent.ro/api/user/withdrawals/processing_stats.php', [$cookieHdr]);
if ($c3===200 && ($m=json_decode($r3,true)) && !empty($m['ok'])) $ctx['avgProc']=$m;

/* ---------- PROMPT ---------- */
$prompt = "Ești Lumen AI, asistent financiar pentru platforma Pariază Inteligent. "
        . "Primești CONTEXT JSON (date actuale ale utilizatorului) și ÎNTREBARE. "
        . "Răspunde în română, concis, cu bullet-uri când e util, fără promisiuni/garanții.\n\n"
        . "=== CONTEXT JSON ===\n"
        . json_encode($ctx, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)
        . "\n\n=== ÎNTREBARE ===\n"
        . $q;

/* ---------- GEMINI CALL (cu fallback) ---------- */
$models = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-001',
  'gemini-1.5-flash',
  'gemini-1.0-pro',
];

$payload = [
  'contents' => [[ 'role'=>'user', 'parts'=>[['text'=>$prompt]] ]],
  'generationConfig' => ['temperature'=>0.4, 'topP'=>0.9, 'maxOutputTokens'=>512],
];

$gc=0; $gr=''; $ge=null; $usedModel=null;
foreach ($models as $m) {
  $endpoint = "https://generativelanguage.googleapis.com/{$API_VER}/models/{$m}:generateContent?key={$key}";
  list($gc,$gr,$ge) = http_json($endpoint, [], $payload, 20);
  if ($gc === 200) { $usedModel = $m; break; }
  if ($gc !== 404) break;
}

if ($gc !== 200) {
  http_response_code(502);
  echo json_encode(['ok'=>false,'error'=>"gemini_http_{$gc}",'curl_error'=>$ge,'raw'=>$gr?substr($gr,0,800):null], JSON_UNESCAPED_UNICODE);
  exit;
}

$resp = json_decode($gr,true);
$text = $resp['candidates'][0]['content']['parts'][0]['text'] ?? '';
if ($text==='') $text = 'Nu am putut genera un răspuns util în acest moment.';

echo json_encode(['ok'=>true,'model'=>$usedModel,'text'=>$text], JSON_UNESCAPED_UNICODE);
