<?php
require __DIR__.'/db.php';

if (!empty($_SESSION['user'])) {
  header('Location: dashboard.php'); exit;
}

$error = '';

function set_remember_cookies(string $selector, string $validator, int $days = 30) {
  $exp = time() + 60*60*24*$days;
  $secure = !empty($_SERVER['HTTPS']);
  setcookie('remember_selector', $selector, [
    'expires'=>$exp, 'path'=>'/', 'secure'=>$secure, 'httponly'=>true, 'samesite'=>'Lax'
  ]);
  setcookie('remember_validator', $validator, [
    'expires'=>$exp, 'path'=>'/', 'secure'=>$secure, 'httponly'=>true, 'samesite'=>'Lax'
  ]);
}

if ($_SERVER['REQUEST_METHOD']==='POST') {
  $email = trim($_POST['email'] ?? '');
  $pass  = $_POST['password'] ?? '';
  $remember = !empty($_POST['remember']);

  if ($email==='' || $pass==='') {
    $error = 'Completează email și parola.';
  } else {
    $stmt = $mysqli->prepare("SELECT id, nume, email, parola FROM utilizatori WHERE email=? LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if ($user && password_verify($pass, $user['parola'])) {
      session_regenerate_id(true);
      $_SESSION['user'] = [
        'id'=>(int)$user['id'], 'nume'=>$user['nume'], 'email'=>$user['email']
      ];

      // remember-me
      if ($remember) {
        // selector/validator
        $selector  = bin2hex(random_bytes(9));
        $validator = bin2hex(random_bytes(32));
        $hash = hash('sha256', $validator);
        $days = 30;
        $expires = (new DateTimeImmutable("+{$days} days"))->format('Y-m-d H:i:s');

        $stmt = $mysqli->prepare("INSERT INTO auth_tokens (user_id, selector, validator_hash, expires, created_at) VALUES (?,?,?,?,NOW())");
        $stmt->bind_param('isss', $user['id'], $selector, $hash, $expires);
        $stmt->execute();

        set_remember_cookies($selector, $validator, $days);
      }

      header('Location: dashboard.php'); exit;
    } else {
      $error = 'Email sau parolă incorectă.';
    }
  }
}
?>
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Autentificare – Pariază Inteligent</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{height:100%}
  body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:linear-gradient(135deg,#0a0e27,#1a1f3a);color:#eaf7ff;overflow-x:hidden;position:relative;min-height:100vh}
  .particles{position:absolute;inset:0;z-index:0;pointer-events:none}
  .particle{position:absolute;border-radius:50%;background:rgba(0,255,157,.35)}
  .wrap{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
  h1{margin:0 0 8px;font-size:28px;background:linear-gradient(135deg,#00ff9d,#00b8ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center}
  p{text-align:center;margin-bottom:18px;color:#cfe8ff;opacity:.9}
  .fg{margin:14px 0}
  label{display:block;margin-bottom:6px;font-size:14px;opacity:.9}
  .input-group{position:relative}
  input{width:100%;padding:12px 42px 12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:15px}
  input:focus{border-color:rgba(0,255,157,.45);outline:none}
  #togglePass{
    position:absolute; right:12px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; font-size:18px; color:#ccc; padding:0;
    height:auto; width:auto; display:flex; align-items:center; justify-content:center; z-index:2;
  }
  #togglePass:hover{color:#00ffd5}
  .row{display:flex;align-items:center;gap:.5rem;margin-top:.5rem}
  button{width:100%;padding:12px;margin-top:12px;border:0;border-radius:10px;cursor:pointer;font-weight:700;font-size:16px;color:#0a0e27;background:linear-gradient(135deg,#00ff9d,#00b8ff);box-shadow:0 8px 20px rgba(0,255,157,.35)}
  button:hover{filter:brightness(1.05)}
  .err{margin-top:8px;color:#ff9b9b;background:rgba(255,0,0,.08);border:1px solid rgba(255,0,0,.25);padding:8px;border-radius:8px;text-align:center;font-size:14px}
  .links{margin-top:16px;text-align:center;font-size:14px}
  .links a{color:#83f7ff;text-decoration:none}
  .links a:hover{color:#00ffd5}

  /* — Sfera „spațială” Telegram — */
  .tg-wrap{display:flex;justify-content:center;margin-top:18px}
  .tg-sphere{
    width:64px;height:64px;border-radius:50%;
    background:
      radial-gradient(120% 120% at 30% 30%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 35%),
      radial-gradient(80% 80% at 70% 70%, rgba(0,255,200,.35) 0%, rgba(0,255,200,0) 60%),
      radial-gradient(100% 100% at 50% 50%, #00b8ff 0%, #0080ff 50%, #0056c9 100%);
    box-shadow:
      inset 0 8px 18px rgba(255,255,255,.15),
      0 10px 26px rgba(0,184,255,.35),
      0 0 18px rgba(0,255,200,.25);
    display:flex;align-items:center;justify-content:center;
    transition: transform .25s ease, filter .25s ease, box-shadow .25s ease;
    text-decoration:none; position:relative; overflow:hidden;
  }
  .tg-sphere::after{
    content:''; position:absolute; inset:-30% -30% auto auto;
    width:120%; height:120%;
    background: radial-gradient(100% 60% at 30% 0%, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 40%);
    transform: rotate(25deg);
    pointer-events:none;
  }
  .tg-sphere:hover{transform:translateY(-2px) scale(1.03); filter:brightness(1.05); box-shadow:
      inset 0 8px 18px rgba(255,255,255,.18),
      0 12px 30px rgba(0,184,255,.45),
      0 0 22px rgba(0,255,200,.35);}
  .tg-icon{width:32px;height:32px; display:block}

  /* mic subtitlu */
  .tg-label{margin-top:8px; text-align:center; font-size:12px; opacity:.85; color:#cfe8ff}
</style>
</head>
<body>
<div class="particles" id="particles"></div>

<div class="wrap">
  <form method="post" action="login.php" autocomplete="on">
    <h1>Autentificare</h1>
    <p>Intră în contul tău</p>
    <?php if(!empty($error)): ?><div class="err"><?=htmlspecialchars($error)?></div><?php endif; ?>

    <div class="fg">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required>
    </div>

    <div class="fg">
      <label for="password">Parolă</label>
      <div class="input-group">
        <input type="password" id="password" name="password" required>
        <button type="button" id="togglePass" aria-label="Afișează parola">👁</button>
      </div>
    </div>

    <div class="row">
      <input type="checkbox" id="remember" name="remember" value="1" style="width:auto">
      <label for="remember" style="margin:0">Ține-mă minte (auto-login)</label>
    </div>

    <div class="row">
      <input type="checkbox" id="rememberEmail" style="width:auto">
      <label for="rememberEmail" style="margin:0">Ține-mi minte emailul (precompletează)</label>
    </div>

    <button type="submit">Intră în cont</button>
    <div class="links"><a href="register.html" target="_blank">Nu ai cont? Înregistrează-te</a></div>

    <!-- ▼ Link Telegram sub formular (sferă spațială) -->
    <div class="tg-wrap">
      <a class="tg-sphere" href="https://t.me/Pariaza_Inteligent" target="_blank" rel="noopener noreferrer" aria-label="Contactează administratorul pe Telegram">
        <!-- SVG Telegram (alb) -->
        <svg class="tg-icon" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="#ffffff" d="M200.3 40.3L24.5 112.1c-12.1 4.9-12 11.8-2.2 14.9l45.1 14.1 17.3 55.1c2.1 5.8 1 8.1 7 8.1 4.6 0 6.6-2.1 9.2-4.6l22.1-21.6 46 33.9c8.5 4.7 14.6 2.3 16.8-7.9l30.5-143c3.1-12.5-4.8-18.1-16-13.7zM176 74l-83.6 79.3c-3 2.8-4.5 5.1-4.1 9.2l2.6 22.8 8.4-18.5c1.8-3.7 3.6-6.1 7.6-9.1L176 74z"/>
        </svg>
      </a>
    </div>
    <div class="tg-label">Contactează administratorul pe Telegram</div>
    <!-- ▲ Telegram -->
  </form>
</div>

<script>
// particule
(function(){
  const box=document.getElementById('particles'); if(!box) return;
  const COUNT=60,minDur=6,maxDur=14; let css=''; const frag=document.createDocumentFragment();
  for(let i=0;i<COUNT;i++){const p=document.createElement('div');p.className='particle';
    const s=(Math.random()*3+2).toFixed(1); p.style.width=s+'px'; p.style.height=s+'px';
    p.style.background=Math.random()<0.5?'rgba(0,255,157,.3)':'rgba(0,184,255,.3)';
    p.style.left=Math.random()*100+'%'; p.style.top=Math.random()*100+'%';
    const delay=(Math.random()*6).toFixed(2)+'s'; const dur=(Math.random()*(maxDur-minDur)+minDur).toFixed(2)+'s';
    const kf='float-'+i; const dx1=(Math.random()*140-70)|0,dy1=(Math.random()*140-70)|0;
    const dx2=(Math.random()*140-70)|0,dy2=(Math.random()*140-70)|0; const dx3=(Math.random()*140-70)|0,dy3=(Math.random()*140-70)|0;
    css+=`@keyframes ${kf}{0%,100%{transform:translate(0,0);opacity:.75}25%{transform:translate(${dx1}px,${dy1}px);opacity:.9}50%{transform:translate(${dx2}px,${dy2}px);opacity:.85}75%{transform:translate(${dx3}px,${dy3}px);opacity:.9}}`;
    p.style.animation=`${kf} ${dur} ease-in-out infinite`; p.style.animationDelay=delay; frag.appendChild(p);
  }
  box.appendChild(frag); const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
})();

// toggle parola
document.getElementById('togglePass').addEventListener('click', function(){
  const f=document.getElementById('password'); const hidden=f.type==='password';
  f.type = hidden ? 'text' : 'password'; this.textContent = hidden ? '🙈' : '👁';
});

// remember email (localStorage)
(function(){
  const email = document.getElementById('email');
  const chk   = document.getElementById('rememberEmail');
  const key   = 'remember_email';
  const saved = localStorage.getItem(key);
  if (saved) { email.value = saved; chk.checked = true; }
  chk.addEventListener('change', ()=> {
    if (chk.checked) localStorage.setItem(key, email.value || '');
    else localStorage.removeItem(key);
  });
  email.addEventListener('input', ()=> { if (chk.checked) localStorage.setItem(key, email.value || ''); });
})();
</script>
</body>
</html>
