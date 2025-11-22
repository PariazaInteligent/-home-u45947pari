<?php
// /v1/dashboard-investitor.php
session_start();

// NU cache pentru pagini protejate
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

// CSRF token pentru Chat Comunitate
if (empty($_SESSION['csrf_token_chat'])) {
  $_SESSION['csrf_token_chat'] = bin2hex(random_bytes(32));
}
$csrfChat = $_SESSION['csrf_token_chat'];


$me   = $_SESSION['user'] ?? null;
$role = strtoupper($me['role'] ?? 'GUEST');

// redirect dacă nu e logat
if ($role === 'GUEST') { header('Location: /v1/login.html'); exit; }
// dacă e admin, trimite-l pe dashboardul de admin
if ($role === 'ADMIN') { header('Location: /v1/dashboard-admin.html'); exit; }

// helperi
function e($s){ return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

// Nume din sesiune, fallback DB 1x apoi cache în sesiune
$name = trim($me['name'] ?? '');
if ($name === '') {
  require __DIR__ . '/../api/db.php'; // $pdo
  $email = $me['email'] ?? '';
  if ($email !== '') {
    $stmt = $pdo->prepare('SELECT COALESCE(NULLIF(TRIM(name), "")) AS display_name FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $dbName = (string)$stmt->fetchColumn();
    if ($dbName !== '') {
      $name = $dbName;
      $_SESSION['user']['name'] = $dbName;
    }
  }
}
if ($name === '') $name = 'Investitor';

$uid = (int)($me['id'] ?? 0);
?>
<!DOCTYPE html>
<html lang="ro" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Panoul Meu — Banca Comună de Investiții</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    .glow { box-shadow: 0 10px 30px rgba(34,211,238,.25), inset 0 0 0 1px rgba(255,255,255,.06); }
    .card-hover { transition: transform .25s ease, box-shadow .25s ease; }
    .card-hover:hover { transform: translateY(-3px); box-shadow: 0 15px 45px rgba(0,0,0,.35); }
    .hero-gradient { background: linear-gradient(135deg, #2563eb, #06b6d4, #14b8a6); background-size: 180% 180%; animation: gradientMove 10s ease infinite; }
    @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    .nice-scroll::-webkit-scrollbar{ width:8px;} .nice-scroll::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.15); border-radius:8px;}
    .drag-handle { cursor: grab; }
    .hidden-card { display:none !important; }
    .badge { padding:.25rem .5rem; border-radius:.5rem; font-size:.75rem; }
    #dateRange{
      color-scheme: dark;
      color: #e2e8f0;
      background-color: rgba(15,23,42,.95);
    }
    #dateRange option{ background-color: rgba(15,23,42,.98); color: #e2e8f0; }
    #dateRange option:checked{ background-color: rgba(56,189,248,.25); color: #e2e8f0; }
    #dateRange:focus{ outline: none; box-shadow: 0 0 0 3px rgba(34,211,238,.25); border-color: rgba(34,211,238,.6); }
    .modal{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(2,6,23,.7); backdrop-filter: blur(6px) }
    
    /* Chat optimistic */
    .msg-pending { opacity: .75; }
    .msg-failed  { border-color: rgba(244,63,94,.35) !important; }
    .msg-status  { font-size: 11px; color: #94a3b8; }

    .btn-spin{ width:14px;height:14px;border:2px solid rgba(255,255,255,.35);
      border-top-color:#06b6d4;border-radius:9999px;display:inline-inline;vertical-align:-2px;
      margin-right:.5rem; animation: btnspin .8s linear infinite; }
    @keyframes btnspin { to { transform: rotate(360deg); } }
  </style>
  
  <style>
  /* chat — separatoare pe zile + colțuri „lipite” și meta ascunsă la grupare */
  .chat-sep{display:flex;align-items:center;justify-content:center;margin:.5rem 0}
  .chat-sep>span{font-size:11px;padding:2px 10px;border-radius:9999px;
    border:1px solid rgba(255,255,255,.08);background:rgba(2,6,23,.85);color:#94a3b8}

  .msg-compact .meta{display:none}              /* ascunde headerul repetitiv */
  .msg .bubble{border-radius:1rem}
  .bubble-join-top{border-top-left-radius:.5rem!important;border-top-right-radius:.5rem!important}
  .bubble-join-bottom{border-bottom-left-radius:.5rem!important;border-bottom-right-radius:.5rem!important}
  .reply-ref{display:block;width:100%;text-align:left;border:1px solid rgba(56,189,248,.25);background:rgba(8,47,73,.55);
    border-radius:.75rem;padding:.4rem .6rem;margin-bottom:.4rem;color:#e0f2fe;transition:border-color .2s ease,background .2s ease;}
  .reply-ref:hover{border-color:rgba(56,189,248,.55);background:rgba(8,47,73,.75);}
  .reply-ref .preview{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .msg-highlight{animation: replyFlash 2s ease-in-out;} 
  @keyframes replyFlash{from{box-shadow:0 0 0 0 rgba(56,189,248,.6);}to{box-shadow:0 0 0 0 rgba(56,189,248,0);} }
  </style>

  <style>
  /* --- mentions highlight + tab/filtru + clopoțel + toast --- */
  .mention{display:inline-block;padding:0 6px;border-radius:8px;border:1px solid rgba(56,189,248,.28);
    background:rgba(56,189,248,.14);color:#e6f9ff}
  .mention-me{border-color:rgba(16,185,129,.42);background:rgba(16,185,129,.18);color:#d1fae5}

  .mention-chip{
    display:inline-block;padding:0 .35rem;border-radius:.5rem;
    background:linear-gradient(135deg,#22d3ee66,#60a5fa33);
    border:1px solid rgba(255,255,255,.12); font-weight:600;
  }
  /* filtrare vizuală pe tab-ul „mențiuni” */
  .view-mentions .msg:not(.has-mention){ display:none }
  .view-mentions .chat-sep{ display:none }

  /* clopoțel mențiuni */
  #mentionBell{ position:relative }
  #mentionBell .dot{
    position:absolute; top:-6px; right:-6px; min-width:22px; height:22px;
    padding:0 6px; border-radius:9999px; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg,#2563eb,#06b6d4); color:#0b1220; font-size:12px; font-weight:800;
    box-shadow:0 8px 24px rgba(14,165,233,.25), inset 0 0 0 1px rgba(255,255,255,.6);
  }

  /* toast */
    /* container toasts – coloană bottom-right, crește în sus */
  #mentionToast{
    position: fixed;
    right: 12px;
    bottom: 12px;
    z-index: 40;
    pointer-events: none;

    display: flex;
    flex-direction: column;   /* cardurile sunt una sub alta */
    align-items: flex-end;    /* toate aliniate la dreapta */
    gap: 8px;                 /* distanță între carduri */
  }

  /* card toast – fără margin, ca să lăsăm flex-gap-ul să lucreze */
  .toast-card{
    backdrop-filter: blur(6px);
    background: linear-gradient(135deg, rgba(2,6,23,.85), rgba(2,6,23,.75));
    border: 1px solid rgba(255,255,255,.1);
    color: #e5e7eb;
    border-radius: 16px;
    padding: 10px 12px;
    display: flex;
    gap: 10px;
    align-items: center;
    box-shadow: 0 20px 50px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.04);

    margin: 0;                      /* important pentru stacking curat */
    transform-origin: bottom right; /* animația pare să vină din colț */
    animation: toastIn .25s ease-out;
  }

  .toast-card .icon{
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg,#2563eb,#06b6d4,#14b8a6);
    color: #0b1220;
    font-weight: 900;
  }

  /* animație puțin mai „smooth” pentru stacking */
  @keyframes toastIn{
    from{
      transform: translateY(8px) scale(.97);
      opacity: 0;
    }
    to{
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  .toast-card .icon{
    width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg,#2563eb,#06b6d4,#14b8a6); color:#0b1220; font-weight:900;
  }
  
    /* variante vizuale pentru tipurile de toast */
  .toast-card.toast-info{
    border-color: rgba(56,189,248,.45);
    background: linear-gradient(135deg, rgba(15,23,42,.96), rgba(8,47,73,.96));
  }
  .toast-card.toast-info .icon{
    background: linear-gradient(135deg,#0ea5e9,#22c55e);
    color:#0b1120;
  }

  .toast-card.toast-error{
    border-color: rgba(248,113,113,.6);
    background: linear-gradient(135deg, rgba(127,29,29,.96), rgba(15,23,42,.96));
  }
  .toast-card.toast-error .icon{
    background: linear-gradient(135deg,#fb7185,#f97373);
    color:#111827;
  }

  .toast-card.toast-success{
    border-color: rgba(34,197,94,.6);
    background: linear-gradient(135deg, rgba(5,46,22,.96), rgba(6,78,59,.96));
  }
  .toast-card.toast-success .icon{
    background: linear-gradient(135deg,#22c55e,#14b8a6);
    color:#022c22;
  }


  /* floating suggestions panel (fixed, ancorat la input via getBoundingClientRect) */
  #piMentionPanel{position:fixed;z-index:70;min-width:240px;max-width:420px;max-height:40vh;overflow:auto;
    background:rgba(2,6,23,.96);border:1px solid rgba(255,255,255,.10);border-radius:12px;padding:6px;
    box-shadow:0 10px 30px rgba(0,0,0,.5);backdrop-filter:blur(6px)}
  .pi-mention-item{width:100%;text-align:left;border:1px solid transparent;border-radius:10px;padding:8px 10px;
    color:#e5e7eb}
  .pi-mention-item:hover,.pi-mention-item[aria-selected="true"]{background:rgba(56,189,248,.10);
    border-color:rgba(56,189,248,.20)}
  .pi-mention-meta{font-size:11px;color:#94a3b8}
  </style>
  
  <style>
/* — reactions — */
.rx-summary{display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.35rem}
.rx-pill{display:inline-flex;align-items:center;gap:.35rem;padding:.15rem .45rem;border-radius:9999px;
  border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);font-size:12px;line-height:1;
  cursor:pointer;user-select:none}
.rx-pill[data-mine="1"]{border-color:rgba(56,189,248,.45);background:rgba(56,189,248,.10)}
.rx-picker{position:absolute;z-index:60;display:flex;gap:.35rem;padding:.35rem .45rem;border-radius:14px;
  background:rgba(2,6,23,.96);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12);
  box-shadow:0 10px 30px rgba(0,0,0,.5)}
.rx-picker button{font-size:18px;line-height:1;border-radius:10px;padding:.25rem .35rem}
.rx-picker button:hover{background:rgba(255,255,255,.08)}
.rx-trigger{opacity:.0;transition:opacity .15s ease; font-size:12px; margin-left:.25rem; cursor:pointer}
.msg:hover .rx-trigger{opacity:.8}
@media (hover:none){ .rx-trigger{opacity:.8} }
</style>

<style>
  /* chat: păstrează liniile noi din mesaj */
  #chatFeed .bubble [data-body]{
    white-space: pre-wrap;   /* respectă \n ca line-break */
    overflow-wrap: anywhere; /* rupe cuvinte foarte lungi */
  }
</style>

<style>
  /* composer aerisit */
  .composer-wrap{
    position: sticky; bottom: 0; z-index: 10;
    padding-top: .5rem;
    background: linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(2,6,23,.65) 30%, rgba(2,6,23,.85) 100%);
    backdrop-filter: blur(6px);
  }
  #chatInput{
    white-space: pre-wrap;           /* păstrează \n */
    line-height: 1.5;
    min-height: 44px;                /* confort minim */
    max-height: 30vh;                /* nu depășește 30% din ecran */
    resize: none;                    /* controlăm din js */
    overflow-y: auto;                /* apare scroll doar când trebuie */
  }
  #charCount{
    font-size: 11px; color:#94a3b8;
  }
  /* un pic mai „pufos” pentru accesibilitate */
  .btn-send{ height: 44px; }
  @media (min-width: 768px){
    #chatInput{ min-height: 48px }
    .btn-send{ height: 48px }
  }
</style>

</head>

<body class="min-h-screen bg-slate-950 text-slate-100"
      data-role="<?= e($role) ?>"
      data-user-id="<?= e((string)$uid) ?>"
      data-user-name="<?= e($name) ?>"
      data-csrf-chat="<?= e($csrfChat) ?>">


  <!-- Gate client-side (fallback) -->
  <script>
    (function gate(){
      const role = (document.body.dataset.role||'GUEST').toUpperCase();
      if(role==='ADMIN') window.location.replace('/v1/dashboard-admin.html');
      if(role!=='USER')  window.location.replace('/v1/login.html');
    })();
  </script>

  <!-- NAV / TOPBAR -->
  <header class="sticky top-0 z-50 bg-slate-950/70 backdrop-blur border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/v1/acasa.html" class="flex items-center gap-3">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-extrabold glow">PI</span>
        <div>
          <div class="font-semibold tracking-wide">Pariază Inteligent</div>
          <div class="text-xs text-slate-400 -mt-0.5">Panoul Meu</div>
        </div>
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm text-slate-300">
        <a class="hover:text-white" href="/v1/acasa.html">Acasă</a>
        <a class="hover:text-white" href="/v1/investitii.php">Investiții</a>
        <a class="hover:text-white" href="/v1/retrageri.php">Retrageri</a>
        <a class="hover:text-white" href="/v1/profil.html">Profil</a>
      </nav>
      <div class="flex items-center gap-2">
        <button id="btnEdit" class="rounded-xl px-3 py-2 border border-white/10 hover:border-white/20 text-sm"><i class="fa-solid fa-pen-to-square mr-2"></i>Personalizează</button>
        <button id="btnSave" class="hidden rounded-xl px-3 py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 text-sm font-semibold"><i class="fa-solid fa-floppy-disk mr-2"></i>Salvează</button>
        <button id="btnReset" class="hidden rounded-xl px-3 py-2 border border-white/10 hover:border-white/20 text-sm"><i class="fa-solid fa-rotate mr-2"></i>Resetează</button>
      </div>
    </div>
  </header>

  <!-- HERO -->
  <section class="relative overflow-hidden">
    <div class="absolute inset-0 hero-gradient opacity-20"></div>
    <div class="max-w-7xl mx-auto px-4 py-8 md:py-12 relative">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 id="greeting" class="text-2xl md:text-3xl font-extrabold">Bun venit!</h1>
          <p class="text-slate-300">Ai la dispoziție un rezumat al performanței contului tău și instrumente rapide.</p>
        </div>
        <div class="flex items-center gap-2">
          <label for="dateRange" class="text-sm text-slate-400">Perioadă:</label>
          <select id="dateRange" class="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm">
            <option value="today">Astăzi</option>
            <option value="all" selected>Toate</option>
          </select>
        </div>
      </div>
    </div>
  </section>

  <!-- GRID / WIDGETS -->
  <main class="max-w-7xl mx-auto px-4 pb-20">
    <div id="widgets" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <!-- Summary Cards -->
      <section class="card-hover rounded-2xl border border-white/10 bg-white/5 p-5" data-widget-id="summary">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Rezumat Financiar</h2>
          <i class="fa-solid fa-grip-lines drag-handle text-slate-400"></i>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
            <div class="text-slate-400">Suma investită</div>
            <div id="sumInvested" class="text-lg font-bold">—</div>
          </div>
          <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
            <div class="text-slate-400">Profit total</div>
            <div id="sumProfit" class="text-lg font-bold">—</div>
          </div>
          <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
            <div class="text-slate-400">Sold curent</div>
            <div id="sumBalance" class="text-lg font-bold">—</div>
          </div>
          <!-- Card „Creștere” clicabil -->
          <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3 cursor-pointer group"
               id="growthCard" tabindex="0" role="button" aria-controls="growthModal" aria-expanded="false">
            <div class="flex items-center justify-between">
              <div class="text-slate-400">Creștere <span class="text-[11px] opacity-70">(strategie)</span></div>
              <i class="fa-solid fa-circle-info text-slate-400 group-hover:text-white"></i>
            </div>
            <div class="mt-1 text-lg font-bold flex items-center gap-2">
              <span id="sumGrowth">—</span>
              <span id="sumGrowthBadge"
                    class="hidden text-[11px] px-1.5 py-0.5 rounded-md border border-white/10 bg-white/5 text-slate-300">fără retrageri</span>
            </div>
            <div class="text-[11px] text-slate-500 mt-1">Click pentru explicații</div>
          </div>
        </div>
        <div class="mt-3 text-xs text-slate-400">* Valorile reflectă perioada selectată.</div>
      </section>

      <!-- Goals -->
      <section class="card-hover rounded-2xl border border-white/10 bg-white/5 p-5" data-widget-id="goals">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Obiective</h2>
            <i class="fa-solid fa-grip-lines drag-handle text-slate-400"></i>
        </div>
        <div>
          <div class="flex items-center justify-between text-sm mb-1"><span>Profit trimestrial</span><span id="goalQuarterPct">—</span></div>
          <div class="w-full h-2 rounded-full bg-white/10">
            <div id="goalQuarterBar" class="h-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400" style="width:0%"></div>
          </div>
          <div class="flex items-center justify-between text-sm mt-3 mb-1"><span>Sold țintă</span><span id="goalBalancePct">—</span></div>
          <div class="w-full h-2 rounded-full bg-white/10">
            <div id="goalBalanceBar" class="h-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400" style="width:0%"></div>
          </div>
        </div>
        <p class="text-xs text-slate-400 mt-3">Setează obiective în <a class="underline decoration-dotted" href="/v1/profil.html#goals">Profil → Obiective</a>.</p>
      </section>

      <!-- Quick Actions -->
      <section class="card-hover rounded-2xl border border-white/10 bg-white/5 p-5" data-widget-id="actions">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Acțiuni rapide</h2>
          <i class="fa-solid fa-grip-lines drag-handle text-slate-400"></i>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/v1/investitii.php" class="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-semibold"><i class="fa-solid fa-circle-plus"></i> Investește</a>
          <a href="/v1/retrageri.php" class="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 border border-white/10 hover:border-white/20"><i class="fa-solid fa-wallet"></i> Retrage</a>
        </div></br>
        <div class="pi-avgproc-widget" data-endpoint="/api/user/withdrawals/processing_stats.php"></div>
      </section>

      <!-- Lumen AI -->
      <section class="card-hover rounded-2xl border border-white/10 bg-white/5 p-5" data-widget-id="lumen">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Lumen AI</h2>
          <i class="fa-solid fa-grip-lines drag-handle text-slate-400"></i>
        </div>
        <p class="text-sm text-slate-300">Un scurt insight pe baza datelor recente.</p>
        <div id="lumenOut" class="mt-3 text-sm text-slate-200 space-y-3"></div>
        <div class="mt-3 flex gap-3">
          <button id="btnLumen" class="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-semibold"><i class="fa-solid fa-wand-magic-sparkles"></i> Generează insight</button>
          <span id="lumenErr" class="hidden text-xs text-rose-300">A apărut o eroare. Încearcă mai târziu.</span>
        </div>
      </section>

      <!-- Chat Comunitate -->
      <section class="card-hover rounded-2xl border border-white/10 bg-white/5 p-5" data-widget-id="chat">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <h2 class="font-semibold">Chat Comunitate</h2>
            <div class="hidden md:flex items-center gap-1 text-xs border border-white/10 rounded-xl p-1">
              <button id="tabAll"  type="button" class="px-2 py-1 rounded-lg bg-white/5">toate</button>
              <button id="tabMent" type="button" class="px-2 py-1 rounded-lg hover:bg-white/5">mențiuni</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="mentionBell" type="button" class="rounded-xl px-2 py-1 border border-white/10 hover:border-white/20" title="mențiunile tale">
              <i class="fa-solid fa-bell"></i>

              <span class="dot hidden" id="mentionDot">0</span>
            </button>
            <span id="chatLive" class="badge bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">live</span>
          </div>
        </div>

         <div class="grid lg:grid-cols-[2fr,1fr] gap-4">
          <div class="space-y-2">
            <div id="chatFeed" class="h-[51vh] overflow-y-auto nice-scroll space-y-2 p-1 rounded-xl border border-white/10 bg-slate-900/50" aria-live="polite"></div>
            <div id="mentionToast" aria-live="polite"></div>
            <div id="replyContext" class="hidden mt-2 px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-xs">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="text-[13px] font-semibold text-cyan-100">Răspunzi la <span id="replyUser">mesaj</span></div>
                  <div id="replyPreview" class="mt-1 text-slate-300 leading-snug max-h-12 overflow-hidden"></div>
                </div>
                <button id="replyCancel" type="button" class="text-slate-400 hover:text-rose-300" title="anulează răspunsul">
                  <i class="fa-regular fa-circle-xmark"></i>
                </button>
              </div>
            </div>
            

        <form id="chatForm" class="mt-3 flex items-center gap-2">
              <input id="chatInput" maxlength="1000" autocomplete="off"
                    class="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
                    placeholder="Scrie un mesaj (max 1000 caractere)…" />
              <button id="chatSend" type="submit"
                    class="rounded-xl px-3 py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 text-sm font-semibold">
                Trimite
              </button>
            </form>

            <div id="chatHint" class="mt-2 text-[11px] text-slate-500">Respectă comunitatea. Anti-spam activ (3s între mesaje).</div>
          </div>

        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-semibold text-sm">Răspunsuri &amp; mențiuni</div>
                <div class="text-[11px] text-slate-400">Mesaje necitite care te vizează direct.</div>
              </div>
              <button id="btnMentionsReadAll" type="button" class="text-[11px] px-2 py-1 rounded-lg border border-white/10 hover:border-white/20">
                marchează citit
              </button>
            </div>
            <div id="mentionInbox" class="mt-3 space-y-2 text-sm"></div>
          </div>
        </div>
      </section>

      <!-- Grafice -->
      <section class="xl:col-span-2 card-hover rounded-2xl border border-white/10 bg-white/5 p-5" data-widget-id="profitChart">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Evoluție Profit</h2>
          <i class="fa-solid fa-grip-lines drag-handle text-slate-400"></i>
        </div>
        <canvas id="chartProfit" height="120"></canvas>
        <div id="chartProfitEmpty" class="hidden text-sm text-slate-400 mt-3">Nu există date pentru perioada selectată.</div>
      </section>

      <section class="xl:col-span-2 card-hover rounded-2xl border border-white/10 bg-white/5 p-5" data-widget-id="fundChart">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Creștere Fond Personal</h2>
          <i class="fa-solid fa-grip-lines drag-handle text-slate-400"></i>
        </div>
        <canvas id="chartFund" height="120"></canvas>
        <div id="chartFundEmpty" class="hidden text-sm text-slate-400 mt-3">Nu există date pentru perioada selectată.</div>
      </section>

      <!-- Tranzacții -->
      <section class="xl:col-span-2 card-hover rounded-2xl border border-white/10 bg-white/5 p-5" data-widget-id="tx">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Tranzacții recente</h2>
        </div>
        <ul id="txList" class="space-y-3 text-sm"></ul>
        <div id="txEmpty" class="hidden text-sm text-slate-400 mt-3">Nu există tranzacții în perioada selectată.</div>
      </section>

      <!-- Proiecții -->
      <section class="card-hover rounded-2xl border border-white/10 bg-white/5 p-5" data-widget-id="proj">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Proiecții Financiare Interactive</h2>
        </div>
        <form id="projForm" class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <label class="text-slate-300">Sumă (€)</label>
            <input id="projAmount" type="number" step="0.01" min="0" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2" placeholder="500"/>
          </div>
          <div>
            <label class="text-slate-300">Scenariu</label>
            <select id="projScenario" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <option value="0.002">Conservator (0.2%/zi)</option>
              <option value="0.0035" selected>Moderat (0.35%/zi)</option>
              <option value="0.005">Optimist (0.5%/zi)</option>
            </select>
          </div>
          <div>
            <label class="text-slate-300">Perioadă</label>
            <select id="projDays" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <option value="7">7 zile</option>
              <option value="30" selected>30 zile</option>
              <option value="90">90 zile</option>
            </select>
          </div>
        </form>
        <div class="mt-3 text-sm">
          <div>Sold estimat: <span id="projFinal" class="font-semibold">—</span></div>
          <div>Profit estimat: <span id="projProfit" class="font-semibold">—</span></div>
          <p class="text-xs text-slate-400 mt-2">Aceste proiecții sunt estimări, nu reprezintă o garanție.</p>
        </div>
      </section>

      <!-- Gemini (stub) -->
      <section class="xl:col-span-2 card-hover rounded-2xl border border-white/10 bg-white/5 p-5" data-widget-id="gemini">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Analiză Avansată Gemini</h2>
          <i class="fa-solid fa-grip-lines drag-handle text-slate-400"></i>
        </div>
        <div class="text-sm text-slate-300">Pune o întrebare în limbaj natural. Vom contextualiza cu datele tale filtrate.</div>
        <textarea id="geminiQ" rows="3" class="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" placeholder="Ex: Cum ar fi evoluat profitul astăzi dacă dublam suma investită?"></textarea>
        <div class="mt-2 flex gap-3">
          <button id="btnGemini" class="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-semibold"><i class="fa-solid fa-robot"></i> Generează Analiză cu Gemini</button>
          <span id="geminiErr" class="hidden text-xs text-rose-300">A apărut o eroare la generarea analizei.</span>
        </div>
        <div id="geminiOut" class="mt-3 text-sm text-slate-300"></div>
      </section>

    </div>
  </main>

  <!-- Modal: Nomenclator Creștere -->
  <div id="growthModal" class="modal hidden z-[80]">
    <div class="w-full max-w-xl rounded-2xl bg-slate-900/95 border border-white/10 p-5">
      <div class="flex items-start justify-between">
        <h3 class="text-lg font-semibold">Nomenclator „Creștere”</h3>
        <button id="gmClose" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <p class="text-sm text-slate-300 mt-2">
        <strong>Randament (strategie)</strong> arată performanța fără a penaliza retragerile aprobate.
        Pentru transparență, mai jos vezi descompunerea:
      </p>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div class="rounded-xl border border-white/10 bg-slate-950/70 p-3">
          <div class="text-slate-400">Perioadă selectată</div>
          <div id="gmRange" class="font-semibold">—</div>
        </div>
        <div class="rounded-xl border border-white/10 bg-slate-950/70 p-3">
          <div class="text-slate-400">Randament (strategie)</div>
          <div id="gmPerfPct" class="font-semibold">—</div>
        </div>
        <div class="rounded-xl border border-white/10 bg-slate-950/70 p-3">
          <div class="text-slate-400">Profit brut (înainte de retrageri)</div>
          <div id="gmProfitRaw" class="font-semibold">—</div>
        </div>
        <div class="rounded-xl border border-white/10 bg-slate-950/70 p-3">
          <div class="text-slate-400">Retrageri & taxe (estimate)</div>
          <div id="gmCashout" class="font-semibold">—</div>
        </div>
        <div class="rounded-xl border border-white/10 bg-slate-950/70 p-3">
          <div class="text-slate-400">Profit rămas (după retrageri)</div>
          <div id="gmProfitAdj" class="font-semibold">—</div>
        </div>
        <div class="rounded-xl border border-white/10 bg-slate-950/70 p-3">
          <div class="text-slate-400">Sold curent</div>
          <div id="gmBalance" class="font-semibold">—</div>
        </div>
      </div>

      <div class="mt-4 text-xs text-slate-400 space-y-2">
        <p>• <strong>Randament (strategie)</strong> ≈ profitul generat de strategie raportat la sumele investite, fără a scădea retragerile aprobate.</p>
        <p>• <strong>Retrageri & taxe</strong> sunt tratate ca ieșiri de numerar; ele pot aduce Profitul curent la 0 chiar dacă Randamentul rămâne pozitiv.</p>
        <p id="gmNote" class="opacity-80"></p>
      </div>

      <div class="mt-5 flex items-center justify-end">
        <button id="gmClose2" class="rounded-xl px-4 py-2 border border-white/10 hover:border-white/20 text-sm">
          Închis
        </button>
      </div>
    </div>
  </div>
  <!-- /Modal -->

  <footer class="py-8 border-t border-white/5">
    <div class="max-w-7xl mx-auto px-4 text-sm text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>© <span id="year"></span> Pariază Inteligent — Panoul Meu</div>
      <div class="flex items-center gap-4">
        <a class="hover:text-white" href="/v1/acasa.html">Acasă</a>
        <a class="hover:text-white" href="/v1/profil.html">Profil</a>
        <a class="hover:text-white" href="/logout.php">Deconectare</a>
      </div>
    </div>
  </footer>

  <script>
    document.getElementById('year').textContent = new Date().getFullYear();

    // Greeting
    (function greeting(){
      const h = new Date().getHours();
      const name = document.body.dataset.userName || 'Investitor';
      let t = 'Bună ziua'; if(h<12) t='Bună dimineața'; if(h>=18) t='Bună seara';
      document.getElementById('greeting').textContent = `${t}, ${name}!`;
    })();

    // KPI helper
    function kpi(event, detail){
      const payload = { type:event, ts:Date.now(), ...detail };
      if(window.dispatchEvent) window.dispatchEvent(new CustomEvent(event,{detail:payload}));
      console.log('[KPI]', payload);
    }

    /* ---------------- Mock vizual (grafice/tx) — neafectează KPI-urile reale ---------------- */
    const seedRand = (s)=>()=> (s=Math.sin(s)*10000, s-Math.floor(s));
    const rand = seedRand(42);
    const dataAll = Array.from({length: 200}, (_,i)=>{
      const d = new Date(); d.setDate(d.getDate()-(199-i));
      const p = Math.round((rand()*40 - 15) * 100)/100; // [-15, +25]
      let dep=0, wit=0; const r = rand();
      if(r>0.98) dep = Math.round((200 + rand()*400));
      if(r<0.02) wit = Math.round((100 + rand()*200));
      return { date:d, profitDelta:p, deposit:dep, withdraw:wit };
    });
    function toISO(d){ return d.toISOString().slice(0,10); }

    function rangeToStart(range){
      if (range === 'today') { const d = new Date(); d.setHours(0,0,0,0); return d; }
      return new Date(dataAll[0].date); // all
    }

    function computeStats(range){
      const start = rangeToStart(range);
      const points=[]; let baseBalance=1000, cumProfit=0, cumBalance=0;
      dataAll.forEach(r=>{
        if(r.date>=start){
          baseBalance += r.deposit - r.withdraw + r.profitDelta;
          cumProfit   += r.profitDelta;
          cumBalance   = baseBalance;
          points.push({x: toISO(r.date), profit:cumProfit, balance:cumBalance});
        }
      });
      return { points };
    }

    // EUR formatter + helper
    const NF_EUR = new Intl.NumberFormat('ro-RO',{style:'currency', currency:'EUR'});
    const UI = { lastPerf: null }; // memorează ultimele calcule pentru modal

    function setText(id, txt){
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    }

    // Helper: aplică obiectivele din API (target-urile reale)
    async function applyGoals(balanceEUR, profitEUR){
      try{
        const res = await fetch('/api/user/goals_get.php', { credentials:'include' });
        let targetBalCents = 0, targetProfCents = 0;
        if(res.ok){
          const g = await res.json();
          if(g && g.ok){
            targetBalCents = g.target_balance_cents || 0;
            targetProfCents = g.target_profit_quarter_cents || 0;
          }
        }

        const targetBal = targetBalCents/100;
        const targetProf = targetProfCents/100;

        // Sold țintă
        let qb = 0;
        if (targetBal > 0) qb = Math.max(0, Math.min(100, (balanceEUR / targetBal) * 100));
        document.getElementById('goalBalancePct').textContent =
          targetBal > 0 ? `${qb.toFixed(0)}% din ${NF_EUR.format(targetBal)}` : '—';
        document.getElementById('goalBalanceBar').style.width = qb + '%';

        // Profit trimestrial (opțional)
        let qp = 0;
        if (targetProf > 0) qp = Math.max(0, Math.min(100, (profitEUR / targetProf) * 100));
        document.getElementById('goalQuarterPct').textContent =
          targetProf > 0 ? `${qp.toFixed(0)}% din ${NF_EUR.format(targetProf)}` : '—';
        document.getElementById('goalQuarterBar').style.width = qp + '%';
      } catch(e){
        // fallback vizual
        document.getElementById('goalBalancePct').textContent = '—';
        document.getElementById('goalBalanceBar').style.width = '0%';
        document.getElementById('goalQuarterPct').textContent = '—';
        document.getElementById('goalQuarterBar').style.width = '0%';
      }
    }

    /* -------- KPI reale + sold real din wallet pentru toate perioadele + nomenclator „Creștere” -------- */
    async function fetchAndApplyRealSummary(range){
      try{
        // 1) Sumare pe perioadă
        const resSum = await fetch(`/api/user/summary.php?range=${encodeURIComponent(range)}`, { credentials:'include' });
        if(!resSum.ok) throw 0;
        const j = await resSum.json();
        if(!(j && j.ok)) throw 0;

        // lucrăm în CENTS (valori brute pentru randamentul strategiei)
        const rawInvestedC = Math.max(0, +j.invested_cents || 0);
        const rawProfitC   = Math.max(0, +j.profit_cents   || 0);
        const openingC     = Math.max(0, +j.opening_balance_cents || 0);
        let   dispBalC     = Math.max(0, +j.display_balance_cents || 0);

        // 2) Soldul REAL din wallet pentru „Sold curent”
        let walletC = null;
        try{
          const resWal = await fetch('/api/wallet/summary.php', { credentials:'include' });
          if(resWal.ok){
            const w = await resWal.json();
            walletC = Math.round(((w?.balance_eur ?? 0) * 100));
          }
        }catch(_){}

        if (walletC !== null && walletC >= 0) {
          dispBalC = walletC;
        }

        // 3) Reconciliere DOAR pe „Toate” pentru a explica retragerile & taxele
        let adjInvestedC = rawInvestedC;
        let adjProfitC   = rawProfitC;
        let cashoutC     = 0;

        if (range === 'all' && dispBalC >= 0) {
          const delta = Math.max(0, (rawInvestedC + rawProfitC) - dispBalC);
          cashoutC = delta;
          if (delta > 0) {
            const fromProfit = Math.min(rawProfitC, delta);
            adjProfitC   = Math.max(0, rawProfitC - fromProfit);
            adjInvestedC = Math.max(0, rawInvestedC - (delta - fromProfit));
          }
        }

        // 4) Randament (strategie/TWR-like)
        let perfPct = 0;
        if (typeof j.period_return_pct === 'number' && isFinite(j.period_return_pct)) {
          perfPct = j.period_return_pct;
        } else if (rawInvestedC > 0) {
          perfPct = (rawProfitC / rawInvestedC) * 100;
        }

        // 5) Afișare valori
        const invested = adjInvestedC / 100;
        const profit   = adjProfitC   / 100;
        const balance  = dispBalC     / 100;

        setText('sumInvested', NF_EUR.format(invested));
        setText('sumProfit',   NF_EUR.format(profit));
        setText('sumBalance',  NF_EUR.format(balance));
        setText('sumGrowth',   `${(+perfPct).toFixed(1)}%`);

        const gb = document.getElementById('sumGrowthBadge');
        if (gb) gb.classList.remove('hidden');

        // 6) Stocăm pentru modal
        UI.lastPerf = {
          range,
          perfPct,
          profitRaw: rawProfitC/100,
          investedRaw: rawInvestedC/100,
          profitAdj: adjProfitC/100,
          investedAdj: adjInvestedC/100,
          cashout: cashoutC/100,
          balance: balance,
          opening: openingC/100
        };

        // 7) Obiective
        await applyGoals(balance, profit);

      } catch(e){
        setText('sumInvested', NF_EUR.format(0));
        setText('sumProfit',   NF_EUR.format(0));
        setText('sumBalance',  NF_EUR.format(0));
        setText('sumGrowth',   '0%');
      }
    }

    /* ---------------- Charts ---------------- */
    let chartProfit, chartFund;
    function updateCharts(points){
      const labels = points.map(p=>p.x);
      const pdata  = points.map(p=>p.profit);
      const fdata  = points.map(p=>p.balance);
      const emptyP = document.getElementById('chartProfitEmpty');
      const emptyF = document.getElementById('chartFundEmpty');
      emptyP.classList.toggle('hidden', labels.length>0);
      emptyF.classList.toggle('hidden', labels.length>0);

      if(!chartProfit){
        chartProfit = new Chart(document.getElementById('chartProfit').getContext('2d'), {
          type:'line',
          data:{ labels, datasets:[{ label:'Profit cumulat', data:pdata, tension:.3 }]},
          options:{ responsive:true, plugins:{ legend:{ display:false } },
            scales:{ x:{ grid:{ color:'rgba(255,255,255,.06)' }, ticks:{ color:'#94a3b8' } },
                     y:{ grid:{ color:'rgba(255,255,255,.06)' }, ticks:{ color:'#94a3b8' } } } }
        });
      } else {
        chartProfit.data.labels = labels; chartProfit.data.datasets[0].data = pdata; chartProfit.update();
      }

      if(!chartFund){
        chartFund = new Chart(document.getElementById('chartFund').getContext('2d'), {
          type:'line',
          data:{ labels, datasets:[{ label:'Sold (fond personal)', data:fdata, tension:.3 }]},
          options:{ responsive:true, plugins:{ legend:{ display:false } },
            scales:{ x:{ grid:{ color:'rgba(255,255,255,.06)' }, ticks:{ color:'#94a3b8' } },
                     y:{ grid:{ color:'rgba(255,255,255,.06)' }, ticks:{ color:'#94a3b8' } } } }
        });
      } else {
        chartFund.data.labels = labels; chartFund.data.datasets[0].data = fdata; chartFund.update();
      }
    }

    /* ---------------- Tranzacții mock ---------------- */
    function fillTx(points){
      const list = document.getElementById('txList'); const empty = document.getElementById('txEmpty');
      list.innerHTML = '';
      const tx = [];
      points.slice(-40).forEach(p=>{
        const d = p.x; const src = dataAll.find(r=> toISO(r.date)===d);
        if(!src) return;
        if(src.deposit)  tx.push({ date:d, type:'deposit',  amount:src.deposit });
        if(src.withdraw) tx.push({ date:d, type:'withdraw', amount:src.withdraw });
        if(src.profitDelta) tx.push({ date:d, type: src.profitDelta>=0 ? 'profit' : 'pierdere', amount: Math.abs(src.profitDelta) });
      });
      tx.sort((a,b)=> a.date>b.date?-1:1);
      const last = tx.slice(0,10);
      if(last.length===0){ empty.classList.remove('hidden'); return; }
      empty.classList.add('hidden');
      last.forEach(t=>{
        const li = document.createElement('li');
        const badge = t.type==='deposit'
          ? '<span class="badge bg-emerald-500/20 text-emerald-200">Depunere</span>'
          : t.type==='withdraw'
            ? '<span class="badge bg-amber-500/20 text-amber-200">Retragere</span>'
            : t.type==='profit'
              ? '<span class="badge bg-cyan-500/20 text-cyan-200">Profit</span>'
              : '<span class="badge bg-rose-500/20 text-rose-200">Pierdere</span>';
        const sign = (t.type==='withdraw' || t.type==='pierdere')?'-':'+';
        li.className = 'rounded-xl border border-white/10 bg-slate-900/60 p-3 flex items-center justify-between';
        li.innerHTML = `<div class="flex items-center gap-3">
            <i class="fa-solid ${t.type==='deposit'?'fa-circle-plus':t.type==='withdraw'?'fa-wallet':t.type==='profit'?'fa-arrow-trend-up':'fa-arrow-trend-down'} text-slate-300"></i>
            <div><div class="font-medium">${badge}</div><div class="text-xs text-slate-400">${t.date}</div></div>
          </div>
          <div class="font-semibold">${sign}${NF_EUR.format(t.amount)}</div>`;
        list.appendChild(li);
      });
    }

    /* ---------------- Lumen AI ---------------- */
    async function lumenInsight(){
      kpi('kpi:lumen_click', {});
      const out = document.getElementById('lumenOut');
      const err = document.getElementById('lumenErr');
      out.textContent = 'Analizez ultimele date...';
      err.classList.add('hidden');

      try {
        const [rAll, rToday, rProc, rMet, rWal] = await Promise.all([
          fetch('/api/user/summary.php?range=all',    { credentials:'include' }),
          fetch('/api/user/summary.php?range=today',  { credentials:'include' }),
          fetch('/api/user/withdrawals/processing_stats.php', { credentials:'include' }),
          fetch('/api/platform/metrics.php',          { credentials:'include' }),
          fetch('/api/wallet/summary.php',            { credentials:'include' }),
        ]);

        const [jAll, jToday, jProc, jMet, jWal] = await Promise.all([
          rAll.ok   ? rAll.json()   : null,
          rToday.ok ? rToday.json() : null,
          rProc.ok  ? rProc.json()  : null,
          rMet.ok   ? rMet.json()   : null,
          rWal?.ok  ? rWal.json()   : null,
        ]);

        // valori brute din summary (în CENTS)
        const rawInvestedC = Math.max(0, jAll?.invested_cents ?? 0);
        const rawProfitC   = Math.max(0, jAll?.profit_cents   ?? 0);
        let   dispBalC     = Math.max(0, jAll?.display_balance_cents ?? 0);

        // override „Sold curent” cu wallet
        const walletC = Number.isFinite(jWal?.balance_eur) ? Math.round(jWal.balance_eur * 100) : null;
        if (walletC !== null && walletC >= 0) dispBalC = walletC;

        // reconciliere „Retrageri & taxe” (cash-out) pentru All-time
        const deltaC        = Math.max(0, (rawInvestedC + rawProfitC) - dispBalC);
        const cutFromProfit = Math.min(rawProfitC, deltaC);
        const investedC     = Math.max(0, rawInvestedC - (deltaC - cutFromProfit));
        const profitC       = Math.max(0, rawProfitC - cutFromProfit);

        // valori în EUR pentru afișare
        const invested = investedC / 100;
        const profit   = profitC   / 100;
        const balance  = dispBalC  / 100;
        const cashout  = deltaC    / 100;

        const growthAll   = Number.isFinite(jAll?.period_return_pct)   ? jAll.period_return_pct   : 0;
        const todayRetPct = Number.isFinite(jToday?.period_return_pct) ? jToday.period_return_pct : 0;

        const avgSec    = (jProc?.ok && Number.isFinite(jProc.avg_seconds)) ? jProc.avg_seconds : 0;
        const investors = jMet?.investors_total      ?? 800;
        const pending   = jMet?.pending_withdrawals  ?? 6;
        const liquidity = jMet?.liquidity_ratio      ?? 0.80;

        function clamp(x,min,max){ return Math.max(min, Math.min(max,x)); }
        function sigmoid(x,k){ return 1/(1+Math.exp(-(k||1)*x)); }
        const FP = { base:0.0399, min:0.0399, max:0.2199, a:0.012, k:0.7, N0:500, scale:300, b:0.007, pending_norm:50, c:0.010 };
        const sInvest  = sigmoid((investors - FP.N0)/FP.scale, FP.k);
        const sPending = clamp(pending / FP.pending_norm, 0, 1);
        const sLiq     = clamp(1 - (liquidity ?? 1), 0, 1);
        const rate     = clamp(FP.base + FP.a*sInvest + FP.b*sPending + FP.c*sLiq, FP.min, FP.max);
        const level    = rate <= FP.base+0.02 ? 'Normală' : rate <= FP.base+0.08 ? 'Moderată' : 'Ridicată';

        const NF = new Intl.NumberFormat('ro-RO',{ style:'currency', currency:'EUR' });
        function humanizeAvg(seconds){
          if(!Number.isFinite(seconds) || seconds<=0) return '—';
          const h = Math.round(seconds/3600);
          if (h < 48) return `~${h}h`;
          const d = Math.round((seconds/86400)*10)/10;
          return (d % 1 === 0) ? `~${d} zile` : `~${d.toFixed(1)} zile`;
        }
        const arrow = todayRetPct>0 ? '↑' : todayRetPct<0 ? '↓' : '→';

        const cashTxt = (deltaC > 0) ? `; retrageri & taxe ${NF.format(cashout)}` : '';
        const pctTodayClass = todayRetPct>0 ? 'text-emerald-300' : (todayRetPct<0 ? 'text-rose-300' : 'text-slate-200');
        const surgeBadgeCls = (()=>{
          if(level==='Normală')  return 'badge bg-emerald-500/15 text-emerald-200 border border-emerald-400/30';
          if(level==='Moderată') return 'badge bg-amber-500/15 text-amber-200 border border-amber-400/30';
          return 'badge bg-rose-500/15 text-rose-200 border border-rose-400/30';
        })();

        out.innerHTML = `
          <!-- KPI-uri principale -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
              <div class="text-xs text-slate-400">Astăzi</div>
              <div class="text-lg font-extrabold ${pctTodayClass}">${arrow} ${todayRetPct.toFixed(2)}%</div>
            </div>
            <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
              <div class="text-xs text-slate-400">Sold curent</div>
              <div class="text-lg font-extrabold">${NF.format(balance)}</div>
            </div>
            <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
              <div class="text-xs text-slate-400">Randament total</div>
              <div class="text-lg font-extrabold">${growthAll.toFixed(1)}%</div>
            </div>
          </div>

          <!-- Breakdown „de unde vin cifrele” -->
          <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
            <div class="flex items-center justify-between">
              <div class="text-xs text-slate-400">Componență sold (all-time)</div>
              <button type="button" class="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-dotted" 
                      onclick="this.closest('div').nextElementSibling.classList.toggle('hidden')">arată/ascunde</button>
            </div>
            <div class="mt-2 grid grid-cols-2 gap-y-1 text-sm">
              <div>Investiții</div>            <div class="text-right font-medium">${NF.format(invested)}</div>
              <div>Profit</div>                 <div class="text-right font-medium">${NF.format(profit)}</div>
              <div class="text-slate-400">Retrageri & taxe</div>
              <div class="text-right text-slate-300">− ${NF.format(cashout)}</div>
              <div class="pt-1 border-t border-white/10 font-semibold">Sold curent</div>
              <div class="pt-1 border-t border-white/10 text-right font-semibold">${NF.format(balance)}</div>
            </div>
            <div class="hidden mt-3 text-[11px] leading-relaxed text-slate-400">
              Metodă: <span class="font-mono">Investiții + Profit − (Retrageri & taxe) = Sold</span>. 
              Soldul se citește din wallet în timp real; când retragi, scădem mai întâi din profit, apoi din investiții.
            </div>
          </div>

          <!-- Operațional -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3 flex items-center justify-between">
              <div>
                <div class="text-xs text-slate-400">Procesare retrageri (medie)</div>
                <div class="font-semibold">${avgSec>0 ? humanizeAvg(avgSec) : '—'}</div>
              </div>
              <span class="${surgeBadgeCls}">${level}</span>
            </div>
            <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
              <div class="text-xs text-slate-400">Taxă dinamică estimată</div>
              <div class="font-semibold">${(rate*100).toFixed(1)}% + 0,99 €</div>
              <div class="text-[11px] text-slate-500">Influențată de: #investitori · cereri în curs · lichiditate</div>
            </div>
          </div>
        `;
      } catch (e){
        out.textContent = 'Observ o evoluție stabilă a soldului; strategia moderată rămâne potrivită.';
        err.classList.add('hidden');
      }
    }

    /* ---------------- Gemini ---------------- */
    async function geminiAnalyze(){
      kpi('kpi:gemini_click', {});
      const q   = document.getElementById('geminiQ').value.trim();
      const out = document.getElementById('geminiOut');
      const err = document.getElementById('geminiErr');
      if(!q){ out.textContent = 'Scrie o întrebare pentru analiză.'; return; }

      out.textContent = 'Generez analiză…';
      err.classList.add('hidden');

      try{
        const r = await fetch('/api/ai/gemini_analyze.php', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ q })
        });
        const j = await r.json().catch(()=>null);
        if(!r.ok || !j){ throw new Error('http'); }
        if (r.status === 502) {
          out.textContent = 'Nu am reușit conexiunea către serviciul AI (502). Reîncearcă în câteva secunde.';
          return;
        }

        if(j.ok && j.text){
          out.textContent = j.text;
        } else if (j.error === 'no_api_key'){
          out.innerHTML = 'Serviciul AI nu este configurat pe server (lipsă API key).';
        } else if (j.error === 'rate_limited'){
          out.textContent = 'Te rog încearcă din nou în câteva secunde.';
        } else {
          throw new Error('generic');
        }
      } catch(e){
        out.textContent = '';
        err.classList.remove('hidden');
      }
    }

    /* ---------------- Proiecții ---------------- */
    function calcProjections(){
      const amount = parseFloat(document.getElementById('projAmount').value||'0');
      const r = parseFloat(document.getElementById('projScenario').value);
      const n = parseInt(document.getElementById('projDays').value,10);
      const final = +(amount * Math.pow(1+r, n)).toFixed(2);
      const prof  = +(final - amount).toFixed(2);
      document.getElementById('projFinal').textContent  = NF_EUR.format(final);
      document.getElementById('projProfit').textContent = NF_EUR.format(prof);
      kpi('kpi:projection_calc', { amount, r, n, final, prof });
    }

    /* ---------------- Personalizare widget-uri ---------------- */
    const grid = document.getElementById('widgets');
    let editing = false; let sortable;
    document.getElementById('btnEdit').addEventListener('click', ()=>{
      editing = !editing; kpi('kpi:edit_toggle',{editing});
      document.getElementById('btnEdit').classList.toggle('hidden', editing);
      document.getElementById('btnSave').classList.toggle('hidden', !editing);
      document.getElementById('btnReset').classList.toggle('hidden', !editing);
      grid.querySelectorAll('[data-widget-id]').forEach(card=>{
        card.classList.toggle('ring-2', editing);
        card.classList.toggle('ring-cyan-500/50', editing);
        let tools = card.querySelector('.__tools');
        if(editing && !tools){
          tools = document.createElement('div'); tools.className='__tools flex items-center gap-2 mb-2';
          tools.innerHTML = `<button class='__hide rounded-lg px-2 py-1 text-xs border border-white/10 hover:border-white/20'><i class="fa-regular fa-eye-slash"></i> Ascunde</button>`;
          card.insertBefore(tools, card.firstChild);
          tools.querySelector('button.__hide').addEventListener('click',()=>{ card.classList.add('hidden-card'); });
        } else if(!editing && tools){ tools.remove(); }
      });
      if(editing){
        sortable = new Sortable(grid, { animation:150, handle: '.drag-handle', ghostClass:'opacity-50' });
      } else if(sortable){ sortable.destroy(); }
    });
    document.getElementById('btnSave').addEventListener('click', async ()=>{
      const layout = Array.from(grid.querySelectorAll('[data-widget-id]'))
        .filter(x=>!x.classList.contains('hidden-card'))
        .map(x=>x.dataset.widgetId);
      kpi('kpi:layout_save',{layout});
      try{ await fetch('/api/user_prefs/save_layout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ layout }) }); }catch(e){}
      document.getElementById('btnEdit').click();
    });
    document.getElementById('btnReset').addEventListener('click', ()=>{
      kpi('kpi:layout_reset',{});
      grid.querySelectorAll('[data-widget-id]').forEach(x=>x.classList.remove('hidden-card'));
      document.getElementById('btnEdit').click();
    });

    /* ---------------- Growth Modal init ---------------- */
    (function growthModalInit(){
      const modal   = document.getElementById('growthModal');
      const btn     = document.getElementById('growthCard');
      const close1  = document.getElementById('gmClose');
      const close2  = document.getElementById('gmClose2');

      function fill(){
        const d = UI.lastPerf || {};
        const rangeLabel = d.range === 'today' ? 'Astăzi' : 'Toate';

        document.getElementById('gmRange').textContent     = rangeLabel;
        document.getElementById('gmPerfPct').textContent   = Number.isFinite(d.perfPct) ? `${d.perfPct.toFixed(2)}%` : '—';
        document.getElementById('gmProfitRaw').textContent = Number.isFinite(d.profitRaw) ? NF_EUR.format(d.profitRaw) : '—';
        document.getElementById('gmCashout').textContent   = (d.range==='all' && Number.isFinite(d.cashout) && d.cashout>0)
          ? `− ${NF_EUR.format(d.cashout)}`
          : '—';
        document.getElementById('gmProfitAdj').textContent = Number.isFinite(d.profitAdj) ? NF_EUR.format(d.profitAdj) : '—';
        document.getElementById('gmBalance').textContent   = Number.isFinite(d.balance) ? NF_EUR.format(d.balance) : '—';

        const note = (d.range==='today')
          ? 'Notă: „Sold curent” este valoarea globală a contului. Randamentul de azi se referă strict la performanța strategiei în această zi; retragerile nu sunt descompuse zilnic aici.'
          : 'Notă: „Retrageri & taxe (estimate)” provin din reconciliere: (Investit brut + Profit brut) − Sold curent.';
        document.getElementById('gmNote').textContent = note;
      }

      function open(){
        fill();
        modal.classList.remove('hidden');
        btn?.setAttribute('aria-expanded','true');
      }
      function close(){
        modal.classList.add('hidden');
        btn?.setAttribute('aria-expanded','false');
      }

      btn?.addEventListener('click', open);
      btn?.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); open(); }});
      close1?.addEventListener('click', close);
      close2?.addEventListener('click', close);
      modal?.addEventListener('click', (e)=>{ if(e.target===modal) close(); });
    })();

    /* ---------------- Refresh: mock pentru grafice/tx, REAL pentru KPI ---------------- */
    async function refreshAll(){
      const range = document.getElementById('dateRange').value;

      // placeholders
      setText('sumInvested','—'); setText('sumProfit','—'); setText('sumBalance','—'); setText('sumGrowth','—');

      // Vizual
      const s = computeStats(range);
      updateCharts(s.points);
      fillTx(s.points);

      // KPI reale + nomenclator
      await fetchAndApplyRealSummary(range);

      // Proiecții
      calcProjections();
    }

    // Hooks UI
    document.getElementById('dateRange').addEventListener('change', refreshAll);
    document.getElementById('btnLumen').addEventListener('click', lumenInsight);
    document.getElementById('btnGemini').addEventListener('click', geminiAnalyze);
    document.getElementById('projForm').addEventListener('input', calcProjections);

    // Init
    document.addEventListener('DOMContentLoaded', ()=>{
      const sel = document.getElementById('dateRange');
      if (sel) sel.value = 'all';
      refreshAll();
    });
  </script>

  <!-- PI — Procesare medie (Widget) -->
  <script>
  (function(){
    document.querySelectorAll('.pi-avgproc-widget').forEach(init);
    function init(host){
      const endpoint = host.getAttribute('data-endpoint') || '/api/user/withdrawals/processing_stats.php';
      host.innerHTML = `
        <style>
          .piap-card{display:flex;align-items:center;gap:.75rem;padding:.9rem 1rem;border-radius:14px;
            background:rgba(2,6,23,.75);color:#e5e7eb;border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(6px)}
          .piap-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;
            background:linear-gradient(135deg,#2563eb,#06b6d4,#14b8a6);font-size:16px;color:#0b1220}
          .piap-col{display:flex;flex-direction:column}
          .piap-label{font-size:12px;color:#94a3b8}
          .piap-value{font-weight:800;font-size:18px;line-height:1.1}
          .piap-fine{font-size:11px;color:#64748b;margin-top:2px}
          .piap-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.25);border-top-color:#06b6d4;border-radius:50%;
            animation:piap-rot 0.9s linear infinite;display:inline-block;vertical-align:-2px;margin-right:6px}
          @keyframes piap-rot{to{transform:rotate(360deg)}}
        </style>
        <div class="piap-card">
          <div class="piap-icon">⏱️</div>
          <div class="piap-col">
            <div class="piap-label">Procesare medie</div>
            <div class="piap-value" data-val>—</div>
            <div class="piap-fine" data-sub><span class="piap-spin"></span>Se calculează…</div>
          </div>
        </div>
      `;

      const elVal = host.querySelector('[data-val]');
      const elSub = host.querySelector('[data-sub]');

      fetch(endpoint, { credentials: 'include' })
        .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP '+r.status)))
        .then(j => {
          const avg = (j && j.ok && Number.isFinite(j.avg_seconds) && j.avg_seconds>0) ? j.avg_seconds : 0;
          elVal.textContent = avg ? humanizeAvg(avg) : '—';
          elSub.textContent = avg ? 'din ultimele 12 luni' : 'insuficiente date';
        })
        .catch(() => {
          elVal.textContent = '—';
          elSub.textContent = 'indisponibil momentan';
        });

      function humanizeAvg(seconds){
        if(!Number.isFinite(seconds) || seconds<=0) return '—';
        const h = Math.round(seconds/3600);
        if (h < 48) return `~${h}h`;
        const d = Math.round((seconds/86400)*10)/10;
        return (d % 1 === 0) ? `~${d} zile` : `~${d.toFixed(1)} zile`;
      }
    }
  })();
  </script>
  <!-- /PI — Procesare medie (Widget) -->

  <script>
(function () {
  const host = document.getElementById('mentionToast');
  if (!host) return;

  const TOAST_STATE = {
    max: 3,          // nr. maxim de toast-uri simultane
    items: []        // { elem }
  };

  window.showToast = function showToast(kind, text, opts) {
    kind = kind || 'info';
    const cfg = opts || {};
    const ttl = cfg.ttl || (kind === 'error' ? 5000 : 3000);

    if (!text) return;

    // dacă sunt prea multe, ștergem cele mai vechi
    while (TOAST_STATE.items.length >= TOAST_STATE.max) {
      const old = TOAST_STATE.items.shift();
      if (old && old.elem) old.elem.remove();
    }

    const card = document.createElement('div');
    card.className = 'toast-card';
    card.dataset.kind = kind;
    card.innerHTML = `
      <div class="icon">${kind === 'error' ? '⚠️' : kind === 'success' ? '✔️' : 'ℹ️'}</div>
      <div class="text-sm">${text}</div>
    `;

    host.appendChild(card);
    TOAST_STATE.items.push({ elem: card });

    setTimeout(() => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(8px)';
      setTimeout(() => {
        card.remove();
        TOAST_STATE.items = TOAST_STATE.items.filter(x => x.elem !== card);
      }, 220);
    }, ttl);
  };
})();
</script>


<!-- Chat Comunitate (SSE + dedup + optimistic + lazy-load gated + search + presence + typing + day-seps + grouping + mentions + reactions + shift+enter + char-counter, fără buton Trimite) -->
<script>
(function(){
  // împiedică browserul să păstreze poziția de scroll la refresh
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch(_) {}

  const feed  = document.getElementById('chatFeed');
  const form  = document.getElementById('chatForm');
  let   input = document.getElementById('chatInput');   // poate fi input sau textarea
  let   btn   = document.getElementById('chatSend');     // poate lipsi (îl eliminăm)
  const liveB = document.getElementById('chatLive');
  if (!feed || !form) return;
    const csrfToken = document.body.dataset.csrfChat || '';
      // expunem csrf-ul și global, dacă vrei să-l folosești în alte scripturi
  window.PI_CSRF = csrfToken;



  // fără buton: dacă există în markup, îl eliminăm ca să economisim spațiu
  if (btn) { btn.remove(); btn = null; }

  /* ——— upgrade: transformă input text în textarea pentru suport linii noi ——— */
  function upgradeToTextarea(el){
    if (!el || el.tagName === 'TEXTAREA') return el;
    const ta = document.createElement('textarea');
    ta.id = el.id;
    ta.name = el.name || 'message';
    ta.className = el.className || '';
    ta.placeholder = el.placeholder || '';
    ta.rows = 1;
    ta.autocomplete = 'off';
    ta.spellcheck = el.spellcheck ?? true;
    ta.value = el.value || '';
    // stil minim pt auto-resize
    ta.style.resize = 'none';
    ta.style.overflowY = 'auto';
    ta.style.maxHeight = '9rem';
    el.replaceWith(ta);
    return ta;
  }
  input = upgradeToTextarea(input);

  /* ——— feature flags ——— */
  const FLAGS = { reactions: true };

  /* ——— limite & contor caractere ——— */
  const MAX_CHARS = 1000;

  // overlay contor + hint „enter trimite”
  function ensureCharCounter(){
    // wrapper relativ pt overlay
    if (!input.parentElement.classList.contains('pi-input-wrap')){
      const wrap = document.createElement('div');
      wrap.className = 'pi-input-wrap';
      wrap.style.position = 'relative';
      wrap.style.width = '100%';
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
    }
    // confort vizual
    input.style.lineHeight    = '1.4';
    input.style.paddingTop    = '10px';
    input.style.paddingBottom = '10px';
    input.style.paddingRight  = '9.5rem'; // loc pt overlay

    let c = document.getElementById('chatCharCounter');
    if (!c){
      c = document.createElement('div');
      c.id = 'chatCharCounter';
      c.className = 'pi-char-counter text-xs text-slate-400';
      c.style.position = 'absolute';
      c.style.right    = '12px';
      c.style.bottom   = '8px';
      c.style.display  = 'flex';
      c.style.gap      = '10px';
      c.style.fontSize = '11px';
      c.style.color    = '#94a3b8';
      c.style.pointerEvents = 'none';
      c.innerHTML = `
        <span id="charCountVal">0</span>/<span>${MAX_CHARS}</span>
        <span>enter = trimite</span><span>shift+enter = linie nouă</span>`;
      input.parentElement.appendChild(c);
    }
    return c;
  }
  const counterEl = ensureCharCounter();
  const countVal  = counterEl.querySelector('#charCountVal');

  function updateCounter(){
    const len = (input.value || '').length;
    countVal.textContent = String(len);
    const over = len > MAX_CHARS;
    counterEl.classList.toggle('text-rose-400', over);
    // fără buton: nimic de dezactivat; validăm la submit
    if (btn){
      const busy = btn.dataset.busy === '1';
      btn.disabled = busy || over || !(/\S/.test(input.value||''));
    }
  }

  /* ——— auto-resize textarea (max ~32% viewport sau 280px) ——— */
  function autoGrow(){
    const stick = Math.abs(feed.scrollHeight - feed.scrollTop - feed.clientHeight) < 6;
    const max = Math.min(Math.round(window.innerHeight * 0.32), 280);
    input.style.maxHeight = max + 'px';
    input.style.height = 'auto';
    const h = Math.min(input.scrollHeight, max);
    input.style.height = h + 'px';
    input.style.overflowY = (input.scrollHeight > max) ? 'auto' : 'hidden';
    if (stick) feed.scrollTop = feed.scrollHeight;
  }
  window.addEventListener('resize', autoGrow, { passive:true });

  // hint în placeholder
  if (input && !/shift\+enter/i.test(input.placeholder||'')){
    input.placeholder = (input.placeholder||'scrie un mesaj…') + ' · enter = trimite · shift+enter = linie nouă';
  }

  /* ——— util probe endpoint (pt reacții) ——— */
  async function probeHEAD(path){
    try{ const r = await fetch(path, { method:'HEAD', credentials:'include' }); return r.ok; }catch{ return false; }
  }
  function disableReactions(reason){
    FLAGS.reactions = false;
    document.querySelectorAll('.react-bar, .react-btn').forEach(el => el.remove());
    console.info('[chat] reactions disabled:', reason||'probe-failed');
  }

  /* ——— UI: căutare ——— */
  (()=> {
    const host = feed.parentElement;
    if (!host.querySelector('#chatSearchBox')) {
      const box = document.createElement('div');
      box.id = 'chatSearchBox';
      box.className = 'mb-2';
      box.innerHTML = `
        <div class="relative">
          <input id="chatSearchInput" maxlength="120" autocomplete="off"
                 class="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
                 placeholder="caută în arhivă (enter)…" />
          <div id="chatSearchResults"
               class="hidden absolute top-full mt-2 left-0 right-0 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/95 p-2 space-y-2 z-30"></div>
        </div>`;
      host.insertBefore(box, feed);
    }
  })();

  /* ——— UI: presence + typing ——— */
  const host = feed.parentElement;
  if (!host.querySelector('#chatPresenceBar')) {
    const bar = document.createElement('div');
    bar.id = 'chatPresenceBar';
    bar.className = 'mb-2 flex flex-wrap gap-1 text-xs text-slate-400';
    host.insertBefore(bar, feed);
  }
  if (!host.querySelector('#chatTypingBar')) {
    const t = document.createElement('div');
    t.id = 'chatTypingBar';
    t.className = 'mt-1 h-4 text-xs text-slate-400';
    host.insertBefore(t, form);
  }
  const presBar   = document.getElementById('chatPresenceBar');
  const typingBar = document.getElementById('chatTypingBar');
  const replyBox      = document.getElementById('replyContext');
  const replyUserEl   = document.getElementById('replyUser');
  const replyPrevEl   = document.getElementById('replyPreview');
  const replyCancelEl = document.getElementById('replyCancel');

    /* ——— State & utilitare ——— */
  const meName  = (document.body.dataset.userName || 'Investitor').trim();
  const meId    = parseInt(document.body.dataset.userId||'0',10) || 0;
  const MSG_INDEX = new Map(); // id => {id,user_name,body,ts}
  const MSG_ORDER = [];
  let replyTarget = null;

  // coadă offline per user
  const OFFLINE_KEY = `pi:chat:offlineQueue:${meId||0}`;
  let OFFLINE_QUEUE = [];
  let offlineWarned = false;

  function loadOfflineQueue(){
    try{
      const raw = localStorage.getItem(OFFLINE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) OFFLINE_QUEUE = arr;
    }catch{}
  }

  function saveOfflineQueue(){
    try{
      if (!OFFLINE_QUEUE || !OFFLINE_QUEUE.length){
        localStorage.removeItem(OFFLINE_KEY);
        return;
      }
      // păstrăm doar ultimele 50 de mesaje offline
      const slim = OFFLINE_QUEUE.slice(-50);
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(slim));
    }catch{}
  }

  let mentionUnreadCount = 0;
  let mentionNotifications = [];
  let mentionRefreshTimer = null;
  let VIEW_MENTIONS = false;

  // scroll control: blocăm lazy-load la boot și forțăm „stick to bottom”
  let BOOTING = true;
  let ALLOW_LAZY = false;

    replyCancelEl?.addEventListener('click', (e)=>{ e.preventDefault(); clearReplyTarget(); });

  function renderReplyContext(){
    if (!replyBox) return;
    if (replyTarget && replyTarget.id){
      replyBox.classList.remove('hidden');
      if (replyUserEl) replyUserEl.textContent = replyTarget.user || replyTarget.user_name || 'mesaj';
      if (replyPrevEl) replyPrevEl.textContent = replyTarget.body || '';
    } else {
      replyBox.classList.add('hidden');
    }
  }

  function setReplyTarget(meta){
    if (!meta || !meta.id) return;
    replyTarget = {
      id: meta.id,
      user: meta.user || meta.user_name || '',
      body: (meta.body || '').trim()
    };
    renderReplyContext();
    if (input) input.focus();
  }

  function startReplyFromRow(row){
    if (!row) return;
    const msgId = parseInt(row.dataset.msgId || '0', 10);
    if (!msgId) return;
    const meta = {
      id: msgId,
      user: row.dataset.user || '',
      body: (row.dataset.bodyRaw || row.querySelector('[data-body]')?.textContent || '').trim()
    };
    setReplyTarget(meta);
  }

  function clearReplyTarget(){
    replyTarget = null;
    renderReplyContext();
  }

  const NF_TIME = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' });
  const NF_DAY_SHORT = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short' });

  const esc = s => (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  function indexMessage(m){
    if (!m || !m.id) return;
    const entry = {
      id: m.id|0,
       user_id: m.user_id || null,
      user_name: m.user_name || '',
      body: m.body || '',
      ts: m.ts || Math.floor(Date.now()/1000)
    };
    if (!MSG_INDEX.has(entry.id)) MSG_ORDER.push(entry.id);
    MSG_INDEX.set(entry.id, entry);

    // menținem indexul compact (max ~2000 mesaje)
    if (MSG_ORDER.length > 2000) {
      const drop = MSG_ORDER.shift();
      MSG_INDEX.delete(drop);
    }
  }

  function resolveReplyMeta(m){
    const rid = m.reply_to || (m.reply && m.reply.id) || null;
    if (!rid) return null;

    const cached = MSG_INDEX.get(rid) || {};
    const fallback = m.reply || {};
    const user = cached.user_name || fallback.user_name || fallback.user || '';
     const uid  = cached.user_id || fallback.user_id || null;
    const body = cached.body || fallback.body || '';

    return {
      id: rid,
       user_id: uid,
      user_name: user,
      body
    };
  }

  function formatRelativeTime(tsSec) {
    if (!tsSec) return 'acum';

    const nowSec = Math.floor(Date.now() / 1000);
    let diff = nowSec - tsSec;      // secunde în urmă (+) sau în viitor (-)
    const past = diff >= 0;
    diff = Math.abs(diff);

    // sub 10 secunde
    if (diff < 10) return past ? 'acum' : 'în câteva secunde';

    // sub 1 minut
    if (diff < 60) return past ? 'acum câteva secunde' : 'în câteva secunde';

    const min = Math.round(diff / 60);
    if (min === 1) return past ? 'acum 1 min' : 'în 1 min';
    if (min < 60)  return past ? `acum ${min} min` : `în ${min} min`;

    const h = Math.round(min / 60);
    if (h === 1) return past ? 'acum 1 oră' : 'în 1 oră';
    if (h < 24)  return past ? `acum ${h} ore` : `în ${h} ore`;

    const d = Math.round(h / 24);
    if (d === 1 && past) return 'ieri';
    if (d < 7)           return past ? `acum ${d} zile` : `în ${d} zile`;

    // pentru mesaje vechi: dată + oră, localizate ro-RO
    const dObj = new Date(tsSec * 1000);
    return NF_DAY_SHORT.format(dObj) + ', ' + NF_TIME.format(dObj);
  }

  function refreshRelativeTimes() {
    const root = document.getElementById('chatFeed');
    if (!root) return;

    root.querySelectorAll('[data-time][data-ts]').forEach(el => {
      const tsSec = parseInt(el.dataset.ts || '0', 10) || 0;
      el.textContent = formatRelativeTime(tsSec);
    });
  }
  
    const EDIT_WINDOW_SEC = 120; // 2 minute

  function canEditNowTs(tsSec) {
    if (!tsSec) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    const diff = nowSec - tsSec;
    return diff >= 0 && diff <= EDIT_WINDOW_SEC;
  }

  function canEditNowForRow(row) {
    if (!row || row.dataset.mine !== '1') return false;
    if (row.classList.contains('msg-deleted')) return false;
    const tsSec = parseInt(row.dataset.ts || '0', 10) || 0;
    return canEditNowTs(tsSec);
  }

  function refreshEditControls() {
    const feedEl = document.getElementById('chatFeed');
    if (!feedEl) return;

    const nowSec = Math.floor(Date.now() / 1000);

    feedEl.querySelectorAll('.msg[data-mine="1"]').forEach(row => {
      const tsSec = parseInt(row.dataset.ts || '0', 10) || 0;
      const diff = tsSec ? nowSec - tsSec : EDIT_WINDOW_SEC + 1;
      const editBtns = row.querySelectorAll('.edit-msg-btn, .delete-msg-btn');

      if (!editBtns.length) return;

      // dacă a trecut fereastra de 2 minute, scoatem butoanele
      if (diff > EDIT_WINDOW_SEC || diff < 0) {
        editBtns.forEach(btn => btn.remove());
      }
    });
  }

  function tickTimeUI() {
    refreshRelativeTimes();   // „acum / acum 2 min”
    refreshEditControls();    // enable/disable edit/șterge
  }


  const atBottom = () => Math.abs(feed.scrollHeight - feed.scrollTop - feed.clientHeight) < 6;
  const scrollBottomNow = () => { feed.scrollTop = feed.scrollHeight; };
  const scrollBottomSmooth = () => feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });

  const genCID = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);

  let lastId = +(sessionStorage.getItem('chat:lastId') || 0);
  let oldestIdLoaded = null;
  let sse = null, pollTimer = null, loadingOlder = false, noMoreOlder = false;
  const POLL_MS=4000, PAGE_LIMIT=50, MAX_SEEN=6000;
    // notificări browser pentru @mențiuni
  let mentionPushEnabled = false;
  let mentionPushLastTs = 0;
  const MENTION_PUSH_COOLDOWN_MS = 15000; // min. 15s între notificări

    // câtă „fereastră” ținem în dom (mesaje vizibile)
  const MAX_DOM_MSG = 400; // poți urca la 600–800 dacă vrei


  const SEEN    = new Set();
  const PENDING = new Map();
    function markPendingOffline(cid){
    const p = PENDING.get(cid);
    if (!p?.row) return;
    const ic = p.row.querySelector('[data-status]');
    if (ic){
      ic.className = 'fa-solid fa-circle-exclamation ml-2 text-amber-300';
      ic.title = 'fără conexiune. mesaj în coadă offline.';
    }
    const bubble = p.row.querySelector('.bubble');
    if (bubble) bubble.classList.add('msg-pending');
  }

  function markPendingSending(cid){
    const p = PENDING.get(cid);
    if (!p?.row) return;
    const ic = p.row.querySelector('[data-status]');
    if (ic){
      ic.className = 'fa-regular fa-clock ml-2 text-slate-400';
      ic.title = 'se trimite…';
    }
    const bubble = p.row.querySelector('.bubble');
    if (bubble) bubble.classList.remove('msg-pending');
  }

    function notifyOfflineOnce(){
    if (offlineWarned) return;
    offlineWarned = true;
    showChatToast(
      'Nu ai conexiune la internet. mesajele tale rămân în coadă și se trimit automat când revine conexiunea.',
      'info'
    );
  }


  function queueOffline(payload){
    if (!payload || !payload.cid) return;
    // nu dublăm același cid
    if (OFFLINE_QUEUE.some(x => x.cid === payload.cid)) return;

    OFFLINE_QUEUE.push({
      cid: payload.cid,
      text: payload.txt,
      ts: payload.ts,
      mentions: payload.mentionsPayload || [],
      mention_names: payload.mentionsNames || [],
      reply_to: payload.reply_to || null,
      reply_preview: payload.reply_preview || null
    });

    saveOfflineQueue();
    markPendingOffline(payload.cid);
    notifyOfflineOnce();
  }

  async function flushOfflineQueue(){
    if (!OFFLINE_QUEUE.length || !navigator.onLine) return;

    // am net, resetăm flag-ul de alert
    offlineWarned = false;

    const items = [...OFFLINE_QUEUE];
    for (const item of items){
      const { cid, text, ts, mentions, mention_names, reply_to, reply_preview } = item;
      if (!cid || !text) continue;

      // dacă nu mai avem pending în memorie (ex: refresh), recreăm bulele
      if (!PENDING.has(cid)){
        renderPending(
          cid,
          text,
          ts || Math.floor(Date.now()/1000),
          Array.isArray(mention_names)
            ? mention_names.map(n => ({ user_id:null, name:n }))
            : [],
          reply_preview || (reply_to ? { id: reply_to } : null)
        );
      } else {
        markPendingSending(cid);
      }

      try{
        const r = await fetch('/api/chat/send.php', {
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'X-CSRF-Token': csrfToken || ''
          },
          credentials:'include',
          body: JSON.stringify({
            text,
            client_id: cid,
            mentions: Array.isArray(mentions) ? mentions : [],
            mention_names: Array.isArray(mention_names) ? mention_names : [],
             reply_to: reply_to || null,
            reply_preview: reply_preview || null,
            csrf_token: csrfToken || ''
          })
        });
        const j = await r.json().catch(()=>null);

        if (r.ok && j && j.ok){
          // serverul a acceptat mesajul (client_id unic => safe)
          OFFLINE_QUEUE = OFFLINE_QUEUE.filter(x => x.cid !== cid);
          saveOfflineQueue();

          // dacă SSE nu e live, sincronizăm manual
          if (!sse || sse.readyState !== 1){
            await pullLatest();
          }
        } else if (j && (j.error === 'csrf_invalid' || j.error === 'unauthorized')){
          showChatToast(
            'Sesiunea a expirat. Reîncarcă pagina pentru a trimite mesajele rămase din coada offline.',
            'error'
          );
          break;
        } else if (j && (j.error === 'rate_limited' || j.error === 'throttled')){
          // scrii prea repede sau alt guard de server => mai încercăm mai târziu
          break;
        } else {

          // altă eroare: nu ștergem din coadă, lăsăm pentru următoarea încercare
          continue;
        }
      }catch{
        // dacă iar cade netul, ieșim și așteptăm următorul „online”
        break;
      }
    }
  }


  // presence / typing timers
  let presTimer=null, lastTypingSent=0, typingClearTimer=null;
  const TYPING_COOLDOWN = 4000;

  // ——— helpers: day keys + separatoare ———
  const NF_DAY = new Intl.DateTimeFormat('ro-RO',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const dayKey = (ts)=>{ const d=new Date((ts||0)*1000); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const dayLbl = (ts)=> NF_DAY.format(new Date((ts||0)*1000));
  function sepNode(ts){
    const div=document.createElement('div');
    div.className='chat-sep';
    div.dataset.day = dayKey(ts);
    div.innerHTML = `<span>${esc(dayLbl(ts))}</span>`;
    return div;
  }
  function lastMsgRow(){
    for (let i=feed.children.length-1;i>=0;i--){
      const el=feed.children[i];
      if (el.classList.contains('chat-sep')) continue;
      return el;
    }
    return null;
  }
  function firstMsgRow(){
    for (let i=0;i<feed.children.length;i++){
      const el=feed.children[i];
      if (el.classList.contains('chat-sep')) continue;
      return el;
    }
    return null;
  }
  function ensureDaySepAppend(ts){
    const need = dayKey(ts);
    let lastDay=null;
    for (let i=feed.children.length-1;i>=0;i--){
      const el=feed.children[i];
      if (el.classList.contains('chat-sep')) { lastDay = el.dataset.day||null; break; }
      if (el.dataset && el.dataset.ts){ lastDay = dayKey(+el.dataset.ts||0); break; }
    }
    if (need!==lastDay) feed.appendChild(sepNode(ts));
  }

  // ——— presence/typing render ———
  let PRES_LIST = [];
  function renderPresence(list){
    PRES_LIST = Array.isArray(list)?list:[];
    if (!presBar) return;
    const who = (list||[]).slice(0,12);
    presBar.innerHTML = who.map(u =>
      `<span class="px-2 py-[2px] rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-200">${esc(u.user_name||'—')}</span>`
    ).join(' ');
    if (liveB) liveB.title = `${(list||[]).length} activi`;
  }
  function renderTyping(list){
    if (!typingBar) return;
    const who = (list||[]).map(u=>u.user_name||'—').filter(n=>n!==meName);
    if (!who.length){ typingBar.textContent=''; return; }
    typingBar.textContent = who.length===1 ? `${who[0]} tastează…`
      : who.length===2 ? `${who[0]} și ${who[1]} tastează…`
      : `${who[0]}, ${who[1]} și alții tastează…`;
    clearTimeout(typingClearTimer);
    typingClearTimer = setTimeout(()=> typingBar.textContent='', 6000);
  }

  // ——— ui helpers ———
  function setBtnBusy(b){
    if (!btn) return; // fără buton, no-op
    btn.disabled = b;
    btn.dataset.busy = b ? '1' : '';
    btn.innerHTML = b ? '<span class="animate-pulse">⏳</span>&nbsp;Trimit…' : 'Trimite';
  }
  function trimSeen(){
    if (SEEN.size > MAX_SEEN) { let n=0; for (const x of SEEN){ SEEN.delete(x); if(++n>=1000) break; } }
  }
    // virtualizare simplă: menținem o fereastră de mesaje în dom
  // anchor = 'bottom' → păstrăm mesajele cele mai recente
  // anchor = 'top'    → păstrăm mesajele cele mai vechi (când sapi în arhivă)
  function trimDOMWindow(anchor = 'bottom'){
    const rows  = Array.from(feed.querySelectorAll('.msg'));
    const total = rows.length;
    if (total <= MAX_DOM_MSG) return;

    const removeCount = total - MAX_DOM_MSG;

    if (anchor === 'top') {
      // păstrăm începutul listei, tăiem din coadă (partea de jos)
      for (let i = total - 1, removed = 0; i >= 0 && removed < removeCount; i--){
        const row = rows[i];
        const sep = row.previousElementSibling;
        row.remove();
        removed++;
        if (sep && sep.classList && sep.classList.contains('chat-sep') &&
            (!sep.nextElementSibling || !sep.nextElementSibling.classList.contains('msg'))){
          sep.remove();
        }
      }
    } else {
      // păstrăm capătul de jos (mesajele cele mai recente), tăiem din vârf
      for (let i = 0, removed = 0; i < total && removed < removeCount; i++){
        const row = rows[i];
        const sep = row.previousElementSibling;
        row.remove();
        removed++;
        if (sep && sep.classList && sep.classList.contains('chat-sep') &&
            (!sep.nextElementSibling || !sep.nextElementSibling.classList.contains('msg'))){
          sep.remove();
        }
      }
    }

    // curățare extra: separatoare rămase singure fără mesaje după ele
    Array.from(feed.querySelectorAll('.chat-sep')).forEach(sep=>{
      const next = sep.nextElementSibling;
      if (!next || !next.classList.contains('msg')) sep.remove();
    });
  }


  // ——— mentions: detect + dot + toast + tab ———
  const norm = s => (s||'').normalize('NFKD').toLowerCase();
  function isMention(m){
    if (Array.isArray(m.mentions) && m.mentions.length){
      for (const it of m.mentions){
        if (meId && ((it.user_id|0) === meId)) return true;
        if (it.name && norm(it.name) === norm(meName)) return true;
      }
    }
    const rx = /(^|\s)@([^\s,.!?;:]+)/gim;
    let mm; const body=(m.body||'');
    while ((mm = rx.exec(body))){
      const token = mm[2]||'';
      if (norm(token) === norm(meName)) return true;
    }
    return false;
  }
  function isReplyToMe(m){
    const meta = resolveReplyMeta(m);
    if (!meta || !meId) return false;
    const targetId = meta.user_id || (MSG_INDEX.get(meta.id||0)?.user_id) || null;
    return !!targetId && targetId === meId;
  }
  function updateMentionDot(){
    
    const dot = document.getElementById('mentionDot');
    if (!dot) return;
    if (mentionUnreadCount>0){ dot.textContent = String(mentionUnreadCount); dot.classList.remove('hidden'); }
    else { dot.classList.add('hidden'); }
  }
  function renderMentionInbox(){
    const host = document.getElementById('mentionInbox');
    if (!host) return;
    host.innerHTML = '';
    if (!mentionNotifications.length){
      host.innerHTML = '<div class="text-[13px] text-slate-400">Nu ai notificări necitite.</div>';
      return;
    }
    mentionNotifications.forEach(n=>{
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'w-full text-left px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/5';
      const kindLabel = n.kind === 'reply' ? 'ți-a răspuns' : 'te-a menționat';
      const tsRel = formatRelativeTime(n.ts||0);
      row.innerHTML = `
        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span>${esc(kindLabel)}</span>
          <span>${esc(tsRel)}</span>
        </div>
        <div class="text-[13px] text-slate-300 mt-1">${esc(n.user_name||'—')}</div>
        <div class="text-sm text-slate-200 mt-1 leading-snug">${esc(n.body||'')}</div>
      `;
      row.addEventListener('click', ()=>{
        if (n.message_id) jumpToAround(n.message_id);
        if (n.notif_id) markMentionNotifications([n.notif_id]);
      });
      host.appendChild(row);
    });
  }

  async function markMentionNotifications(ids){
    if (!ids || !ids.length) return;
    try {
      const r = await fetch('/api/chat/mentions_mark_read.php', {
        method:'POST',
        credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ids })
      });
      const j = await r.json();
      if (j && j.ok){
        mentionUnreadCount = j.unread_count || 0;
        updateMentionDot();
        await loadMentionInbox(false);
      }
    } catch{}
  }

  async function markAllMentionsRead(){
    const ids = mentionNotifications.map(n=>n.notif_id).filter(Boolean);
    if (!ids.length) return;
    await markMentionNotifications(ids);
  }

  async function loadMentionInbox(markRead){
    try{
      const r = await fetch('/api/chat/mentions_unread.php', { credentials:'include' });
      const j = await r.json();
      if (!j || !j.ok) return;
      mentionUnreadCount = j.unread_count || 0;
      mentionNotifications = Array.isArray(j.items) ? j.items : [];
      renderMentionInbox();
      updateMentionDot();
      if (markRead && mentionNotifications.length){
        await markAllMentionsRead();
      }
    }catch{}
  }

  function scheduleMentionRefresh(){
    if (mentionRefreshTimer) clearTimeout(mentionRefreshTimer);
    mentionRefreshTimer = setTimeout(()=> loadMentionInbox(false), 400);
  }
  function setView(mentionsMode){
    VIEW_MENTIONS = !!mentionsMode;
    const chatCard = feed.closest('[data-widget-id="chat"]');
    if (chatCard){ chatCard.classList.toggle('view-mentions', VIEW_MENTIONS); }
    document.getElementById('tabAll')?.classList.toggle('bg-white/5', !VIEW_MENTIONS);
    document.getElementById('tabMent')?.classList.toggle('bg-white/5',  VIEW_MENTIONS);
   if (VIEW_MENTIONS) loadMentionInbox(true);
  }
  document.getElementById('tabAll')?.addEventListener('click', ()=> setView(false));
  document.getElementById('tabMent')?.addEventListener('click',()=> setView(true));
    document.getElementById('mentionBell')?.addEventListener('click', async ()=> {
    setView(true); // păstrăm comportamentul actual (tab mențiuni)
    await ensureMentionPushEnabledViaClick(); // la click cerem / activăm notificările
     await loadMentionInbox(true);
  });
document.getElementById('btnMentionsReadAll')?.addEventListener('click', ()=> markAllMentionsRead());

  /* ——— build row + mentions render ——— */
  function renderMentions(body, meta){
    let html = esc(body||'');
    const me = meName;
    const byLen = (a,b)=> (b.name||'').length - (a.name||'').length;
    if (Array.isArray(meta) && meta.length){
      const items = [...meta].sort(byLen);
      for (const it of items){
        if(!it || !it.name) continue;
        const name = it.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const rg = new RegExp(`(^|[^\\w])@(${name})(?=\\b)`, 'g');
        html = html.replace(rg, (_,$1,$2)=> `${$1}<span class="mention ${$2===me?'mention-me':''}">@${$2}</span>`);
      }
    } else {
      html = html.replace(/(^|[^\w])@([A-Za-z0-9._-]{2,32})/g, (_,$1,$2)=> {
        const cls = ($2===me)?' mention-me':'';
        return `${$1}<span class="mention${cls}">@${$2}</span>`;
      });
    }
    return html;
  }

    function buildRow(m, mine = false, pending = false) {
    const row = document.createElement('div');
    row.className = 'msg w-full flex ' + (mine ? 'justify-end' : 'justify-start');
    if (m.id) row.dataset.msgId = String(m.id | 0);

    const tsSec = m.ts || Math.floor(Date.now() / 1000);
    row.dataset.ts   = String(tsSec);
    row.dataset.user = String(m.user_name || '');
    row.dataset.mine = mine ? '1' : '0';
    row.dataset.bodyRaw = m.body || '';
    if (m.id) indexMessage(m);

    const isDeleted = !!m.deleted;
    const tsRel = formatRelativeTime(tsSec);
    const tsAbs = NF_TIME.format(new Date(tsSec * 1000));

    const replyToMe = !isDeleted && isReplyToMe(m);
    const mentioned = !isDeleted && (isMention(m) || replyToMe);
    if (mentioned) row.classList.add('has-mention');
const mentionLabel = replyToMe ? 'ți-a răspuns' : (isMention(m) ? 'te-a menționat' : '');
    const bodyHTML = isDeleted
      ? '<span class="text-slate-500 italic">mesaj șters</span>'
      : renderMentions(m.body || '', m.mentions || null);
      const replyMeta = !isDeleted ? resolveReplyMeta(m) : null;
    let replyHTML = '';
    if (replyMeta && replyMeta.id){
      row.dataset.replyId = String(replyMeta.id);
      const userLabel = replyMeta.user_name || 'mesaj';
      const preview = esc((replyMeta.body || '').slice(0, 220));
      replyHTML = `
        <button type="button" class="reply-ref" data-reply-jump="${replyMeta.id}">
          <div class="text-[11px] text-cyan-200"><i class="fa-solid fa-reply mr-1"></i> către ${esc(userLabel)}</div>
          <div class="preview text-[12px] text-slate-200 leading-snug">${preview || '—'}</div>
        </button>`;
    }

    let reactBar = '';
    if (FLAGS.reactions && !isDeleted) {
      reactBar = `
      <div class="react-bar mt-1 flex gap-1">
        <button type="button" class="react-btn text-xs px-2 py-[2px] rounded border border-white/10 hover:border-white/20" data-emoji="👍">👍 <span data-count="👍">0</span></button>
        <button type="button" class="react-btn text-xs px-2 py-[2px] rounded border border-white/10 hover:border-white/20" data-emoji="❤️">❤️ <span data-count="❤️">0</span></button>
        <button type="button" class="react-btn text-xs px-2 py-[2px] rounded border border-white/10 hover:border-white/20" data-emoji="🔥">🔥 <span data-count="🔥">0</span></button>
      </div>`;
    }

    const canEditNow = mine && !pending && !isDeleted && canEditNowTs(tsSec);
    const editedLabel  = m.edited ? '<span data-edited-flag="1" class="ml-1 text-[10px] text-slate-500 italic">(editat)</span>' : '';
    const deletedLabel = isDeleted ? '<span data-deleted-flag="1" class="ml-2 text-[11px] text-rose-400">[mesaj șters]</span>' : '';

    let actionsHtml = '';
    if (!isDeleted) {
      actionsHtml += `
        <button type="button"
                class="ml-2 text-[11px] text-slate-500 hover:text-cyan-400 reply-msg-btn"
                title="răspunde la mesaj">
          <i class="fa-solid fa-reply"></i>
        </button>`;
    }
    if (canEditNow) {
      actionsHtml = `
      ${actionsHtml}
        <button type="button"
                class="ml-2 text-[11px] text-slate-500 hover:text-sky-400 edit-msg-btn"
                title="editează mesajul">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button type="button"
                class="ml-1 text-[11px] text-slate-500 hover:text-rose-400 delete-msg-btn"
                title="șterge mesajul">
          <i class="fa-regular fa-trash-can"></i>
        </button>`;
    }

    row.innerHTML = `
      <div class="bubble max-w-[85%] rounded-2xl px-3 py-2 text-sm border bg-white/5 border-white/10 ${pending ? 'opacity-80' : ''}">
      ${replyHTML}
        <div class="meta text-[11px] opacity-80 mb-1">
          <i class="fa-regular fa-user"></i> ${esc(m.user_name || '—')}
          ${m.role === 'ADMIN' ? '<span class="badge bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 ml-2">Admin</span>' : ''}
          <span class="ml-2 text-slate-500"
                data-time
                data-ts="${tsSec}"
                title="${esc(tsAbs)}">${esc(tsRel)}</span>
          ${editedLabel}
          ${deletedLabel}
          ${mentionLabel ? `<span class="mention-chip ml-2">${esc(mentionLabel)}</span>` : ''}
          ${pending ? '<i class="fa-regular fa-clock ml-2" data-status title="se trimite…"></i>' : ''}
          ${actionsHtml}
        </div>
        <div data-body>${bodyHTML}</div>
        ${reactBar}
      </div>`;

    if (FLAGS.reactions && !isDeleted) attachReactHandlers(row);
    return row;
  }


  function canGroup(prevRow, m, mine){
    if (!prevRow) return false;
    if (prevRow.classList.contains('chat-sep')) return false;
    const sameUser = (prevRow.dataset.user||'') === (m.user_name||'');
    const sameSide = (prevRow.dataset.mine||'0') === (mine ? '1':'0');
    return sameUser && sameSide;
  }
  function joinWithPrev(prevRow, curRow){
    const pb = prevRow?.querySelector('.bubble');
    const cb = curRow?.querySelector('.bubble');
    if (pb) pb.classList.add('bubble-join-bottom');
    if (cb) cb.classList.add('bubble-join-top');
    curRow.classList.add('msg-compact');
  }

  function appendMsg(m){
    const id = m.id|0, cid = m.client_id || m.cid || null;
    if (cid && PENDING.has(cid)) return confirmPending(cid, m);
    if (!cid && PENDING.size){
      for (const [k,p] of PENDING){
        if (p.body === (m.body||'') && Math.abs((m.ts||0) - p.ts) <= 30) return confirmPending(k, m);
      }
    }
    if (id && SEEN.has(id)) return;
    if (id) {
      SEEN.add(id); trimSeen();
      lastId = Math.max(lastId, id);
      sessionStorage.setItem('chat:lastId', String(lastId));
      if (oldestIdLoaded === null || id < oldestIdLoaded) oldestIdLoaded = id;
    }
    ensureDaySepAppend(m.ts||0);
    const mine = (m.user_name === meName);
    const row = buildRow(m, mine, false);
    const wasBottom = atBottom() || BOOTING;
    const prev = lastMsgRow();
    if (canGroup(prev, m, mine)) joinWithPrev(prev, row);
            feed.appendChild(row);
    if (row.classList.contains('has-mention')) {
      if (!mine && !VIEW_MENTIONS) {
        showMentionToast(m.user_name, (m.body||'').slice(0,80));
      }
      // notificare browser pentru @mențiuni, doar dacă nu e mesajul tău
      if (!mine) {
        fireMentionNotification(m);
        scheduleMentionRefresh();
      }
    }
    updateMentionDot();


    // după ce am pus mesajul nou, păstrăm doar ultimul „geam” de mesaje în dom
    trimDOMWindow('bottom');

    if (wasBottom) scrollBottomNow();

  }

  function prependMsgs(list){
    if (!list || !list.length) return;
    if (BOOTING) return;
    let nextRow = feed.firstElementChild;
    let dayBelow = null;
    while (nextRow){
      if (nextRow.classList.contains('chat-sep')) { dayBelow = nextRow.dataset.day||null; break; }
      if (nextRow.dataset && nextRow.dataset.ts){ dayBelow = dayKey(+nextRow.dataset.ts||0); break; }
      nextRow = nextRow.nextElementSibling;
    }
    const prevH = feed.scrollHeight;
    const frag = document.createDocumentFragment();
    let prevRowLocal = null;
    let prevDayLocal = dayBelow;
    for (const m of list){
      const thisDay = dayKey(m.ts||0);
      if (thisDay !== prevDayLocal){
        frag.appendChild(sepNode(m.ts||0));
        prevDayLocal = thisDay;
      }
      const mine = (m.user_name === meName);
      const row = buildRow(m, mine, false);
      if (prevRowLocal && canGroup(prevRowLocal, m, mine)) joinWithPrev(prevRowLocal, row);
      frag.appendChild(row);
      prevRowLocal = row;
      const id = m.id|0;
      if (id){ SEEN.add(id); trimSeen(); if (oldestIdLoaded===null || id<oldestIdLoaded) oldestIdLoaded=id; lastId=Math.max(lastId,id); }
    }
        feed.insertBefore(frag, feed.firstChild);

    // aici user-ul e în „arhivă”, deci ancorăm fereastra în partea de sus
    trimDOMWindow('top');

    const newH = feed.scrollHeight;
    feed.scrollTop = Math.max(0, newH - prevH);

    sessionStorage.setItem('chat:lastId', String(lastId));
    updateMentionDot();

  }

  function renderPending(cid, body, ts, mentionsArr, replyMeta){
    ensureDaySepAppend(ts||Math.floor(Date.now()/1000));
    const m = {
      id: 0,
      user_name: meName,
      role: 'USER',
      body,
      ts,
      mentions: Array.isArray(mentionsArr)?mentionsArr:[],
      reply_to: replyMeta?.id || null,
      reply: replyMeta || null
    };
    const row = buildRow(m, true, true);
    row.dataset.cid = cid;
    const wasBottom = atBottom() || BOOTING;
    const prev = lastMsgRow();
    if (canGroup(prev, m, true)) joinWithPrev(prev, row);
    feed.appendChild(row);
    if (wasBottom) scrollBottomNow();
    PENDING.set(cid, { row, body, ts, mentions: m.mentions, reply: replyMeta || null });
  }

    function confirmPending(cid, m) {
    const p = PENDING.get(cid);
    if (!p) return appendMsg(m);

    const { row } = p;
    
    // completăm meta de reply dacă serverul nu a trimis-o
    const replyMeta = m.reply
      || (m.reply_to ? { id: m.reply_to } : null)
      || p.reply
      || null;

    // scoatem iconul de pending
    row.querySelector('[data-status]')?.remove();
    row.querySelector('.opacity-80')?.classList.remove('opacity-80');

    const tsSec = (m.ts || p.ts || Math.floor(Date.now() / 1000));
    row.dataset.ts = String(tsSec);
    row.dataset.bodyRaw = m.body || p.body || row.dataset.bodyRaw || '';
   const replyId = m.reply_to || (replyMeta && replyMeta.id) || null;
    if (replyId) row.dataset.replyId = String(replyId); else delete row.dataset.replyId;

    const t = row.querySelector('[data-time]');
    if (t) {
      t.dataset.ts = String(tsSec);
      t.textContent = formatRelativeTime(tsSec);
      t.title = NF_TIME.format(new Date(tsSec * 1000));
    }

    const bubble = row.querySelector('.bubble');
    const meta = Array.isArray(m.mentions) ? m.mentions : (p.mentions || []);
    const tmp = buildRow({ ...m, mentions: meta, reply: replyMeta, reply_to: m.reply_to || replyMeta?.id || null }, true, false);
    const bubbleNew = tmp.querySelector('.bubble');
    if (bubble && bubbleNew) {
      const cls = bubble.className;
      bubble.innerHTML = bubbleNew.innerHTML;
      bubble.className = cls;
    }
    if (FLAGS.reactions && !m.deleted) attachReactHandlers(row);

    const id = m.id | 0;
    if (id) {
      row.dataset.msgId = String(id);
      if (isMention(m)) row.classList.add('has-mention');
      SEEN.add(id); trimSeen();
      lastId = Math.max(lastId, id);
      if (oldestIdLoaded === null || id < oldestIdLoaded) oldestIdLoaded = id;
      sessionStorage.setItem('chat:lastId', String(lastId));
      updateMentionDot();

      // acum că avem ID și TS definit, putem atașa butoanele edit/șterge dacă încă suntem în fereastră
      const metaEl = row.querySelector('.meta');
      if (metaEl && canEditNowForRow(row) && !metaEl.querySelector('.edit-msg-btn')) {
        const wrap = document.createElement('span');
        wrap.innerHTML = `
          <button type="button"
                  class="ml-2 text-[11px] text-slate-500 hover:text-sky-400 edit-msg-btn"
                  title="editează mesajul">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button type="button"
                  class="ml-1 text-[11px] text-slate-500 hover:text-rose-400 delete-msg-btn"
                  title="șterge mesajul">
            <i class="fa-regular fa-trash-can"></i>
          </button>`;
        const b1 = wrap.firstElementChild;
        const b2 = wrap.lastElementChild;
        if (b1) metaEl.appendChild(b1);
        if (b2) metaEl.appendChild(b2);
      }
    }

    if (atBottom() || BOOTING) scrollBottomNow();
    PENDING.delete(cid);
  }


  /* ——— Poll (fallback) ——— */
  function stopPoll(){ if (pollTimer){ clearInterval(pollTimer); pollTimer=null; } }
  async function pullLatest(){
    try{
      const r = await fetch(`/api/chat/fetch.php?since_id=${encodeURIComponent(lastId||0)}`, { credentials:'include' });
      const j = await r.json();
      (j.items||[]).forEach(appendMsg);
    }catch{}
  }
  function startPoll(immediate=false){
    if (pollTimer) return;
    if (immediate) pullLatest();
    pollTimer = setInterval(pullLatest, POLL_MS);
  }

  /* ——— Lazy-load pe scroll sus (gated) ——— */
  let lazyTick=false;
  async function loadOlder(){
    if (!ALLOW_LAZY || loadingOlder || noMoreOlder || oldestIdLoaded===null) return;
    loadingOlder = true;
    try{
      const url = `/api/chat/fetch.php?before_id=${encodeURIComponent(oldestIdLoaded)}&limit=${PAGE_LIMIT}`;
      const r = await fetch(url, { credentials:'include' });
      const j = await r.json();
      const items = j.items||[];
      if (items.length){
        prependMsgs(items);
        oldestIdLoaded = items[0].id;
        if (items.length < PAGE_LIMIT) noMoreOlder = true;
      } else noMoreOlder = true;
    }catch{} finally { loadingOlder = false; }
  }
  feed.addEventListener('scroll', ()=>{
    if (BOOTING) return;
    if (!ALLOW_LAZY) return;
    if (lazyTick) return;
    lazyTick = true;
    requestAnimationFrame(()=>{ lazyTick=false; if (feed.scrollTop<=8) loadOlder(); });
  }, {passive:true});

  /* ——— Presence ping ——— */
  async function pingPresence(){
    try{ await fetch('/api/chat/presence_ping.php',{method:'POST',credentials:'include'}); }catch{}
  }
  function startPresence(){
    pingPresence();
    if (presTimer) clearInterval(presTimer);
    presTimer = setInterval(pingPresence, 20000);
  }

  /* ——— Typing ——— */
  async function sendTyping(){
    const now = Date.now();
    if (now - lastTypingSent < TYPING_COOLDOWN) return;
    lastTypingSent = now;
    try{
      await fetch('/api/chat/typing.php', {method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:'{}'});
    }catch{}
  }
  input.addEventListener('input', sendTyping);
  input.addEventListener('keydown', (e)=>{ if(!e.isComposing) sendTyping(); });

  /* ——— Mentions: UI + autocomplete + payload ——— */
  let MENTION_IDS = new Set();
  let MENTION_MAP = new Map();
  let mentionState = { open:false, start:-1, caret:0, q:'', idx:-1, items:[], anchor:null };
  let mentionPanelEl = null;

  function closeMentionPanel(){ if(mentionPanelEl){ mentionPanelEl.remove(); mentionPanelEl=null; } mentionState={...mentionState, open:false, idx:-1, items:[], q:'', start:-1}; }
  function ensurePanel(){ if (mentionPanelEl) return mentionPanelEl; const el = document.createElement('div'); el.id='piMentionPanel'; document.body.appendChild(el); mentionPanelEl=el; return el; }
  function positionPanel(){
    if (!mentionState.anchor || !mentionPanelEl) return;
    const r = mentionState.anchor.getBoundingClientRect();
    mentionPanelEl.style.left = Math.round(r.left)+'px';
    mentionPanelEl.style.top  = Math.round(r.bottom + 6)+'px';
    mentionPanelEl.style.width= Math.round(r.width)+'px';
  }
  window.addEventListener('resize', positionPanel);
  window.addEventListener('scroll', positionPanel, {passive:true});
  function renderPanel(){
    if (!mentionState.open) return;
    const el = ensurePanel(); positionPanel();
    if (!mentionState.items.length){ el.innerHTML = `<div class="pi-mention-item"><span class="pi-mention-meta">nimic găsit</span></div>`; return; }
    el.innerHTML = '';
    mentionState.items.forEach((u,i)=>{
      const btn = document.createElement('button');
      btn.type='button';
      btn.className = 'pi-mention-item';
      btn.setAttribute('aria-selected', String(i===mentionState.idx));
      btn.innerHTML = `<div>${u.name}</div><div class="pi-mention-meta">${u.role||'USER'} ${u.is_online?'• online':''}</div>`;
      btn.addEventListener('click', ()=> pickMention(i));
      el.appendChild(btn);
    });
  }
  function getAtToken(val, caret){
    let i = val.lastIndexOf('@', caret-1);
    if (i<0) return null;
    if (i>0 && /\w/.test(val[i-1])) return null;
    const frag = val.slice(i+1, caret);
    if (/\s/.test(frag)) return null;
    if (frag.length===0) return {start:i, q:''};
    if (!/^[A-Za-z0-9._-]{0,32}$/.test(frag)) return null;
    return {start:i, q:frag};
  }
  let suggestAbort=null;
  async function suggestMentions(q){
    const local = (PRES_LIST||[]).map(u=>({ user_id:u.user_id||null, name:u.user_name||u.name||'', role:u.role||'USER', is_online:true }))
      .filter(x=> x.name && x.name.toLowerCase().startsWith(q.toLowerCase()))
      .slice(0,6);
    try{
      if (suggestAbort) suggestAbort.abort();
      suggestAbort = new AbortController();
      const r = await fetch(`/api/chat/mentions_suggest.php?q=${encodeURIComponent(q)}&limit=10`, { credentials:'include', signal:suggestAbort.signal });
      const j = await r.json();
      if (j && j.ok && Array.isArray(j.items) && j.items.length){
        return j.items;
      }
    }catch(_){}
    return local;
  }
  function pickMention(i){
    const it = mentionState.items[i]; if (!it) return;
    const val = input.value; const caret = input.selectionStart|0;
    const start = mentionState.start;
    const before = val.slice(0, start);
    const after  = val.slice(caret);
    const insert = '@'+it.name+' ';
    input.value = before + insert + after;
    const pos = (before+insert).length;
    input.setSelectionRange(pos,pos);
    if (it.user_id!=null) MENTION_IDS.add(it.user_id);
    MENTION_MAP.set(it.user_id==null?`n:${it.name}`:String(it.user_id), it.name);
    closeMentionPanel();
    autoGrow(); updateCounter();
  }
  function moveMentionSel(dir){
    if (!mentionState.open || !mentionState.items.length) return;
    const n = mentionState.items.length;
    mentionState.idx = ( (mentionState.idx + (dir>0?1:-1)) + n ) % n;
    renderPanel();
  }
  function onInputForMentions(){
    const val = input.value; const caret = input.selectionStart|0;
    const tok = getAtToken(val, caret);
    if (!tok){ closeMentionPanel(); return; }
    mentionState = { ...mentionState, open:true, start:tok.start, caret, q:tok.q, anchor:input, idx:0 };
    positionPanel();
    suggestMentions(tok.q||'').then(items=>{
      if (!mentionState.open) return;
      mentionState.items = items||[];
      renderPanel();
    });
  }
  input.addEventListener('input', onInputForMentions);
  input.addEventListener('keydown', (e)=>{
    if (!mentionState.open) return;
    if (e.key==='ArrowDown'){ e.preventDefault(); moveMentionSel(+1); }
    else if (e.key==='ArrowUp'){ e.preventDefault(); moveMentionSel(-1); }
    else if (e.key==='Enter' || e.key==='Tab'){ e.preventDefault(); pickMention(Math.max(0, mentionState.idx)); }
    else if (e.key==='Escape'){ e.preventDefault(); closeMentionPanel(); }
  });

  /* ——— Enter = trimite; Shift+Enter = linie nouă ——— */
  input.addEventListener('keydown', (e)=>{
    if (mentionState.open) return; // deja gestionat mai sus
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing){
      e.preventDefault();
      form.requestSubmit();
    }
    // altfel comportamentul default al textarea-ului adaugă linie nouă
  });

  /* ——— Reacții (UI + API) ——— */
  function getRowByMsgId(id){ return feed.querySelector(`.msg[data-msg-id="${id}"]`); }
  function scrollToMsg(id){
    const row = getRowByMsgId(id);
    if (!row) return;
    row.scrollIntoView({ behavior:'smooth', block:'center' });
    row.classList.add('msg-highlight');
    setTimeout(()=> row.classList.remove('msg-highlight'), 1800);
  }
  function applyRowReactions(row, data){
    if (!row) return;
    const counts = data?.counts || {};
    row.querySelectorAll('.react-btn').forEach(b=>{
      const e=b.dataset.emoji||'';
      const span = b.querySelector(`[data-count="${CSS.escape(e)}"]`);
      if (span) span.textContent = String(counts[e]||0);
    });
  }
  
    function applyLocalDelete(row) {
    if (!row) return;
    row.classList.add('msg-deleted');

    const bodyEl = row.querySelector('[data-body]');
    if (bodyEl) {
      bodyEl.innerHTML = '<span class="text-slate-500 italic">mesaj șters</span>';
    }

    row.querySelectorAll('.react-bar').forEach(el => el.remove());
    row.querySelectorAll('.edit-msg-btn, .delete-msg-btn').forEach(el => el.remove());

    let meta = row.querySelector('.meta');
    if (meta && !meta.querySelector('[data-deleted-flag]')) {
      const span = document.createElement('span');
      span.dataset.deletedFlag = '1';
      span.className = 'ml-2 text-[11px] text-rose-400';
      span.textContent = '[mesaj șters]';
      meta.appendChild(span);
    }
  }

  function applyLocalEdit(row, m) {
    if (!row) return;

    const tsSec = m.ts || parseInt(row.dataset.ts || '0', 10) || Math.floor(Date.now() / 1000);
    row.dataset.ts = String(tsSec);
    row.dataset.bodyRaw = m.body || row.dataset.bodyRaw || '';
    const idxId = parseInt(row.dataset.msgId || String(m.id || 0), 10) || 0;
    if (idxId) indexMessage({ id: idxId, user_name: row.dataset.user || m.user_name || '', body: row.dataset.bodyRaw, ts: tsSec });

    const bodyEl = row.querySelector('[data-body]');
    if (bodyEl) {
      bodyEl.innerHTML = renderMentions(m.body || '', m.mentions || null);
    }

    const tEl = row.querySelector('[data-time]');
    if (tEl) {
      tEl.dataset.ts = String(tsSec);
      tEl.textContent = formatRelativeTime(tsSec);
      tEl.title = NF_TIME.format(new Date(tsSec * 1000));
    }

    let meta = row.querySelector('.meta');
    if (meta && !meta.querySelector('[data-edited-flag]')) {
      const span = document.createElement('span');
      span.dataset.editedFlag = '1';
      span.className = 'ml-1 text-[10px] text-slate-500 italic';
      span.textContent = '(editat)';
      // îl punem înainte de chip-uri / status dacă există
      const insertBefore =
        meta.querySelector('.mention-chip') ||
        meta.querySelector('[data-status]') ||
        null;
      meta.insertBefore(span, insertBefore);
    }

    row.dataset.editing = '';
  }

  function openInlineEditor(row) {
    if (!row) return;
    if (row.dataset.editing === '1' || row.dataset.editing === '2') return;
    if (!canEditNowForRow(row)) {
      if (typeof showToast === 'function') showToast('fereastra de editare a expirat', 'info');
      refreshEditControls();
      return;
    }

    const bodyEl = row.querySelector('[data-body]');
    if (!bodyEl) return;

    const raw = row.dataset.bodyRaw || bodyEl.textContent || '';
    row.dataset.editing = '1';

    const ta = document.createElement('textarea');
    ta.className = 'w-full rounded-lg bg-slate-900/70 border border-cyan-500/40 px-2 py-1 text-sm';
    ta.value = raw;
    ta.rows = Math.min(8, Math.max(2, raw.split('\n').length));
    ta.dataset.editInput = '1';

    const actions = document.createElement('div');
    actions.className = 'mt-1 flex items-center gap-2 text-xs';
    actions.innerHTML = `
      <button type="button"
              class="px-2 py-1 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 save-edit-btn">
        salvează
      </button>
      <button type="button"
              class="px-2 py-1 rounded bg-slate-700/60 border border-white/10 text-slate-200 cancel-edit-btn">
        anulează
      </button>`;

    bodyEl.innerHTML = '';
    bodyEl.appendChild(ta);
    bodyEl.appendChild(actions);

    ta.focus();
    ta.selectionStart = ta.value.length;

    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        submitEdit(row);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit(row);
      }
    });
  }

  function cancelEdit(row) {
    if (!row) return;
    const bodyEl = row.querySelector('[data-body]');
    if (!bodyEl) return;
    const raw = row.dataset.bodyRaw || bodyEl.textContent || '';
    bodyEl.innerHTML = renderMentions(raw, null);
    row.dataset.editing = '';
  }

  async function submitEdit(row) {
    if (!row) return;

    const msgId = parseInt(row.dataset.msgId || '0', 10);
    if (!msgId) return;

    const ta = row.querySelector('[data-edit-input]');
    if (!ta) return;

    const newText = ta.value.trim();
    const orig = (row.dataset.bodyRaw || '').trim();

    if (!newText) {
      if (typeof showToast === 'function') showToast('mesajul nu poate fi gol', 'error');
      return;
    }
    if (newText === orig) {
      cancelEdit(row);
      return;
    }

    if (!canEditNowForRow(row)) {
      cancelEdit(row);
      refreshEditControls();
      if (typeof showToast === 'function') showToast('fereastra de editare a expirat', 'info');
      return;
    }

    row.dataset.editing = '2';

    const payload = { message_id: msgId, text: newText };
        const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    };


    try {
      const r = await fetch('/api/chat/edit.php', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload)
      });
      const j = await r.json().catch(() => null);

      if (!r.ok || !j || !j.ok) {
        row.dataset.editing = '';
        if (typeof showToast === 'function') {
          showToast(j?.error || 'eroare la editarea mesajului', 'error');
        }
        return;
      }

      const m = j.message || {
        id: msgId,
        body: newText,
        ts: j.ts || j.time || Math.floor(Date.now() / 1000),
        edited: true
      };
      applyLocalEdit(row, m);

      if (typeof showToast === 'function') showToast('mesaj actualizat', 'success');
    } catch (e) {
      row.dataset.editing = '';
      if (typeof showToast === 'function') {
        showToast('nu am putut salva modificarea. verifică conexiunea.', 'error');
      }
    }
  }

  async function confirmDelete(row) {
    if (!row) return;

    const msgId = parseInt(row.dataset.msgId || '0', 10);
    if (!msgId) return;

    if (!canEditNowForRow(row)) {
      refreshEditControls();
      if (typeof showToast === 'function') showToast('fereastra pentru ștergere a expirat', 'info');
      return;
    }

    if (!window.confirm('Ștergi acest mesaj pentru toată lumea?')) return;

        const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    };


    try {
      const r = await fetch('/api/chat/delete.php', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ message_id: msgId })
      });
      const j = await r.json().catch(() => null);

      if (!r.ok || !j || !j.ok) {
        if (typeof showToast === 'function') {
          showToast(j?.error || 'nu am putut șterge mesajul', 'error');
        }
        return;
      }

      applyLocalDelete(row);
      if (typeof showToast === 'function') showToast('mesaj șters', 'info');
    } catch (e) {
      if (typeof showToast === 'function') {
        showToast('nu am putut șterge mesajul. verifică conexiunea.', 'error');
      }
    }
  }

  // pentru când vine editarea/ștergerea prin SSE din backend (alți utilizatori)
  function applyExternalEdit(m) {
    if (!m || !m.id) return;
    const row = getRowByMsgId(m.id | 0);
    if (!row) return;
    applyLocalEdit(row, m);
  }

  function applyExternalDelete(id) {
    const row = getRowByMsgId(id | 0);
    if (!row) return;
    applyLocalDelete(row);
  }

  // handler global de click pentru editare / ștergere / salvare / anulare
  feed.addEventListener('click', (e) => {
    const editBtn   = e.target.closest('.edit-msg-btn');
    const deleteBtn = e.target.closest('.delete-msg-btn');
    const saveBtn   = e.target.closest('.save-edit-btn');
    const cancelBtn = e.target.closest('.cancel-edit-btn');
    const replyBtn  = e.target.closest('.reply-msg-btn');
    const replyJump = e.target.closest('[data-reply-jump]');

    if (editBtn) {
      e.preventDefault();
      const row = editBtn.closest('.msg');
      openInlineEditor(row);
      return;
    }

    if (deleteBtn) {
      e.preventDefault();
      const row = deleteBtn.closest('.msg');
      confirmDelete(row);
      return;
    }

    if (saveBtn) {
      e.preventDefault();
      const row = saveBtn.closest('.msg');
      submitEdit(row);
      return;
    }

    if (cancelBtn) {
      e.preventDefault();
      const row = cancelBtn.closest('.msg');
      cancelEdit(row);
      return;
    }
    if (replyBtn) {
      e.preventDefault();
      const row = replyBtn.closest('.msg');
      startReplyFromRow(row);
      return;
    }

    if (replyJump) {
      e.preventDefault();
      const targetId = parseInt(replyJump.dataset.replyJump || '0', 10);
      if (targetId) scrollToMsg(targetId);
    }
  });

  
  function attachReactHandlers(row){
    row.querySelectorAll('.react-btn').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        if (!FLAGS.reactions) return;
        const emoji = btn.dataset.emoji||'';
        const id = parseInt(row.dataset.msgId||'0',10);
        if (!id || !emoji) return;
        try{
          const r = await fetch('/api/chat/react.php', {
            method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ message_id:id, emoji })
          });
          if (!r.ok) return;
          const span = btn.querySelector(`[data-count="${CSS.escape(emoji)}"]`);
          if (span){ span.textContent = String((parseInt(span.textContent||'0',10)||0)+1); }
        }catch{}
      });
    });
  }

  const REACTS_BULK = { set:new Set(), timer:null };
  function scheduleReactFetch(id){
    if (!FLAGS.reactions) return;
    if (id) REACTS_BULK.set.add(id);
    clearTimeout(REACTS_BULK.timer);
    REACTS_BULK.timer = setTimeout(fetchReactionsBulk, 280);
  }
  async function fetchReactionsBulk(){
    if (!FLAGS.reactions) return;
    const ids = Array.from(REACTS_BULK.set.values()).filter(Boolean);
    REACTS_BULK.set.clear();
    REACTS_BULK.timer = null;
    if (!ids.length) return;
    try{
      const url = `/api/chat/reactions_bulk.php?ids=${encodeURIComponent(ids.join(','))}`;
      const r = await fetch(url, { credentials:'include' });
      if (r.status === 404){ disableReactions('404 reactions_bulk.php'); return; }
      if (!r.ok) return;
      const j = await r.json();
      const items = j?.items || [];
      items.forEach(it=> applyRowReactions(getRowByMsgId(it.message_id|0), it));
    }catch{}
  }

  /* ——— Toast mențiuni ——— */
    const TOAST_MAX = 3;

  function pushToastCard(card){
    const host = document.getElementById('mentionToast');
    if (!host){
      console.warn('[chat-toast]', card.textContent || '');
      return;
    }

    host.appendChild(card);

    // limităm numărul de toast-uri simultane
    const cards = host.querySelectorAll('.toast-card');
    if (cards.length > TOAST_MAX){
      const removeCount = cards.length - TOAST_MAX;
      for (let i = 0; i < removeCount; i++){
        const old = cards[i];
        if (!old) continue;
        old.style.opacity = '.0';
        old.style.transform = 'translateY(8px)';
        setTimeout(() => old.remove(), 220);
      }
    }
  }

    function showMentionToast(fromName, preview){
    const card = document.createElement('div');
    // îl lăsăm „info”, că e notificare prietenoasă
    card.className = 'toast-card toast-info';
    card.innerHTML =
      `<div class="icon">@</div>
       <div class="text-sm">
         <b>${esc(fromName || 'cineva')}</b> te-a menționat<br>
         <span class="text-slate-400">${esc(preview || '')}</span>
       </div>`;

    // montăm cu limită globală max 3
    pushToastCard(card);

    setTimeout(() => {
      card.style.opacity = '.0';
      card.style.transform = 'translateY(8px)';
      setTimeout(() => card.remove(), 220);
    }, 2600);
  }

  // ——— helper: cere permisiune pentru Notification API, apelat din interacțiune user (click pe clopoțel) ———
  async function ensureMentionPushEnabledViaClick() {
  if (!('Notification' in window)) {
    showToast('error', 'notificările browser nu sunt suportate aici.');
    return;
  }

  if (Notification.permission === 'denied') {
    showToast(
      'error',
      'notificările sunt blocate pentru acest site. mergi în setările browserului și pune site-ul pe „allow”.'
    );
    return;
  }

  if (Notification.permission === 'default') {
    const res = await Notification.requestPermission();
    if (res !== 'granted') {
      showToast('info', 'ai refuzat notificările. le poți activa oricând din setările browserului.');
      return;
    }
  }

  mentionPushEnabled = true;
  showToast('info', 'notificările pentru mențiuni sunt active.');
}



  // ——— helper: notificare efectivă pentru @mențiune ———
  function fireMentionNotification(msg) {
    if (!mentionPushEnabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // trimitem notificări doar când nu ești pe tab
    if (!document.hidden) return;

    const now = Date.now();
    if (now - mentionPushLastTs < MENTION_PUSH_COOLDOWN_MS) return;
    mentionPushLastTs = now;

    const fromName = msg.user_name || 'cineva';
    const bodyRaw  = msg.body || '';
    const bodyPreview = bodyRaw.length > 120 ? bodyRaw.slice(0, 117) + '…' : bodyRaw || 'ai o mențiune nouă în chat.';

    try {
      const n = new Notification(`${fromName} te-a menționat`, {
        body: bodyPreview,
        // ajustează la icon-ul tău real, dacă ai: logo PI / favicon custom
        icon: '/favicon.ico',
        tag: 'pi-mention',   // același tag => se re-folosește notificarea
        renotify: true
      });

      n.onclick = () => {
        try { n.close(); } catch (_) {}
        window.focus();
        setView(true); // deschidem tab-ul „mențiuni”
      };
    } catch (_) {
      // în caz că aruncă, nu stricăm nimic
    }
  }

  
    // toast generic pentru erori / info (reutilizează același container și același stil)
     function showChatToast(message, type){
    const card = document.createElement('div');

    const variant =
      type === 'error'   ? 'toast-error'   :
      type === 'success' ? 'toast-success' :
                           'toast-info';

    card.className = 'toast-card ' + variant;

    let icon = 'i';
    if (type === 'error')      icon = '!';
    else if (type === 'success') icon = '✓';

    card.innerHTML =
      `<div class="icon">${icon}</div>
       <div class="text-sm">${esc(message || '')}</div>`;

    // montăm toast-ul cu limită max 3
    pushToastCard(card);

    // auto-hide după 2.6s
    setTimeout(() => {
      card.style.opacity = '.0';
      card.style.transform = 'translateY(8px)';
      setTimeout(() => card.remove(), 220);
    }, 2600);
  }




  /* ——— Bootstrap ——— */
    async function bootstrap(){
    try{
      loadOfflineQueue();

      // probe reacții
      const okBulk = await probeHEAD('/api/chat/reactions_bulk.php');

      if (!okBulk) disableReactions('404 reactions_bulk.php');

      const r = await fetch(`/api/chat/fetch.php?limit=${PAGE_LIMIT}`, { credentials:'include' });
      const j = await r.json();
      (j.items||[]).forEach(m=>{
        appendMsg(m);
        if (FLAGS.reactions && m.id) scheduleReactFetch(m.id|0);
      });
      if (j.items && j.items.length){
        oldestIdLoaded = j.items[0].id;
        noMoreOlder = (j.items.length < PAGE_LIMIT);
      }
      requestAnimationFrame(()=>{
        // dacă avem ?m=ID în url, sărim direct la acel mesaj
        let mid = 0;
        try {
          const url = new URL(window.location.href);
          mid = parseInt(url.searchParams.get('m') || '0', 10) || 0;
        } catch(_) {
          mid = 0;
        }
        if (mid > 0) {
          jumpToAround(mid);
        } else {
          scrollBottomNow();
        }
        BOOTING = false;
        ALLOW_LAZY = true;
        autoGrow(); updateCounter();
      });

            if ('EventSource' in window) openSSE();
      else {
        liveB.textContent='sync';
        liveB.className='badge bg-amber-500/15 text-amber-200 border border-amber-400/30';
        startPoll(true);
      }
      startPresence();
      updateMentionDot();

      // dacă deja avem net la load, încearcă să trimiți din coadă
      if (navigator.onLine) {
        flushOfflineQueue();
      }

    }catch{
      sessionStorage.removeItem('chat:lastId');
      liveB.textContent='offline';
      liveB.className='badge bg-rose-500/15 text-rose-200 border border-rose-400/30';
      requestAnimationFrame(()=>{
        scrollBottomNow();
        BOOTING = false;
        ALLOW_LAZY = true;
        autoGrow(); updateCounter();
      });
      startPoll(true);
      startPresence();
      updateMentionDot();
    }
  }

  /* ——— SSE ——— */
  function openSSE(){
    if (sse) { try{sse.close();}catch{} sse=null; }
    sse = new EventSource(`/api/chat/stream.php?last_id=${encodeURIComponent(lastId||0)}`);
    sse.addEventListener('open', ()=>{
      liveB.textContent='live';
      liveB.className='badge bg-emerald-500/15 text-emerald-200 border border-emerald-400/30';
      stopPoll();
      if (atBottom()) scrollBottomNow();
    });
    sse.addEventListener('hello', (e)=>{
      try{
        const d = JSON.parse(e.data);
        if (d && d.last_id) {
          lastId = Math.max(lastId, d.last_id|0);
          sessionStorage.setItem('chat:lastId', String(lastId));
        }
      }catch{}
    });
    sse.addEventListener('message', (e)=>{
      try{
        const m = JSON.parse(e.data);
        const cid = m.client_id || m.cid || null;
        if (cid && PENDING.has(cid)) confirmPending(cid, m);
        else {
          appendMsg(m);
          if (FLAGS.reactions && m.id) scheduleReactFetch(m.id|0);
        }
      }catch{}
    });
    sse.addEventListener('presence', (e)=>{ try{ const d=JSON.parse(e.data); renderPresence(d.users||[]); }catch{} });
    sse.addEventListener('typing',   (e)=>{ try{ const d=JSON.parse(e.data); renderTyping(d.users||[]); }catch{} });
    sse.addEventListener('ping', ()=>{});
    sse.addEventListener('error', ()=>{
      liveB.textContent='sync';
      liveB.className='badge bg-amber-500/15 text-amber-200 border border-amber-400/30';
      startPoll(true);
    });
        sse.addEventListener('message_edit', (e) => {
      try {
        const m = JSON.parse(e.data);
        if (!m || !m.id) return;
        applyExternalEdit(m);
      } catch {}
    });

    sse.addEventListener('message_delete', (e) => {
      try {
        const m = JSON.parse(e.data);
        const id = m.id || m.message_id;
        if (!id) return;
        applyExternalDelete(id);
      } catch {}
    });

  }
  document.addEventListener('visibilitychange', ()=>{
    if (!document.hidden && sse && sse.readyState === 2) openSSE();
    if (!document.hidden) { pingPresence(); if (VIEW_MENTIONS) markMentionsSeen(); }
  });

  /* ——— Submit (optimistic) ——— */
    form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const raw = (input.value||'');
    const txt = raw.trim();
    if(!txt){ updateCounter(); return; }
       if (raw.length > MAX_CHARS){
      showChatToast(
        `Mesajul depășește limita de ${MAX_CHARS} caractere.`,
        'error'
      );
      return;
    }


    const mentionsPayload = Array.from(MENTION_IDS);
    const mentionsNames   = Array.from(MENTION_MAP.values());
    const replyMeta = replyTarget && replyTarget.id ? { ...replyTarget, id: replyTarget.id } : null;

    const cid = genCID(), ts = Math.floor(Date.now()/1000);
    const offlinePayload = { cid, txt, ts, mentionsPayload, mentionsNames, reply_to: replyMeta?.id || null, reply_preview: replyMeta };

    renderPending(
      cid,
      txt,
      ts,
      mentionsNames.map(n=>({ user_id: null, name: n })),
      replyMeta
    );

    input.value=''; autoGrow(); updateCounter();
    setBtnBusy(true);
    clearReplyTarget();

    // dacă nu avem conexiune, nu mai încercăm fetch acum: punem în coadă și ieșim
    if (!navigator.onLine){
      queueOffline(offlinePayload);
      setBtnBusy(false);
      input.focus();
      MENTION_IDS.clear(); MENTION_MAP.clear(); closeMentionPanel();
      try{ navigator.sendBeacon && navigator.sendBeacon('/api/chat/typing.php', JSON.stringify({stop:true})); }catch{}
      return;
    }

    try{
      const r = await fetch('/api/chat/send.php', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'X-CSRF-Token': csrfToken || ''
        },
        credentials:'include',
        body: JSON.stringify({
          text: txt,
          client_id: cid,
          mentions: mentionsPayload,
          mention_names: mentionsNames,
          
          reply_to: replyMeta?.id || null,
          reply_preview: replyMeta || null,
          csrf_token: csrfToken || ''
        })
      });
      const j = await r.json().catch(()=>null);

      if(!r.ok || !j || !j.ok){
        const p = PENDING.get(cid);
        if (p?.row){
          const ic = p.row.querySelector('[data-status]');
          if (ic) {
            ic.className = 'fa-regular fa-circle-xmark ml-2 text-rose-400';
            ic.title = 'eroare la trimitere';
          }
          p.row.querySelector('.opacity-80')?.classList.remove('opacity-80');
        }

                let msg = 'Eroare. încearcă din nou.';
        if (j && j.error) {
          if (j.error === 'csrf_invalid') {
            msg = 'Sesiunea de securitate a expirat. Reîncarcă pagina și apoi mai trimite o dată.';
          } else if (j.error === 'rate_limited' || j.error === 'throttled') {
            msg = 'Scrii prea repede. așteaptă câteva secunde înainte să trimiți următorul mesaj.';
          } else if (j.error === 'duplicate') {
            msg = 'Același mesaj a fost deja trimis recent.';
          } else {
            msg = `eroare: ${j.error}`;
          }
        }
        showChatToast(msg, 'error');

      } else if (!sse || sse.readyState !== 1) {
        await pullLatest();
      }
    }catch{
      // cel mai probabil a picat netul => trimitem în coadă offline
      queueOffline(offlinePayload);
    }finally{
      setBtnBusy(false);
      input.focus();
      MENTION_IDS.clear(); MENTION_MAP.clear(); closeMentionPanel();
      try{ navigator.sendBeacon && navigator.sendBeacon('/api/chat/typing.php', JSON.stringify({stop:true})); }catch{}
    }
  });


  /* ——— Search (debounce + abort + jump) ——— */
  const sInput  = document.getElementById('chatSearchInput');
  const sResult = document.getElementById('chatSearchResults');
  let sAbort=null, sTimer=null;

  async function doSearch(q){
    if (!q || q.length < 2){ sResult.classList.add('hidden'); sResult.innerHTML=''; return; }
    if (sAbort) sAbort.abort();
    sAbort = new AbortController();
    sResult.innerHTML = '<div class="text-sm text-slate-400 px-2 py-1">caut…</div>';
    sResult.classList.remove('hidden');
    try{
      const r = await fetch(`/api/chat/search.php?q=${encodeURIComponent(q)}&limit=30`, {
        credentials:'include', signal: sAbort.signal
      });
      const j = await r.json();
      if (!j.ok){
        sResult.innerHTML = `<div class="text-sm text-rose-300 px-2 py-1">eroare: ${esc(j.hint || j.error || 'necunoscută')}.</div>`;
        return;
      }
      const items = j.items||[];
      if (!items.length){ sResult.innerHTML = '<div class="text-sm text-slate-400 px-2 py-1">nimic găsit.</div>'; return; }
      sResult.innerHTML = '';
      items.forEach(m=>{
        const it = document.createElement('button');
        it.type='button';
        it.className='w-full text-left px-2 py-2 rounded-lg hover:bg-white/5 border border-white/5';
        it.innerHTML = `
                    <div class="text-xs text-slate-500">
            ${esc(formatRelativeTime(m.ts))}
            <span class="ml-1 text-slate-500/70">(${NF_TIME.format(new Date(m.ts*1000))})</span>
            • ${esc(m.user_name||'—')}
          </div>

          <div class="text-sm">${esc(m.body||'')}</div>`;
        it.addEventListener('click', ()=> jumpToAround(m.id));
        sResult.appendChild(it);
      });
    }catch(e){
      if (e.name === 'AbortError') return;
      sResult.innerHTML = '<div class="text-sm text-rose-300 px-2 py-1">eroare la căutare.</div>';
    }
  }
  if (sInput){
    sInput.addEventListener('input', ()=>{
      clearTimeout(sTimer);
      sTimer = setTimeout(()=> doSearch(sInput.value.trim()), 220);
    });
    sInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); doSearch(sInput.value.trim()); }});
  }
  document.addEventListener('click', (e)=>{ if(!sResult.contains(e.target) && e.target!==sInput){ sResult.classList.add('hidden'); }});

  async function jumpToAround(id){
    sResult.classList.add('hidden');
    sResult.innerHTML='';
    try{
      const r = await fetch(`/api/chat/fetch.php?around_id=${encodeURIComponent(id)}&window=30`, { credentials:'include' });
      const j = await r.json();
      if (!j.ok) {
        sResult.innerHTML = `<div class="text-sm text-rose-300 px-2 py-1">eroare: ${esc(j.hint || j.error || 'necunoscută')}.</div>`;
        return;
      }
      feed.innerHTML = '';
      SEEN.clear(); PENDING.clear();
      (j.items||[]).forEach(appendMsg);
      if (j.items && j.items.length){
        oldestIdLoaded = j.items[0].id;
        lastId = j.items[j.items.length-1].id;
        sessionStorage.setItem('chat:lastId', String(lastId));
        const anchor = feed.querySelector('[data-msg-id="'+id+'"]');
        if (anchor){
          anchor.scrollIntoView({block:'center'});
          anchor.querySelector('.border')?.classList.add('ring-2','ring-cyan-500/50');
          setTimeout(()=> anchor.querySelector('.border')?.classList.remove('ring-2','ring-cyan-500/50'), 1200);
        }
      }
      updateMentionDot();
    }catch{}
  }

  // auto-resize + contor live
  input.addEventListener('input', ()=>{ autoGrow(); updateCounter(); });
  // init
  autoGrow(); updateCounter();

  window.addEventListener('online', ()=>{
    if (liveB){
      liveB.textContent = 'live';
      liveB.className = 'badge bg-emerald-500/15 text-emerald-200 border border-emerald-400/30';
    }
    // dacă SSE nu e conectat, îl repornim
    if (!sse || sse.readyState !== 1){
      if ('EventSource' in window) openSSE();
    }
    flushOfflineQueue();
  });

  window.addEventListener('offline', ()=>{
    if (liveB){
      liveB.textContent = 'offline';
      liveB.className = 'badge bg-rose-500/15 text-rose-200 border border-rose-400/30';
    }
  });

  // refresh relativ pentru timpi (acum / acum 2 min) la fiecare 30s
    setInterval(tickTimeUI, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tickTimeUI();
  });

  feed.addEventListener('click', (e) => {
    const editBtn = e.target.closest && e.target.closest('.edit-msg-btn');
    if (editBtn) {
      const row = editBtn.closest('.msg');
      if (row) openInlineEditor(row);
      return;
    }

    const delBtn = e.target.closest && e.target.closest('.delete-msg-btn');
    if (delBtn) {
      const row = delBtn.closest('.msg');
      if (row) confirmDelete(row);
      return;
    }
  });


  window.addEventListener('beforeunload', ()=>{
    try{sse?.close();}catch{}
    if (pollTimer) clearInterval(pollTimer);
    try{ navigator.sendBeacon && navigator.sendBeacon('/api/chat/typing.php', JSON.stringify({stop:true})); }catch{}
  });
loadMentionInbox(false);
  bootstrap();
})();
</script>

<script>
(function () {
  const input     = document.getElementById('chatInput');
  const counterEl = document.getElementById('chatCharCounter');

  if (!input || !counterEl) return;

  // 1) input-ul să stea perfect în chenar, fără spațiu rezervat pentru overlay
  input.style.paddingRight = '';
  input.style.width        = '100%';
  input.style.boxSizing    = 'border-box';

  // 2) mutăm contorul sub input, în flux normal, nu peste text
  counterEl.style.position      = 'static';
  counterEl.style.right         = '';
  counterEl.style.bottom        = '';
  counterEl.style.display       = 'flex';
  counterEl.style.flexWrap      = 'wrap';
  counterEl.style.alignItems    = 'center';
  counterEl.style.gap           = '10px';
  counterEl.style.marginTop     = '4px';

  // 3) curățăm placeholder-ul, păstrăm doar textul de bază
  if (input.placeholder) {
    // scoate bucata adăugată de script: " · enter = trimite · shift+enter = linie nouă"
    input.placeholder = input.placeholder.replace(/ · enter[^]+$/i, '').trim();
  }
})();
</script>

<script>
(function () {
  const feed = document.getElementById('chatFeed');
  if (!feed) return;

  // inserează buton "copiază link" în meta pentru fiecare mesaj
  function decorateRow(row) {
    if (!row || row.dataset.copyLinkInit === '1') return;
    row.dataset.copyLinkInit = '1';

    const id = row.dataset.msgId;
    if (!id) return; // nu are încă id (mesaj pending)

    const bubble = row.querySelector('.bubble');
    if (!bubble) return;
    const meta = bubble.querySelector('.meta');
    if (!meta) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'ml-2 text-[11px] text-slate-500 hover:text-cyan-400 copy-link-btn';
    btn.setAttribute('data-copy-link', '1');
    btn.title = 'copiază link către acest mesaj';
    btn.innerHTML = '<i class="fa-solid fa-link"></i>';

    meta.appendChild(btn);
  }

  // decorează mesajele deja existente (dacă sunt)
  feed.querySelectorAll('.msg').forEach(decorateRow);

  // observă mesaje noi adăugate în feed (SSE, poll, send etc.)
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        if (node.classList.contains('msg')) {
          decorateRow(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('.msg').forEach(decorateRow);
        }
      }
    }
  });
  obs.observe(feed, { childList: true });

  // mic toast reutilizând containerul existent pentru mențiuni (dacă există)
  function showCopyToast(text) {
    const host = document.getElementById('mentionToast');
    if (!host) {
      // fallback simplu dacă nu ai încă toast-ui
      alert(text);
      return;
    }
    const card = document.createElement('div');
    card.className = 'toast-card';
    card.innerHTML =
      '<div class="icon">🔗</div>' +
      '<div class="text-sm">' + text + '</div>';
    host.appendChild(card);
    setTimeout(() => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(8px)';
      setTimeout(() => card.remove(), 220);
    }, 2200);
  }

  // handler global pe feed: copiază link absolut către mesaj
  feed.addEventListener('click', (ev) => {
    const btn = ev.target.closest && ev.target.closest('[data-copy-link]');
    if (!btn) return;

    const row = btn.closest('.msg');
    if (!row) return;

    const id = row.dataset.msgId;
    if (!id) return;

    // baza: fie data-chat-path, fie path-ul paginii curente
    let base = document.body.dataset.chatPath || window.location.pathname || '/chat';

    let urlObj;
    try {
      urlObj = new URL(base, window.location.origin);
    } catch (_) {
      urlObj = new URL(window.location.href);
    }

    // setăm / suprascriem parametrul m
    urlObj.searchParams.set('m', id);
    const link = urlObj.toString();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(link)
        .then(() => showCopyToast('link copiat în clipboard'))
        .catch(() => {
          window.prompt('copiază manual acest link:', link);
        });
    } else {
      window.prompt('copiază manual acest link:', link);
    }
  });
})();
</script>

// === editare / stergere in primele 2 minute ===

const EDIT_WINDOW_MS = 2 * 60 * 1000;

// helper: gaseste row-ul si textul
function getMsgContextFromButton(btn) {
  const bubble = btn.closest('.bubble');           // adapteaza daca ai alt class
  if (!bubble) return null;

  const row = bubble.closest('[data-msg-id]') || bubble.parentElement;
  const textarea = bubble.querySelector('textarea');
  const bodyEl = bubble.querySelector('[data-body]');

  return { row, bubble, textarea, bodyEl };
}

// helper: verificam daca mai avem voie sa editam
function canStillEdit(row) {
  if (!row) return false;
  const ts = row.dataset.ts ? Number(row.dataset.ts) * 1000 : null;
  if (!ts) return false;
  return (Date.now() - ts) <= EDIT_WINDOW_MS;
}

// global delegation pentru butoane "salveaza" / "anuleaza"
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const label = btn.textContent.trim().toLowerCase();

  // ne asiguram ca lucram doar pe mesajele din chat, nu pe alte formulare
  const inChat = btn.closest('[data-chat-root="community"]'); // adapteaza la containerul tau
  if (!inChat) return;

  const ctx = getMsgContextFromButton(btn);
  if (!ctx) return;
  const { row, textarea, bodyEl } = ctx;

  // anuleaza edit
  if (label === 'anulează') {
    if (!row || !bodyEl) return;

    const originalHtml = row.dataset.originalBodyHtml;
    if (originalHtml) {
      bodyEl.innerHTML = originalHtml;
      delete row.dataset.originalBodyHtml;
    }

    row.classList.remove('is-editing');
    return;
  }

  // salveaza edit
  if (label === 'salvează') {
    if (!row || !textarea || !bodyEl) return;

    if (!canStillEdit(row)) {
      if (typeof showToast === 'function') {
        showToast('error', 'fereastra de editare de 2 minute a expirat');
      }
      return;
    }

    const msgId = row.dataset.msgId;
    const newText = textarea.value.trim();

    if (!msgId || !newText) {
      if (typeof showToast === 'function') {
        showToast('error', 'mesajul nu poate fi gol');
      }
      return;
    }

    try {
      const resp = await fetch('/api/chat/edit-message.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msgId, body: newText })
      });

      if (!resp.ok) throw new Error('http ' + resp.status);
      const data = await resp.json();
      if (!data || !data.success) {
        throw new Error(data && data.error ? data.error : 'edit esuat');
      }

      // reconstruieste textul in DOM (cu @mention formatat, daca ai functie)
      if (typeof renderMentions === 'function') {
        bodyEl.innerHTML = renderMentions(newText, data.mentions || null);
      } else {
        bodyEl.textContent = newText;
      }

      // marcheaza "editat"
      const meta = row.querySelector('[data-meta-time]');
      if (meta && !meta.dataset.edited) {
        meta.dataset.edited = '1';
        const badge = document.createElement('span');
        badge.className = 'ml-2 text-[10px] uppercase tracking-wide text-slate-400';
        badge.textContent = '(editat)';
        meta.appendChild(badge);
      }

      row.classList.remove('is-editing');
      delete row.dataset.originalBodyHtml;

      if (typeof showToast === 'function') {
        showToast('success', 'mesaj actualizat');
      }
    } catch (err) {
      console.error('edit fail', err);
      if (typeof showToast === 'function') {
        showToast('error', 'nu am putut salva editarea, verifica conexiunea');
      }
    }
  }
});


<!-- /Chat Comunitate -->



</body>
</html>
