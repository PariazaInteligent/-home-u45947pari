<?php
// /api/passkeys/finish-assertion.php


declare(strict_types=1);
require_once __DIR__ . '/util.php';


require_method('POST');


$raw = file_get_contents('php://input');
$req = json_decode($raw, true);
if (!$req) json_out(['ok'=>false,'err'=>'bad_json'], 400);


$db = $mysqli; // din db.php
$server = webauthn_server();
$challenge = $_SESSION['webauthn.challenge.get'] ?? null;
if (!$challenge) json_out(['ok'=>false,'err'=>'no_challenge'], 400);


// payload din navigator.credentials.get()
$id = (string)($req['id'] ?? '');
$rawId = b64u_dec((string)($req['rawId'] ?? ''));
$cdj = b64u_dec((string)($req['response']['clientDataJSON'] ?? ''));
$authData = b64u_dec((string)($req['response']['authenticatorData'] ?? ''));
$sig = b64u_dec((string)($req['response']['signature'] ?? ''));
$userHandle = isset($req['response']['userHandle']) && $req['response']['userHandle'] !== null
? b64u_dec((string)$req['response']['userHandle'])
: '';


// Căutăm credențialul în DB
if (!$u = find_user_by_credential_id($db, $rawId)) {
// Dacă e „discoverable” și a venit userHandle, îl putem folosi ca fallback — găsim user by handle
if ($userHandle !== '') {
$stmt = $db->prepare('SELECT id,email,role,user_handle FROM users WHERE user_handle=? LIMIT 1');
$stmt->bind_param('s', $userHandle);
$stmt->execute();
$res = $stmt->get_result();
$u = $res->fetch_assoc() ?: null;
}
}


if (!$u) json_out(['ok'=>false,'err'=>'credential_not_found'], 404);


// Luăm cheia publică + sign_count
$stmt = $db->prepare('SELECT public_key, sign_count FROM webauthn_credentials WHERE user_id=? AND credential_id=? LIMIT 1');
$stmt->bind_param('is', $u['id'], $rawId);
$stmt->execute();
$res = $stmt->get_result();
$cred = $res->fetch_assoc();
if (!$cred) json_out(['ok'=>false,'err'=>'cred_mismatch'], 400);


try {
$data = $server->processGet(
new ByteBuffer($cdj),
new ByteBuffer($authData),
new ByteBuffer($sig),
new ByteBuffer($cred['public_key']),
new ByteBuffer($rawId),
new ByteBuffer($challenge),
USER_VERIFICATION,
}