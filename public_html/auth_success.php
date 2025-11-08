<?php
require __DIR__.'/db.php';

$logged_in = !empty($_SESSION['user']);

// Destinația finală după countdown
$DEST = '/layout.html#dashboard.php';
?>
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Autentificare reușită — Pariază Inteligent</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%}
    body{
      font-family:'Segoe UI', Tahoma, Arial, sans-serif;
      color:#eaf7ff; background:linear-gradient(135deg,#0a0e27,#1a1f3a);
      min-height:100vh; overflow-x:hidden; position:relative;
    }
    .particles{position:absolute; inset:0; z-index:0; pointer-events:none}
    .particle{position:absolute; border-radius:50%}

    /* Secțiune fluidă full-width (fără chenar) */
    .section{
      position:relative; z-index:1; min-height:100vh;
      display:flex; align-items:center; justify-content:center; padding:24px;
    }
    .inner{max-width:980px; width:100%}

    h1{
      font-size: clamp(28px, 4vw, 46px);
      line-height:1.1; margin-bottom:10px; text-align:center;
      background:linear-gradient(135deg,#00ff9d,#00b8ff);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    }
    .lead{ text-align:center; color:#cfe8ff; opacity:.9; margin-bottom:24px; font-size: clamp(14px, 2vw, 18px); }

    .countdown-wrap{ display:flex; align-items:center; justify-content:center; gap:14px; margin: 12px 0 24px; }
    .badge{
      display:inline-flex; align-items:center; justify-content:center;
      min-width:56px; height:56px; border-radius:14px;
      background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18);
      font-weight:800; font-size:22px; color:#fff;
      box-shadow:0 8px 22px rgba(0,255,157,.22), inset 0 6px 12px rgba(255,255,255,.06);
    }

    .cta{
      display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap;
    }
    .btn{
      appearance:none; border:0; cursor:pointer; border-radius:12px; font-weight:800;
      padding:12px 18px; font-size:16px; color:#0a0e27;
      background:linear-gradient(135deg,#00ff9d,#00b8ff);
      box-shadow:0 10px 24px rgba(0,255,157,.30);
    }
    .btn:hover{ filter:brightness(1.06) }

    .note{ text-align:center; margin-top:14px; font-size:13px; color:#bfe9ff; opacity:.9 }
    .small-links{ text-align:center; margin-top:18px; font-size:14px }
    .small-links a{ color:#83f7ff; text-decoration:none }
    .small-links a:hover{ color:#00ffd5 }

    /* Mini bară progres (subtilă) */
    .progress{
      --p: 0%; width: 100%; height: 4px; border-radius: 999px; overflow: hidden;
      background: rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.14);
      margin:14px auto 0; max-width:520px;
    }
    .progress .bar{ width: var(--p); height: 100%; background:linear-gradient(90deg,#00ff9d,#00b8ff) }

    /* Sferă Telegram ca pe login */
    .tg-wrap{display:flex;justify-content:center;margin-top:20px}
    .tg-sphere{ width:64px;height:64px;border-radius:50%;
      background:
        radial-gradient(120% 120% at 30% 30%, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 35%),
        radial-gradient(80% 80% at 70% 70%, rgba(0,255,200,.35) 0%, rgba(0,255,200,0) 60%),
        radial-gradient(100% 100% at 50% 50%, #00b8ff 0%, #0080ff 50%, #0056c9 100%);
      box-shadow: inset 0 8px 18px rgba(255,255,255,.15), 0 10px 26px rgba(0,184,255,.35), 0 0 18px rgba(0,255,200,.25);
      display:flex;align-items:center;justify-content:center; transition:.25s; text-decoration:none; position:relative; overflow:hidden; }
    .tg-sphere:hover{ transform:translateY(-2px) scale(1.03) }
    .tg-icon{width:32px;height:32px; display:block}
    .tg-label{margin-top:8px; text-align:center; font-size:12px; opacity:.85; color:#cfe8ff}

    /* Mesaj pentru utilizatori nelogați */
    .warn{
      margin: 18px auto 0; max-width:600px; text-align:center; padding:10px 12px;
      color:#ffd1d1; background:rgba(255,0,0,.08); border:1px solid rgba(255,0,0,.25); border-radius:12px;
      font-size:14px
    }
  </style>
</head>
<body>
  <div class="particles" id="particles"></div>

  <section class="section">
    <div class="inner">
      <?php if($logged_in): ?>
        <h1>Autentificare reușită ✅</h1>
        <p class="lead">Ești autentificat ca <strong><?=htmlspecialchars($_SESSION['user']['nume'] ?? $_SESSION['user']['email'] ?? 'utilizator');?></strong>.
          În <strong><span id="sec">3</span> secunde</strong> te redirecționăm către pagina principală.</p>

        <div class="countdown-wrap">
          <div class="badge" id="badge">3</div>
          <div class="cta">
            <button class="btn" id="goNow" type="button" aria-label="Du-mă acum la dashboard">Du-mă acum</button>
          </div>
        </div>

        <div class="progress"><div class="bar" id="bar"></div></div>
        <p class="note">Dacă preferi, poți continua din tab-ul în care ai făcut loginul — acesta este doar un mesaj de confirmare prietenos.</p>

        <div class="small-links"><a href="<?= htmlspecialchars($DEST) ?>">Continuă manual</a></div>

        <!-- Telegram (opțional, aceeași estetică) -->
        <div class="tg-wrap">
          <a class="tg-sphere" href="https://t.me/Pariaza_Inteligent" target="_blank" rel="noopener noreferrer" aria-label="Contactează administratorul pe Telegram">
            <svg class="tg-icon" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fill="#ffffff" d="M200.3 40.3L24.5 112.1c-12.1 4.9-12 11.8-2.2 14.9l45.1 14.1 17.3 55.1c2.1 5.8 1 8.1 7 8.1 4.6 0 6.6-2.1 9.2-4.6l22.1-21.6 46 33.9c8.5 4.7 14.6 2.3 16.8-7.9l30.5-143c3.1-12.5-4.8-18.1-16-13.7zM176 74l-83.6 79.3c-3 2.8-4.5 5.1-4.1 9.2l2.6 22.8 8.4-18.5c1.8-3.7 3.6-6.1 7.6-9.1L176 74z"/>
            </svg>
          </a>
        </div>
        <div class="tg-label">Contactează administratorul pe Telegram</div>

      <?php else: ?>
        <h1>Nu ești autentificat</h1>
        <p class="lead">Această pagină este afișată după autentificare. Te rugăm să te conectezi mai întâi.</p>
        <div class="small-links"><a href="/login.php">Du-mă la autentificare</a></div>
        <div class="warn">Dacă ai ajuns aici din greșeală, este posibil ca sesiunea să fi expirat sau să fi fost deschis acest tab separat fără login.</div>
      <?php endif; ?>
    </div>
  </section>

  <script>
    // Particule (ca pe login)
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

    // Countdown 3s + progres
    (function(){
      var secEl=document.getElementById('sec');
      var badge=document.getElementById('badge');
      var bar=document.getElementById('bar');
      var goBtn=document.getElementById('goNow');
      var dest=<?=$logged_in?json_encode($DEST):'null'?>;
      if(!dest) return;
      var total=3000, step=50, elapsed=0;
      function tick(){
        elapsed+=step;
        var left=Math.max(0, total-elapsed);
        var s=Math.ceil(left/1000);
        if(secEl) secEl.textContent=s;
        if(badge) badge.textContent=s;
        if(bar){ var p=Math.min(100, Math.round((elapsed/total)*100)); bar.parentElement.style.setProperty('--p', p+'%'); bar.style.width=p+'%'; }
        if(elapsed>=total){ window.location.href=dest; return; }
        setTimeout(tick, step);
      }
      setTimeout(tick, step);
      if(goBtn){ goBtn.addEventListener('click', function(){ window.location.href=dest; }); }
    })();
  </script>
  <script>
  window.open('/auth_success.php', '_blank');      // tab nou pentru confirmare
  window.location.href = '/dashboard.php';         // tabul curent merge la dashboard
</script>
</body>
</html>
