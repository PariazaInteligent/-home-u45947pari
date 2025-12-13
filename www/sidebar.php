<?php
if (session_status() !== PHP_SESSION_ACTIVE) session_start();
$loggedIn = !empty($_SESSION['user']);
$roleA = $loggedIn ? ( $_SESSION['user']['rol'] ?? $_SESSION['user']['role'] ?? '' ) : '';
$isAdmin = $loggedIn && (strtolower($roleA) === 'admin');
?>
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta http-equiv="refresh" content="10">

<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Sidebar - Pariază Inteligent</title>
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;min-height:100vh}

  /* ===== DARK ===== */
  body.dark .sidebar{background:rgba(20,26,46,.88);backdrop-filter:blur(10px);border-right:1px solid rgba(0,255,157,.25);color:#eaf7ff}
  body.dark .sidebar-header{background:linear-gradient(135deg, rgba(0,255,157,.12), rgba(0,184,255,.12));border-bottom:1px solid rgba(0,255,157,.25)}
  body.dark .sidebar-header h1{background:linear-gradient(135deg,#00ff9d,#00b8ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 10px rgba(0,255,157,.45))}
  body.dark .sidebar-header .tagline{color:#bfe8ff;opacity:.9}
  body.dark .nav-link{color:#b9d9ff;background:rgba(15,24,41,.35);border:1px solid rgba(0,255,157,.14)}
  body.dark .nav-link:hover{color:#00ffd5;background:rgba(15,24,41,.55);border-color:rgba(0,255,157,.35)}
  body.dark .nav-icon{color:#83f7ff}
  body.dark .nav-divider{background:linear-gradient(90deg,transparent,rgba(0,255,157,.45),transparent)}
  body.dark .info-card{background:linear-gradient(135deg, rgba(0,255,157,.12), rgba(0,184,255,.12));border:1px solid rgba(0,255,157,.25);color:#d7ecff}
  body.dark .info-card h3{color:#00ffd5}

  /* ===== LIGHT ===== */
  body.light .sidebar{background:rgba(255,255,255,.9);backdrop-filter:blur(10px);border-right:1px solid rgba(0,180,130,.2);color:#223344}
  body.light .sidebar-header{background:linear-gradient(135deg, rgba(0,180,130,.08), rgba(0,180,255,.08));border-bottom:1px solid rgba(0,180,130,.25)}
  body.light .sidebar-header h1{background:linear-gradient(135deg,#00cda0,#19bfff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 6px rgba(0,186,150,.25))}
  body.light .sidebar-header .tagline{color:#4c6a8f;opacity:.8}
  body.light .nav-link{color:#334e66;background:rgba(240,240,250,.6);border:1px solid rgba(0,180,130,.14)}
  body.light .nav-link:hover{color:#00a67f;background:rgba(240,255,250,.85);border-color:rgba(0,180,130,.35)}
  body.light .nav-icon{color:#008080}
  body.light .nav-divider{background:linear-gradient(90deg,transparent,rgba(0,180,130,.35),transparent)}
  body.light .info-card{background:linear-gradient(135deg, rgba(0,186,150,.08), rgba(0,186,255,.08));border:1px solid rgba(0,186,150,.25);color:#2a445a}
  body.light .info-card h3{color:#00a67f}

  /* ===== STRUCTURĂ ===== */
  .sidebar{position:fixed;left:0;top:0;height:100vh;width:280px;box-shadow:4px 0 30px rgba(0,0,0,.3);overflow-y:auto;overflow-x:hidden;transition:transform .3s ease;z-index:1200;scrollbar-width:none}
  .sidebar::-webkit-scrollbar{display:none}
  .sidebar.hidden{transform:translateX(-100%)}

  .sidebar-header{padding:26px 18px;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,.15)}
  .sidebar-header h1{font-size:22px;font-weight:800;letter-spacing:.3px;animation:glow 2.5s ease-in-out infinite alternate}
  .sidebar-header .tagline{margin-top:6px;font-size:12px}
  @keyframes glow{from{filter:drop-shadow(0 0 8px rgba(0,255,157,.4))}to{filter:drop-shadow(0 0 16px rgba(0,255,157,.8))}}

  .nav-menu{list-style:none;padding:16px 10px}
  .nav-item{margin-bottom:6px}
  .nav-link{display:flex;align-items:center;gap:12px;padding:14px 16px;text-decoration:none;font-size:15px;font-weight:500;border-radius:12px;position:relative;overflow:hidden;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease,color .25s ease,background .25s ease}
  .nav-link::before{content:'';position:absolute;left:0;top:0;width:4px;height:100%;background:linear-gradient(180deg,#00ff9d,#00b8ff);transform:scaleY(0);transition:transform .25s ease}
  .nav-link:hover{transform:translateX(5px);box-shadow:0 8px 24px rgba(0,0,0,.2)}
  .nav-link:hover::before{transform:scaleY(1)}
  .nav-link.active{color:#0a0e27;background:linear-gradient(135deg,#00ff9d,#00b8ff);border-color:transparent;box-shadow:0 10px 28px rgba(0,255,157,.25);transform:translateX(5px)}
  .nav-link.active .nav-icon{color:#0a0e27}
  .nav-icon{width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:18px;transition:transform .25s ease,color .25s ease}
  .nav-link:hover .nav-icon{transform:scale(1.12) rotate(4deg)}
  .nav-divider{height:1px;margin:16px 8px}

  .sidebar-footer{padding:16px;margin-top:auto;border-top:1px solid rgba(0,255,157,.15)}
  .info-card{border-left:4px solid #00ff9d;border-radius:12px;padding:14px;box-shadow:0 8px 20px rgba(0,0,0,.15)}
  .info-card h3{font-size:14px;margin-bottom:6px}

  .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:1100}
  .sidebar-overlay.active{display:block;}

  /* Badge necitite */
  .badge{
    display:inline-flex;align-items:center;justify-content:center;
    min-width:18px;height:18px;padding:0 6px;margin-left:auto;
    border-radius:999px;font-size:12px;font-weight:800;
    background:#ff5b5b;color:#fff;box-shadow:0 0 0 2px rgba(0,0,0,.12);
  }
  .badge[hidden]{display:none!important}
  .nav-link .right{margin-left:auto;display:flex;align-items:center;gap:8px}
</style>
</head>
<body>

<div class="sidebar-overlay" id="sidebarOverlay"></div>

<aside class="sidebar" id="sidebar" aria-label="Meniu lateral">
  <div class="sidebar-header">
    <h1>VALUE BET</h1>
    <p class="tagline">Strategii câștigătoare pentru pariori inteligenți</p>
  </div>

  <ul class="nav-menu" id="navMenu">
    <li class="nav-item">
      <a href="/dashboard.php" class="nav-link active">
        <i class="nav-icon fas fa-home"></i><span>Dashboard</span>
      </a>
    </li>

    <li class="nav-item">
      <a href="#statistici" class="nav-link">
        <i class="nav-icon fas fa-chart-line"></i><span>Statistici</span>
      </a>
    </li>

    <li class="nav-item">
      <a href="#pariuri" class="nav-link">
        <i class="nav-icon fas fa-trophy"></i><span>Pariuri Live</span>
      </a>
    </li>

    <div class="nav-divider"></div>

    <li class="nav-item">
      <a href="#rezultate" class="nav-link">
        <i class="nav-icon fas fa-list-check"></i><span>Rezultate</span>
      </a>
    </li>

    <li class="nav-item">
      <a href="/strategii.html" class="nav-link">
        <i class="nav-icon fas fa-lightbulb"></i><span>Strategii</span>
      </a>
    </li>

    <li class="nav-item">
      <a href="/contact.php" class="nav-link" target="_blank" rel="noopener">
        <i class="nav-icon fas fa-envelope"></i><span>Contact</span>
      </a>
    </li>

    <!-- Mesaje — VIZIBIL DOAR dacă utilizatorul este logat -->
    <?php if ($loggedIn): ?>
      <div class="nav-divider"></div>
      <li class="nav-item">
        <a href="/mesaje.php" class="nav-link" target="_blank" id="messagesLink">
          <i class="nav-icon fas fa-comments"></i>
          <span>Mesaje</span>
          <span class="right"><span id="messagesBadge" class="badge" hidden>0</span></span>
        </a>
      </li>
    <?php endif; ?>

    <!-- Administrare (vizibil doar admin) -->
    <li class="nav-item" id="adminMessagesItem" <?php if(!$isAdmin) echo 'style="display:none"'; ?>>
      <a href="/mesaje-admin.php" class="nav-link" target="_blank">
        <i class="nav-icon fas fa-shield-halved"></i>
        <span>Administrare Mesaje</span>
      </a>
    </li>
  </ul>

  <div class="sidebar-footer">
    <div id="sfat-zilnic"></div>
  </div>
</aside>

<script>
  // Active link highlight (și la navigare SPA)
  function setActiveLinkByLocation(){
    const links = document.querySelectorAll('.nav-link');
    const cur = location.hash.replace(/^#\/?/, '') || location.pathname.replace(/^\//,'');
    links.forEach(a=>{
      a.classList.remove('active');
      const href = a.getAttribute('href') || '';
      const norm = href.startsWith('#') ? href.slice(1) : href.replace(/^\//,'');
      if (norm && cur.startsWith(norm)) a.classList.add('active');
      if (href === '/dashboard.php' && (cur==='' || cur==='dashboard.php')) a.classList.add('active');
    });
  }
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a.nav-link');
    if (!a) return;
    document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
    a.classList.add('active');
  });
  window.addEventListener('hashchange', setActiveLinkByLocation);
  setActiveLinkByLocation();

  // „Sfat zilnic”
  (function(){
    const box = document.getElementById('sfat-zilnic');
    const fallback = `
      <div class="info-card">
        <h3><i class="fas fa-info-circle"></i> Sfat Zilnic</h3>
        <p>Pariază responsabil! Setează un buget și respectă-l. Succesul vine din disciplină și analiză.</p>
      </div>`;
    fetch('/sfat-zilnic.php',{credentials:'same-origin'})
      .then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text();})
      .then(html=>{box.innerHTML = html && html.trim() ? html : fallback;})
      .catch(()=>{ box.innerHTML = fallback; });
  })();

  // Overlay mobil
  const overlay = document.getElementById('sidebarOverlay');
  function toggleOverlay(){
    const isMobile = window.matchMedia('(max-width:1024px)').matches;
    if(isMobile && document.body.classList.contains('sidebar-open')){
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
  }
  overlay.addEventListener('click',()=>{
    document.body.classList.remove('sidebar-open');
    overlay.classList.remove('active');
  });
  const obs = new MutationObserver(toggleOverlay);
  obs.observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',toggleOverlay);
  toggleOverlay();

  // ===== Rol & vizibilitate admin (fallback din /api/whoami.php) =====
  fetch('/api/whoami.php',{credentials:'include'})
    .then(r=>r.ok?r.json():Promise.reject())
    .then(j=>{
      if (j && (j.rol === 'admin' || j.role === 'admin')) {
        const el = document.getElementById('adminMessagesItem');
        if (el) el.style.display = '';
      }
    })
    .catch(()=>{ /* dacă nu există whoami.php, lăsăm cum e din PHP */ });

  // ===== Badge necitite (sumă: personale + anunțuri) — doar dacă „Mesaje” există
  (function unreadBadge(){
    const badge = document.getElementById('messagesBadge');
    if (!badge) return; // Mesaje este ascuns pentru user nelogat

    const API_LIST = '/api/messages_list.php';

    const p = fetch(`${API_LIST}?tab=personale&per_page=1&unread=1`, {credentials:'include'})
      .then(r=>r.ok?r.json():{total:0}).catch(()=>({total:0}));
    const a = fetch(`${API_LIST}?tab=anunturi&per_page=1&unread=1`, {credentials:'include'})
      .then(r=>r.ok?r.json():{total:0}).catch(()=>({total:0}));

    Promise.all([p,a]).then(([pj,aj])=>{
      const tp = Number(pj.total ?? pj.totalCount ?? 0) || 0;
      const ta = Number(aj.total ?? aj.totalCount ?? 0) || 0;
      const sum = tp + ta;
      if (sum > 0) {
        badge.textContent = sum;
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    });
  })();
</script>

<script src="/js/theme-events.js"></script>
<script src="/js/main-route-sync.js"></script>

</body>
</html>
