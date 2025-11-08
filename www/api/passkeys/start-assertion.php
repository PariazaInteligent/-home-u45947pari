<?php
// /api/passkeys/start-assertion.php


declare(strict_types=1);
require_once __DIR__ . '/util.php';


require_method('GET');


$db = $mysqli; // din db.php
$server = webauthn_server();


$email = isset($_GET['email']) ? trim((string)$_GET['email']) : '';
$allowCreds = [];


if ($email !== '') {
// Restrângem la credențialele userului acestuia (login cu email precompletat)
if ($u = find_user_by_email($db, $email)) {
$stmt = $db->prepare('SELECT credential_id FROM webauthn_credentials WHERE user_id=?');
$stmt->bind_param('i', $u['id']);
$stmt->execute();
$res = $stmt->get_result();
while ($row = $res->fetch_assoc()) {
$allowCreds[] = [
'type' => 'public-key',
'id' => b64u($row['credential_id']),
'transports' => ['internal','hybrid','usb','nfc','ble']
];
}
}
}


// Opțiuni pentru navigator.credentials.get(). Dacă $allowCreds e gol → „discoverable credentials” (passwordless)
$args = $server->getGetArgs(
$allowCreds,
WEBAUTHN_TIMEOUT,
USER_VERIFICATION
);


$_SESSION['webauthn.challenge.get'] = $server->getChallenge();


json_out(['publicKey' => $args]);