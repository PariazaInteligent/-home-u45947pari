<?php
// require_login.php
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }

/**
 * Dacă utilizatorul e deja logat, nu mai rulăm logica de auto-login,
 * însă ne asigurăm că avem în sesiune câmpurile noi (rol, avatar_url).
 */
if (!empty($_SESSION['user'])) {
    // Dacă lipsesc câmpuri recente, le completăm din DB (best-effort, fără a schimba fluxul)
    if (
        (!isset($_SESSION['user']['rol']) || !isset($_SESSION['user']['avatar_url'])) &&
        !empty($_SESSION['user']['id'])
    ) {
        require __DIR__.'/db.php';
        $uid = (int)$_SESSION['user']['id'];
        if ($stmt = $mysqli->prepare("SELECT rol, avatar_url FROM utilizatori WHERE id=? LIMIT 1")) {
            $stmt->bind_param('i', $uid);
            $stmt->execute();
            if ($row = $stmt->get_result()->fetch_assoc()) {
                $_SESSION['user']['rol']        = $row['rol'] ?? 'utilizator';
                $_SESSION['user']['avatar_url'] = $row['avatar_url'] ?? null;
            }
            $stmt->close();
        }
    }
    return; // deja logat
}

$loggedIn = false;

/** Helper: șterge cookie-urile remember-me. */
function clear_remember_cookies(): void {
    $secure = !empty($_SERVER['HTTPS']);
    setcookie('remember_selector',  '', time() - 3600, '/', '', $secure, true);
    setcookie('remember_validator', '', time() - 3600, '/', '', $secure, true);
}

/** Helper: setează/înnoiește cookie-urile remember-me. */
function set_remember_cookies(string $selector, string $validator, int $days = 30): void {
    $exp    = time() + 60*60*24*$days;
    $secure = !empty($_SERVER['HTTPS']);
    $opts   = ['expires'=>$exp,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Lax'];
    setcookie('remember_selector',  $selector,  $opts);
    setcookie('remember_validator', $validator, $opts);
}

$selector  = $_COOKIE['remember_selector']  ?? '';
$validator = $_COOKIE['remember_validator'] ?? '';

if ($selector !== '' && $validator !== '') {
    require __DIR__.'/db.php';

    $sql = "SELECT t.id, t.user_id, t.selector, t.validator_hash, t.expires,
                   u.nume, u.email, u.rol, u.avatar_url
              FROM auth_tokens t
              JOIN utilizatori u ON u.id = t.user_id
             WHERE t.selector = ?
             LIMIT 1";

    if ($stmt = $mysqli->prepare($sql)) {
        $stmt->bind_param('s', $selector);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($row) {
            // Expirat?
            if (strtotime($row['expires']) <= time()) {
                if ($del = $mysqli->prepare("DELETE FROM auth_tokens WHERE id=?")) {
                    $del->bind_param('i', $row['id']);
                    $del->execute();
                    $del->close();
                }
                clear_remember_cookies();
            } else {
                // Compară validatorul (constant-time)
                $calc = hash('sha256', $validator);
                if (hash_equals($row['validator_hash'], $calc)) {
                    // Autologin reușit
                    session_regenerate_id(true);
                    $_SESSION['user'] = [
                        'id'         => (int)$row['user_id'],
                        'nume'       => $row['nume'],
                        'email'      => $row['email'],
                        'rol'        => $row['rol'] ?? 'utilizator',
                        'avatar_url' => $row['avatar_url'] ?? null,
                    ];
                    $loggedIn = true;

                    // Rotează validatorul + extinde expirarea
                    $newValidator     = bin2hex(random_bytes(32)); // la fel ca în login.php
                    $newValidatorHash = hash('sha256', $newValidator);
                    $newExpires       = (new DateTimeImmutable('+30 days'))->format('Y-m-d H:i:s');

                    if ($upd = $mysqli->prepare("UPDATE auth_tokens
                                                    SET validator_hash=?, expires=?, last_used=NOW()
                                                  WHERE id=?")) {
                        $upd->bind_param('ssi', $newValidatorHash, $newExpires, $row['id']);
                        $upd->execute();
                        $upd->close();
                    }

                    // Re-scrie cookie-urile
                    set_remember_cookies($row['selector'], $newValidator, 30);
                } else {
                    // Validator greșit → posibil furt
                    if ($del = $mysqli->prepare("DELETE FROM auth_tokens WHERE id=?")) {
                        $del->bind_param('i', $row['id']);
                        $del->execute();
                        $del->close();
                    }
                    clear_remember_cookies();
                }
            }
        } else {
            // Selector inexistent
            clear_remember_cookies();
        }
    }
}

// Dacă nici acum nu e logat, redirect la login
if (empty($_SESSION['user'])) {
    header('Location: login.php');
    exit;
}
