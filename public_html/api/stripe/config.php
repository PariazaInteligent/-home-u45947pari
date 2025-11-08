<?php
// /api/stripe/config.php

// === Chei Stripe (LIVE) ===
const STRIPE_SECRET_KEY     = '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';
const STRIPE_WEBHOOK_SECRET = 'whsec_h83gs5KGd3C4MOZ7RnWKfTCanmcOVTmw';
const STRIPE_PUBLIC_KEY     = 'pk_live_51O442uLMPT8gUuC7BXrpkQCUBE2SahyaiHovarYnmiDIUh7OA3dqwSPlBDMZWjPrTAx8XpKT2F1qm07g8x5uwP3j00afKnZc6I';

// Comision platformă aplicat DOAR pe sume pozitive ale investitorului dintr-un pariu
const PLATFORM_FEE_PCT = 10.0; // exemplu: 10%


// Domeniul tău (fără / la final)
const APP_BASE_URL = 'https://pariazainteligent.ro';

// === Parametri taxă (estimare UI). În DB salvăm NET-ul real din Stripe (webhook). ===
const STRIPE_FEE_PCT   = 0.015; // 1.5% — aproximare pentru UI
const STRIPE_FEE_FIXED = 0.25;  // €0.25 — aproximare pentru UI

// === Logging local (pentru debug ușor) ===
const STRIPE_LOG_DIR = __DIR__ . '/_logs';

// Asigură folderul de log
if (!is_dir(STRIPE_LOG_DIR)) { @mkdir(STRIPE_LOG_DIR, 0775, true); }

/**
 * Scrie rapid în log (JSON Lines).
 */
function stripe_log(string $file, $data): void {
  $line = json_encode([
    'ts'   => date('c'),
    'data' => $data
  ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  @file_put_contents(STRIPE_LOG_DIR . '/' . $file, $line . PHP_EOL, FILE_APPEND);
}

/**
 * Helper: citește JSON din body. Returnează [] dacă nu e JSON valid.
 */
function json_input(): array {
  $raw = file_get_contents('php://input');
  $j = json_decode($raw, true);
  return (is_array($j) ? $j : []);
}

/**
 * Helper răspuns JSON + status code.
 */
function json_response(array $payload, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  exit;
}

/**
 * Conversii sume.
 */
function eur_to_cents($eur): int {
  return (int)round(((float)$eur) * 100);
}
function cents_to_eur($cents): float {
  return ((int)$cents) / 100.0;
}

/**
 * Calcul estimativ de fee pentru o sumă brută.
 */
function estimate_fee_on_gross(float $gross): float {
  return max(0.0, $gross * STRIPE_FEE_PCT + STRIPE_FEE_FIXED);
}

/**
 * Transformă NET dorit -> BRUT de încasat (estimare).
 * net = gross - (fixed + pct*gross) => gross*(1-pct) = net + fixed
 */
function gross_from_desired_net(float $net): float {
  return ($net + STRIPE_FEE_FIXED) / (1.0 - STRIPE_FEE_PCT);
}

/**
 * cURL simplu (fără Composer) pentru API Stripe.
 * Aruncă Exception pe HTTP >= 400, cu payloadul de eroare Stripe în mesaj.
 */
function stripe_request(string $method, string $path, array $payload = [], ?string $idemKey = null): array {
  $ch = curl_init('https://api.stripe.com/v1' . $path);
  $headers = ['Authorization: Bearer ' . STRIPE_SECRET_KEY];
  if ($idemKey) $headers[] = 'Idempotency-Key: ' . $idemKey;

  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_TIMEOUT        => 30,
  ]);

  $m = strtoupper($method);
  if ($m === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
  } elseif ($m === 'GET') {
    // no-op; path ar trebui să includă deja query string
  } else {
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $m);
    if (!empty($payload)) {
      curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    }
  }

  $res  = curl_exec($ch);
  $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  if ($res === false) {
    $err = curl_error($ch);
    curl_close($ch);
    stripe_log('curl_error.log', ['path'=>$path,'err'=>$err]);
    throw new Exception($err ?: 'cURL error');
  }
  curl_close($ch);

  $decoded = json_decode($res, true);
  if ($http >= 400) {
    // Stripe trimite {"error":{ type, message, ... }}
    $msg = is_array($decoded) && isset($decoded['error']['message'])
      ? $decoded['error']['message']
      : ("Stripe HTTP $http: " . $res);
    stripe_log('stripe_http_error.log', ['code'=>$http,'path'=>$path,'payload'=>$payload,'response'=>$decoded ?: $res]);
    throw new Exception($msg);
  }

  return is_array($decoded) ? $decoded : [];
}
