<?php
// /api/passkeys/start-attestation.php


declare(strict_types=1);
require_once __DIR__ . '/util.php';


require_method('GET');


if (empty($_SESSION['user']['id'])) json_out(['ok'=>false,'err'=>'unauth'], 401);


$db = $mysqli; // din db.php
$server = webauthn_server();


$userId = (int)$_SESSION['user']['id'];
$email = (string)($_SESSION['user']['email'] ?? ('user'.$userId.'@local'));
$uh = ensure_user_handle($db, $userId);


// Prevenim dubluri: dacă userul are deja același tip de credential, e ok — pot exista mai multe passkey pe dispozitive diferite


$args = $server->getCreateArgs(
new ByteBuffer($uh), // user id (handle)
$email, // name
$email, // display name
WEBAUTHN_TIMEOUT,
true, // requireResidentKey (discoverable)
USER_VERIFICATION,
AUTHN_ATTACHMENT // 'platform'
);


$_SESSION['webauthn.challenge.create'] = $server->getChallenge();


json_out(['publicKey'=>$args]);