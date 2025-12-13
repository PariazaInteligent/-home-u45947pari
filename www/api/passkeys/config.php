<?php
// /api/passkeys/config.php


declare(strict_types=1);


// Relying Party (RP) — trebuie să fie fix domeniul tău, fără schemă.
const RP_NAME = 'Pariază Inteligent';


function rp_id(): string {
$host = $_SERVER['HTTP_HOST'] ?? 'pariazainteligent.ro';
$host = preg_replace('/:\\d+$/', '', $host); // fără port
$host = preg_replace('/^www\./i', '', $host); // fără www.
return strtolower($host);
}


function rp_origin(): string {
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'https';
$host = $_SERVER['HTTP_HOST'] ?? rp_id();
return $scheme . '://' . $host;
}


// Timeout (ms) pentru opțiunile WebAuthn
const WEBAUTHN_TIMEOUT = 60000;


// Politici recomandate
const USER_VERIFICATION = 'required'; // 'preferred' sau 'required'
const AUTHN_ATTACHMENT = 'platform'; // doar autentificatoare de pe dispozitiv (Face/Touch)