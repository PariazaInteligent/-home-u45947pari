<?php
// /api/passkeys/finish-attestation.php


declare(strict_types=1);
require_once __DIR__ . '/util.php';


require_method('POST');
if (empty($_SESSION['user']['id'])) json_out(['ok'=>false,'err'=>'unauth'], 401);


$db = $mysqli;
$server = webauthn_server();
$challenge = $_SESSION['webauthn.challenge.create'] ?? null;
if (!$challenge) json_out(['ok'=>false,'err'=>'no_challenge'], 400);


$raw = file_get_contents('php://input');
$req = json_decode($raw, true);
if (!$req) json_out(['ok'=>false,'err'=>'bad_json'], 400);


$clientDataJSON = b64u_dec((string)($req['response']['clientDataJSON'] ?? ''));
$attestationObject = b64u_dec((string)($req['response']['attestationObject'] ?? ''));


try {
$data = $server->processCreate(
new ByteBuffer($clientDataJSON),
new ByteBuffer($attestationObject),
new ByteBuffer($challenge),
USER_VERIFICATION
);


$credentialId = $data->getCredentialId(); // ByteBuffer
$publicKey = $data->getPublicKey(); // ByteBuffer (COSE key)
$signCount = $data->getSignCount();
$aaguid = $data->getAaguid() ? $data->getAaguid()->getBinaryString() : null;
$fmt = $data->getFmt();


// Enforce „o singură passkey → un singur user”
$userId = (int)$_SESSION['user']['id'];


// Dacă credential_id există la alt user → blocăm
$stmt = $db->prepare('SELECT user_id FROM webauthn_credentials WHERE credential_id=? LIMIT 1');
$binId = $credentialId->getBinaryString();
$stmt->bind_param('s', $binId);
$stmt->execute();
$res = $stmt->get_result();
if ($row = $res->fetch_assoc()) {
if ((int)$row['user_id'] !== $userId) {
json_out(['ok'=>false,'err'=>'conflict_credential_in_use'], 409);
} else {
// deja atașată — succes idempotent
json_out(['ok'=>true]);
}
}


// Insert credential
$stmt = $db->prepare('INSERT INTO webauthn_credentials (user_id, credential_id, public_key, sign_count, aaguid, transports, attestation_fmt, is_discoverable, created_at) VALUES (?,?,?,?,?,?,?,1, NOW())');
$pk = $publicKey->getBinaryString();
$sc = $signCount;
$tr = 'internal';
$stmt->bind_param('ississs', $userId, $binId, $pk, $sc, $aaguid, $tr, $fmt);
}