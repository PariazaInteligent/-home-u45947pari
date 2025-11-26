<?php
// contact.php (mail() + auto-reply HTML "wow" + particule organice optimizate)
declare(strict_types=1);
mb_internal_encoding('UTF-8');
session_start();

/* ---------- CONFIG ---------- */
$SITE_NAME    = 'Pariază Inteligent';
$SITE_URL     = 'https://pariazainteligent.ro';
$MAIL_TO      = 'tomizeimihaita@gmail.com';
$MAIL_FROM    = 'no-reply@pariazainteligent.ro';   // EXISTENT în cPanel
$MAIL_ENVELOPE= 'no-reply@pariazainteligent.ro';   // Return-Path (-f)
$MIN_MSG_LEN  = 10;
$MIN_NAME_LEN = 2;
/* ---------------------------- */

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrf_token = $_SESSION['csrf_token'];

$feedback = null; $feedback_type = null;

function sanitize_email_header(string $v): string {
    return trim(preg_replace('/[\r\n]+/', ' ', $v));
}

// repopulate
$val_nume = $_POST['nume'] ?? '';
$val_email = $_POST['email'] ?? '';
$val_subiect = $_POST['subiect'] ?? '';
$val_mesaj = $_POST['mesaj'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $honeypot = $_POST['website'] ?? '';
    $token    = $_POST['csrf_token'] ?? '';
    $t0       = isset($_SESSION['form_t0']) ? (int)$_SESSION['form_t0'] : 0;
    $elapsed  = time() - $t0;

    if ($honeypot !== '') {
        $feedback = '✗ Eroare la trimitere.'; $feedback_type = 'error';
    } elseif (!hash_equals($_SESSION['csrf_token'], (string)$token)) {
        $feedback = '✗ Sesiune invalidă. Reîncarcă pagina.'; $feedback_type = 'error';
    } elseif ($elapsed < 2) {
        $feedback = '✗ Trimite din nou (prea rapid).'; $feedback_type = 'error';
    } else {
        $nume = trim($val_nume);
        $email = trim($val_email);
        $subiect = trim($val_subiect);
        $mesaj = trim($val_mesaj);

        if ($nume === '' || $email === '' || $subiect === '' || $mesaj === '') {
            $feedback = '✗ Te rugăm să completezi toate câmpurile.'; $feedback_type = 'error';
        } elseif (mb_strlen($nume) < $MIN_NAME_LEN) {
            $feedback = '✗ Numele este prea scurt.'; $feedback_type = 'error';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $feedback = '✗ Adresa de email nu este validă.'; $feedback_type = 'error';
        } elseif (mb_strlen($mesaj) < $MIN_MSG_LEN) {
            $feedback = '✗ Mesajul este prea scurt.'; $feedback_type = 'error';
        } else {
            $safe_reply_to = sanitize_email_header($email);
            $safe_subject_user = sanitize_email_header($subiect);

            // ---- 1) Mesaj către ADMIN (text/plain)
            $subject_admin = mb_encode_mimeheader("[$SITE_NAME] Contact de la $nume: $safe_subject_user", 'UTF-8');
            $message_admin = "Ai primit un mesaj nou din formularul de contact $SITE_NAME:\n\n"
                           . "Nume: $nume\nEmail: $email\nSubiect: $subiect\n"
                           . "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'n/a') . "\n"
                           . "Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'n/a') . "\n"
                           . "Data: " . date('Y-m-d H:i:s') . "\n\n"
                           . "Mesaj:\n$mesaj\n";
            $headers_admin = [
                "From: ". mb_encode_mimeheader($SITE_NAME, 'UTF-8') ." <{$MAIL_FROM}>",
                "Reply-To: {$safe_reply_to}",
                "MIME-Version: 1.0",
                "Content-Type: text/plain; charset=UTF-8",
                "X-Mailer: PHP/".phpversion()
            ];
            $params = "-f{$MAIL_ENVELOPE}";
            $sent_admin = @mail($MAIL_TO, $subject_admin, $message_admin, implode("\r\n", $headers_admin), $params);

            if ($sent_admin) {
                // ---- 2) AUTO-REPLY (multipart/alternative: text + HTML)
                $subject_user = mb_encode_mimeheader("Am primit mesajul tău – $SITE_NAME", 'UTF-8');

                // TEXT fallback
                $text_part = "Salut, {$nume}!\n\n"
                           . "Mesajul tău a fost primit cu succes și va fi procesat în cel mai scurt timp.\n"
                           . "Dacă ai uitat ceva sau vrei să revii cu detalii, răspunde direct la acest email.\n\n"
                           . "Echipa {$SITE_NAME}\n{$SITE_URL}\n";

                // HTML „wow” — tabele + inline styles + VML
                $brand  = htmlspecialchars($SITE_NAME, ENT_QUOTES, 'UTF-8');
                $nameEsc= htmlspecialchars($nume, ENT_QUOTES, 'UTF-8');
                $siteEsc= htmlspecialchars($SITE_URL, ENT_QUOTES, 'UTF-8');

                $html_part = '<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'.$brand.'</title>
<style>@keyframes shine{0%{background-position:-200% 0}100%{background-position:200% 0}}</style>
</head>
<body style="margin:0;padding:0;background:#0a0e27;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0a0e27;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:#0f162c;border-radius:20px;border:1px solid rgba(0,255,157,.18);box-shadow:0 18px 55px rgba(0,0,0,.55);overflow:hidden;">
          <tr>
            <td align="center" style="padding:32px 24px;background:linear-gradient(135deg,#0a0e27 0%,#152149 60%,#0e1a31 100%);">
              <div style="font-family:\'Segoe UI\',Arial,Helvetica,sans-serif;font-weight:900;font-size:28px;line-height:1.2;color:#ffffff;letter-spacing:.3px;background-image:linear-gradient(90deg,#00ffd5,#00b8ff,#00ffd5);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shine 4s linear infinite;">'.$brand.'</div>
              <div style="height:10px;"></div>
              <div style="display:inline-block;padding:6px 12px;border-radius:999px;border:1px solid rgba(0,255,157,.45);background:rgba(0,255,157,.12);color:#7fffe0;font-weight:700;font-family:\'Segoe UI\',Arial,sans-serif;font-size:12px;">CONFIRMARE MESAJ</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <div style="font-family:\'Segoe UI\',Arial,Helvetica,sans-serif;color:#eaf7ff;font-size:18px;font-weight:700;">Salut, '.$nameEsc.'!</div>
              <div style="height:10px;"></div>
              <div style="font-family:\'Segoe UI\',Arial,Helvetica,sans-serif;color:#cfe8ff;font-size:15px;line-height:1.7;">Îți mulțumim pentru mesaj — l-am primit și îl vom procesa în cel mai scurt timp. Dacă ai uitat ceva sau vrei să revii cu detalii, răspunde direct la acest email – ajunge la noi.</div>
              <div style="height:22px;"></div>
              <div style="height:1px;background:linear-gradient(90deg,rgba(0,255,157,0),rgba(0,255,157,.45),rgba(0,255,157,0));"></div>
              <div style="height:18px;"></div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="32" valign="top" align="left"><div style="width:22px;height:22px;border-radius:6px;background:rgba(0,255,157,.18);border:1px solid rgba(0,255,157,.35);"></div></td>
                  <td style="font-family:\'Segoe UI\',Arial,Helvetica,sans-serif;color:#d7ecff;font-size:14px;line-height:1.7;">Confirmare instant și răspuns pe aceeași adresă, fără a deschide ticket separat.</td>
                </tr>
                <tr><td style="height:10px;"></td><td></td></tr>
                <tr>
                  <td width="32" valign="top" align="left"><div style="width:22px;height:22px;border-radius:6px;background:rgba(0,184,255,.18);border:1px solid rgba(0,184,255,.35);"></div></td>
                  <td style="font-family:\'Segoe UI\',Arial,Helvetica,sans-serif;color:#d7ecff;font-size:14px;line-height:1.7;">Echipa te ține la curent pe email; nu e nevoie să urmărești alt canal.</td>
                </tr>
              </table>
              <div style="height:22px;"></div>
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="'.$siteEsc.'" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="18%" stroke="f" fillcolor="#00c7ff"><w:anchorlock/><center style="color:#0a0e27;font-family:Segoe UI,Arial,sans-serif;font-size:16px;font-weight:700;">Deschide '.$brand.'</center></v:roundrect>
              <![endif]-->
              <div style="mso-hide:all;"><a href="'.$siteEsc.'" target="_blank" style="display:inline-block;padding:14px 22px;border-radius:12px;font-family:\'Segoe UI\',Arial,sans-serif;font-weight:800;font-size:16px;color:#0a0e27;text-decoration:none;background:linear-gradient(135deg,#00ff9d 0%,#00b8ff 100%);box-shadow:0 10px 24px rgba(0,255,157,.35);">Deschide '.$brand.'</a></div>
              <div style="height:24px;"></div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 24px;border-top:1px solid rgba(255,255,255,.06);font-family:\'Segoe UI\',Arial,Helvetica,sans-serif;font-size:12px;color:#9cc6ff;">&copy; '.date('Y').' '.$brand.' · <a href="'.$siteEsc.'" style="color:#83f7ff;text-decoration:none;" target="_blank">'.$siteEsc.'</a></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

                // Multipart/alternative
                $boundary = 'bnd_'.bin2hex(random_bytes(8));
                $headers_user = [
                    "From: ". mb_encode_mimeheader($SITE_NAME, 'UTF-8') ." <{$MAIL_FROM}>",
                    "Reply-To: {$MAIL_FROM}",
                    "MIME-Version: 1.0",
                    "Content-Type: multipart/alternative; boundary=\"{$boundary}\"",
                    "X-Auto-Response-Suppress: All",
                    "Auto-Submitted: auto-replied"
                ];

                $body_user  = "--{$boundary}\r\n";
                $body_user .= "Content-Type: text/plain; charset=UTF-8\r\n";
                $body_user .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
                $body_user .= $text_part . "\r\n\r\n";
                $body_user .= "--{$boundary}\r\n";
                $body_user .= "Content-Type: text/html; charset=UTF-8\r\n";
                $body_user .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
                $body_user .= $html_part . "\r\n\r\n";
                $body_user .= "--{$boundary}--";

                @mail($safe_reply_to, $subject_user, $body_user, implode("\r\n", $headers_user), $params);

                $feedback = '✓ Mesajul tău a fost trimis cu succes! Ți-am trimis și o confirmare prin email.';
                $feedback_type = 'success';
                $val_nume = $val_email = $val_subiect = $val_mesaj = '';
                $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            } else {
                $feedback = '✗ Eroare la trimiterea mesajului. Dacă persistă, scrie-ne direct.';
                $feedback_type = 'error';
            }
        }
    }
}

$_SESSION['form_t0'] = time();
?>
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Contact - Pariază Inteligent</title>
<meta name="description" content="Formular de contact Pariază Inteligent — suport și asistență rapidă.">
<style>
*{margin:0;padding:0;box-sizing:border-box} html{scroll-behavior:smooth}
body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#0a0e27,#1a1f3a 50%,#0f1829);min-height:100vh;display:flex;justify-content:center;align-items:center;position:relative;overflow-x:hidden;color:#fff}
.particles{position:absolute;inset:0;width:100%;height:100%;overflow:hidden;z-index:0;pointer-events:none}
.particle{position:absolute;width:4px;height:4px;background:rgba(0,255,157,.3);border-radius:50%;will-change:transform}
.contact-container{
    position: relative;
    z-index: 1;
    width: min(92%, 720px);
    padding: 0;                  /* spațiul îl dăm elementelor interne */
    background: transparent;     /* fără fundal = fără chenar */
    border: 0;                   /* elimină conturul */
    box-shadow: none;            /* elimină umbra „cardului” */
    backdrop-filter: none;       /* fără efect de sticlă */
    animation: slideIn .8s ease-out;
}
@keyframes slideIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
.header{text-align:center;margin-bottom:24px}
.brand{font-size:32px;font-weight:800;background:linear-gradient(135deg,#00ff9d 0%,#00b8ff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px}
.subtitle{color:rgba(255,255,255,.75);font-size:16px}
.form-group{margin-bottom:18px;animation:fadeIn .8s ease-out both}
.form-group:nth-of-type(1){animation-delay:.08s}.form-group:nth-of-type(2){animation-delay:.16s}.form-group:nth-of-type(3){animation-delay:.24s}.form-group:nth-of-type(4){animation-delay:.32s}
@keyframes fadeIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
label{display:block;color:rgba(255,255,255,.9);margin-bottom:8px;font-size:14px;font-weight:600}
input,textarea{width:100%;padding:12px 14px;background:rgba(15,24,41,.6);border:2px solid rgba(0,255,157,.2);border-radius:10px;color:#fff;font-size:15px;transition:all .25s ease;outline:none}
input:focus,textarea:focus{border-color:rgba(0,255,157,.6);background:rgba(15,24,41,.8);box-shadow:0 0 15px rgba(0,255,157,.2)}
textarea{min-height:150px;resize:vertical;font-family:inherit}
.submit-btn{width:100%;padding:14px;background:linear-gradient(135deg,#00ff9d 0%,#00b8ff 100%);border:none;border-radius:10px;color:#0a0e27;font-size:16px;font-weight:800;cursor:pointer;transition:all .25s ease;position:relative;overflow:hidden}
.submit-btn:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(0,255,157,.4)}
.submit-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;box-shadow:none}
.submit-btn::before{content:'';position:absolute;top:50%;left:50%;width:0;height:0;border-radius:50%;background:rgba(255,255,255,.3);transform:translate(-50%,-50%);transition:width .6s,height .6s}
.submit-btn:hover::before{width:300px;height:300px}
.submit-btn span{position:relative;z-index:1}
.message{margin-top:16px;padding:14px;border-radius:10px;text-align:center;font-weight:600;animation:slideIn .5s ease-out}
.success{background:rgba(0,255,157,.18);border:2px solid rgba(0,255,157,.5);color:#00ff9d}
.error{background:rgba(255,87,87,.18);border:2px solid rgba(255,87,87,.5);color:#ff8a8a}
.back-link{display:inline-block;margin-top:16px;color:rgba(0,255,157,.85);text-decoration:none;font-size:14px;transition:all .25s ease}
.back-link:hover{color:#00ff9d;transform:translateX(-5px)}
@media (max-width:768px){.contact-container{padding:22px}.brand{font-size:26px}}
</style>
</head>
<body>
<div class="particles" id="particles" aria-hidden="true"></div>

<div class="contact-container" role="form" aria-labelledby="title">
  <div class="header">
    <h1 id="title" class="brand"><?= htmlspecialchars($SITE_NAME, ENT_QUOTES, 'UTF-8') ?></h1>
    <p class="subtitle">Contactează-ne pentru asistență</p>
  </div>

  <?php if ($feedback): ?>
    <div class="message <?= $feedback_type === 'success' ? 'success' : 'error' ?>" role="status" aria-live="polite">
      <?= htmlspecialchars($feedback, ENT_QUOTES, 'UTF-8') ?>
    </div>
  <?php endif; ?>

  <form method="POST" action="<?= htmlspecialchars($_SERVER['PHP_SELF'] ?? 'contact.php', ENT_QUOTES, 'UTF-8') ?>" id="contactForm" novalidate>
    <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute; left:-9999px; top:-9999px;" aria-hidden="true">
    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf_token, ENT_QUOTES, 'UTF-8') ?>">

    <div class="form-group">
      <label for="nume">Numele tău</label>
      <input type="text" id="nume" name="nume" required minlength="<?= (int)$MIN_NAME_LEN ?>" placeholder="Introdu numele tău" autocomplete="name" value="<?= htmlspecialchars($val_nume, ENT_QUOTES, 'UTF-8') ?>">
    </div>

    <div class="form-group">
      <label for="email">Adresa de email</label>
      <input type="email" id="email" name="email" required placeholder="exemplu@email.com" autocomplete="email" inputmode="email" value="<?= htmlspecialchars($val_email, ENT_QUOTES, 'UTF-8') ?>">
    </div>

    <div class="form-group">
      <label for="subiect">Subiect</label>
      <input type="text" id="subiect" name="subiect" required placeholder="Care este problema ta?" maxlength="120" value="<?= htmlspecialchars($val_subiect, ENT_QUOTES, 'UTF-8') ?>">
    </div>

    <div class="form-group">
      <label for="mesaj">Mesaj</label>
      <textarea id="mesaj" name="mesaj" required placeholder="Descrie problema sau întrebarea ta în detaliu..." minlength="<?= (int)$MIN_MSG_LEN ?>" spellcheck="true"><?= htmlspecialchars($val_mesaj, ENT_QUOTES, 'UTF-8') ?></textarea>
    </div>

    <button type="submit" class="submit-btn" id="submitBtn"><span>Trimite mesajul</span></button>
  </form>

  <a href="index.html" class="back-link">← Înapoi la pagina principală</a>
</div>

<script>
// Particule organice: un singur <style> cu toate keyframes, mișcare în toate direcțiile
(function () {
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;

  const COUNT = 50;
  const minDur = 5;   // secunde
  const maxDur = 15;  // secunde

  let keyframesCSS = '';
  const frag = document.createDocumentFragment();

  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    // dimensiune/culoare ușor variabile
    const size = (Math.random() * 3 + 2).toFixed(1); // 2–5px
    p.style.width  = size + 'px';
    p.style.height = size + 'px';
    p.style.background = Math.random() < 0.6 ? 'rgba(0,255,157,0.35)' : 'rgba(0,184,255,0.35)';

    // poziție inițială aleatoare (pe toată suprafața)
    p.style.left = Math.random() * 100 + '%';
    p.style.top  = Math.random() * 100 + '%';

    // întârziere & durată random
    const delay = (Math.random() * 6).toFixed(2) + 's';
    const duration = (Math.random() * (maxDur - minDur) + minDur).toFixed(2) + 's';
    p.style.animationDelay = delay;

    // mișcări „organice” în 3 puncte intermediare
    const kfName = `float-${i}`;
    const dx1 = (Math.random() * 140 - 70).toFixed(0);
    const dy1 = (Math.random() * 140 - 70).toFixed(0);
    const dx2 = (Math.random() * 140 - 70).toFixed(0);
    const dy2 = (Math.random() * 140 - 70).toFixed(0);
    const dx3 = (Math.random() * 140 - 70).toFixed(0);
    const dy3 = (Math.random() * 140 - 70).toFixed(0);

    keyframesCSS += `
    @keyframes ${kfName} {
      0%,100% { transform: translate(0,0); opacity: .7; }
      25%     { transform: translate(${dx1}px, ${dy1}px); opacity: .95; }
      50%     { transform: translate(${dx2}px, ${dy2}px); opacity: .85; }
      75%     { transform: translate(${dx3}px, ${dy3}px); opacity: .95; }
    }`;

    p.style.animation = `${kfName} ${duration} ease-in-out infinite`;
    frag.appendChild(p);
  }

  particlesContainer.appendChild(frag);

  const styleTag = document.createElement('style');
  styleTag.textContent = keyframesCSS;
  document.head.appendChild(styleTag);
})();

// Validare & UX
const form=document.getElementById('contactForm');const submitBtn=document.getElementById('submitBtn');
form.addEventListener('submit',(e)=>{if(!form.checkValidity()){e.preventDefault();form.reportValidity();return;}submitBtn.disabled=true;submitBtn.querySelector('span').textContent='Se trimite...';});
form.querySelectorAll('input, textarea').forEach(el=>{el.addEventListener('blur',function(){this.style.borderColor=this.value.trim()?'rgba(0,255,157,.6)':'rgba(255,87,87,.6)';});el.addEventListener('focus',function(){this.style.borderColor='rgba(0,255,157,.6)';});});
</script>
</body>
</html>
