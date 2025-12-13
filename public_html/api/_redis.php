<?php
// /api/_redis.php
// helper simplu pentru conexiune redis cu prefix pentru chat

function pi_redis(): Redis {
    static $r = null;
    if ($r instanceof Redis) {
        return $r;
    }

    $r = new Redis();
    // ajustează host/port dacă e cazul
    $r->connect('127.0.0.1', 6379, 1.5);

    // dacă ai parolă:
//  $r->auth('PAROLA_TA');

    // prefix ca să nu ciocnești cu alte chei
    $r->setOption(Redis::OPT_PREFIX, 'pi_chat:');

    return $r;
}
