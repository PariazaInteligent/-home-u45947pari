<?php
// /v1/dashboard-investitor.php
session_start();

// NU cache pentru pagini protejate
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

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
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100"
      data-role="<?= e($role) ?>"
      data-user-name="<?= e($name) ?>">

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
          <h2 class="font-semibold">Chat Comunitate</h2>
          <span id="chatLive" class="badge bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">live</span>
        </div>

        <div id="chatFeed" class="h-48 overflow-y-auto nice-scroll space-y-2 p-1 rounded-xl border border-white/10 bg-slate-900/50" aria-live="polite"></div>

        <form id="chatForm" class="mt-3 flex items-center gap-2">
          <input id="chatInput" maxlength="500" autocomplete="off"
                class="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
                placeholder="Scrie un mesaj (max 500 caractere)…" />
          <button id="chatSend" type="submit"
                class="rounded-xl px-3 py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 text-sm font-semibold">
             <span class="inline-flex items-center gap-2">
              <i class="fa-solid fa-circle-notch fa-spin hidden" aria-hidden="true" data-spin></i>
              <span data-label>Trimite</span>
            </span>
          </button>
        </form>

        <div id="chatHint" class="mt-2 text-[11px] text-slate-500">Respectă comunitatea. Anti-spam activ (3s între mesaje).</div>
      </section>

      <!-- Grafice (mock pentru vizual) -->
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

      <!-- Tranzacții (mock) -->
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
      document.getElementById('chatFeed').innerHTML = ''; // fără mesaje demo
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

  <!-- Chat Comunitate (SSE single-instance + dedup) -->
  <script>
  (function(){
    const feed  = document.getElementById('chatFeed');
    const form  = document.getElementById('chatForm');
    const input = document.getElementById('chatInput');
    const btn   = document.getElementById('chatSend');
    const liveB = document.getElementById('chatLive');
    if(!feed || !form) return;

    const meName = document.body.dataset.userName || 'Investitor';
    const meRole = (document.body.dataset.role || 'USER').toUpperCase();
    let lastId = +(sessionStorage.getItem('chat:lastId') || 0);
    let sse = null;
    let pollTimer = null;
    const POLL_MS = 4000;
    const SEEN = new Set();            // dedup sigur
    const pendingByClient = new Map();
    const pendingByServer = new Map();
    const NF_TIME = new Intl.DateTimeFormat('ro-RO',{hour:'2-digit',minute:'2-digit'});
    const btnSpin  = btn?.querySelector('[data-spin]');
    const btnLabel = btn?.querySelector('[data-label]');

    function esc(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
    function atBottom(){ return Math.abs(feed.scrollHeight - feed.scrollTop - feed.clientHeight) < 6; }
    function scrollBottom(){ feed.scrollTo({top:feed.scrollHeight, behavior:'smooth'}); }

    function setSeen(id){
      if (!id) return;
      if (SEEN.has(id)) return;
      SEEN.add(id);
      if (SEEN.size > 5000) {
        let n = 0;
        for (const x of SEEN){ SEEN.delete(x); if(++n>=1000) break; }
      }
    }

    function matchPending(m){
      if (!m) return null;
      const mid = m.id|0;
      if (mid && pendingByServer.has(mid)) {
        const entry = pendingByServer.get(mid);
        if (entry && !entry.resolved) return entry;
      }
      for (const entry of pendingByClient.values()) {
        if (entry.resolved) continue;
        if ((entry.data.body || '') === (m.body || '') && (entry.data.user_name || '') === (m.user_name || '')) {
          if (mid) {
            entry.serverId = mid;
            pendingByServer.set(mid, entry);
          }
          return entry;
        }
      }
      return null;
    }

    function finalizePending(entry, official){
      if (!entry) return;
      entry.resolved = true;
      entry.data = official || entry.data;
      entry.el.dataset.pending = '0';
      if (official && official.id) {
        entry.el.dataset.msgId = String(official.id);
      }
      if (entry.bubble) {
        entry.bubble.classList.remove('border-amber-400/40','bg-amber-500/10');
      }
      if (entry.pendingEl) {
        entry.pendingEl.remove();
        entry.pendingEl = null;
      }
      if (entry.timeEl) {
        const ts = official && Number(official.ts) ? Number(official.ts) : (entry.timeEl.dataset.localTs ? Number(entry.timeEl.dataset.localTs) : Date.now()/1000);
        entry.timeEl.textContent = NF_TIME.format(new Date(ts*1000));
      }
      if (entry.bodyEl && official) {
        entry.bodyEl.textContent = official.body || '';
      }
      if (official && official.id) {
        pendingByServer.delete(official.id);
      }
      pendingByClient.delete(entry.clientId);
    }

    function appendMsg(m={}, opts={}){
      const pendingMode = opts.pending === true;
      const clientId = opts.clientId || m.client_id || null;
      const id = m.id|0;
     if (!pendingMode && id && SEEN.has(id)) return null;

      if (!pendingMode) {
        const entry = matchPending(m);
        if (entry) {
          finalizePending(entry, m);
          if (id) setSeen(id);
          return entry.el;
        }
        lastId = Math.max(lastId, id);
        sessionStorage.setItem('chat:lastId', String(lastId));
      }
      const mine = (m.user_name === meName);
      const row = document.createElement('div');
      row.className = 'w-full flex ' + (mine ? 'justify-end' : 'justify-start');
       if (clientId) row.dataset.clientId = clientId;
      if (pendingMode) row.dataset.pending = '1';
      if (id) row.dataset.msgId = String(id);

      const bubble = document.createElement('div');
      bubble.dataset.bubble = '1';
      bubble.className = 'max-w-[85%] rounded-2xl px-3 py-2 text-sm border bg-white/5 border-white/10';
      if (pendingMode) {
        bubble.className += ' border-amber-400/40 bg-amber-500/10';
      }
      row.appendChild(bubble);

     const header = document.createElement('div');
      header.className = 'text-[11px] opacity-80 mb-1 flex flex-wrap items-center gap-2';
      bubble.appendChild(header);

      const userSpan = document.createElement('span');
      userSpan.innerHTML = `<i class="fa-regular fa-user"></i> ${esc(m.user_name||'—')}`;
      header.appendChild(userSpan);

      if ((m.role||'').toUpperCase() === 'ADMIN') {
        const badge = document.createElement('span');
        badge.className = 'badge bg-cyan-500/20 text-cyan-200 border border-cyan-400/30';
        badge.textContent = 'Admin';
        header.appendChild(badge);
      }

      const timeSpan = document.createElement('span');
      timeSpan.dataset.time = '1';
      const stamp = Number(m.ts) ? Number(m.ts) : (Date.now()/1000);
      timeSpan.dataset.localTs = String(stamp);
      timeSpan.className = 'text-slate-500';
      timeSpan.textContent = NF_TIME.format(new Date(stamp*1000));
      header.appendChild(timeSpan);

      let pendingEl = null;
      if (pendingMode) {
        pendingEl = document.createElement('span');
        pendingEl.dataset.pending = '1';
        pendingEl.className = 'flex items-center gap-1 text-amber-300';
        const clock = document.createElement('i');
        clock.className = 'fa-regular fa-clock';
        pendingEl.appendChild(clock);
        const txt = document.createElement('span');
        txt.textContent = 'Se trimite…';
        pendingEl.appendChild(txt);
        header.appendChild(pendingEl);
      }

      const bodyDiv = document.createElement('div');
      bodyDiv.dataset.body = '1';
      bodyDiv.textContent = typeof m.body === 'string' ? m.body : '';
      bubble.appendChild(bodyDiv);
      const stick = atBottom();
      feed.appendChild(row);
      if (stick) scrollBottom();
       if (pendingMode && clientId) {
        pendingByClient.set(clientId, {
          clientId,
          el: row,
          bubble,
          pendingEl,
          timeEl: timeSpan,
          bodyEl: bodyDiv,
          data: { ...m },
          resolved: false,
          serverId: null
        });
      } else if (id) {
        setSeen(id);
      }

      return row;
    }

    function removePending(clientId){
      if (!clientId) return;
      const entry = pendingByClient.get(clientId);
      if (!entry) return;
      entry.el.remove();
      pendingByClient.delete(clientId);
      if (entry.serverId) pendingByServer.delete(entry.serverId);
    }

function setSending(state){
      if (!btn) return;
      btn.disabled = !!state;
      btn.classList.toggle('opacity-70', !!state);
      btn.classList.toggle('cursor-not-allowed', !!state);
      if (btnSpin) btnSpin.classList[state ? 'remove' : 'add']('hidden');
      if (btnLabel) btnLabel.textContent = state ? 'Se trimite…' : 'Trimite';
    }

    function stopPoll(){
      if (!pollTimer) return;
      clearInterval(pollTimer);
      pollTimer = null;
    }

    async function pullLatest(){
      try{
        const r = await fetch(`/api/chat/fetch.php?since_id=${encodeURIComponent(lastId||0)}`, {credentials:'include'});
        const j = await r.json();
         (j.items||[]).forEach(m => appendMsg(m || {}));
      }catch(_){/* fallback silent */}
    }

    function startPoll(immediate=false){
      if (pollTimer) return;
      if (immediate) pullLatest();
      pollTimer = setInterval(pullLatest, POLL_MS);
    }

    async function bootstrap(){
      try{
        const r = await fetch('/api/chat/fetch.php?limit=50', {credentials:'include'});
        const j = await r.json();
        (j.items||[]).forEach(m => appendMsg(m || {}));
        scrollBottom();
        if ('EventSource' in window) {
          openSSE();
        } else {
          liveB.textContent='sync';
          liveB.className='badge bg-amber-500/15 text-amber-200 border border-amber-400/30';
          startPoll(true);
        }
      }catch{
        liveB.textContent='offline';
        liveB.className='badge bg-rose-500/15 text-rose-200 border border-rose-400/30';
         startPoll(true);
      }
    }

    function openSSE(){
   if (sse) { try{sse.close();}catch{}; sse=null; }
      const url = `/api/chat/stream.php?last_id=${encodeURIComponent(lastId||0)}`;
      sse = new EventSource(url); // same-origin -> fără withCredentials

      sse.addEventListener('open', ()=>{
        liveB.textContent='live';
        liveB.className='badge bg-emerald-500/15 text-emerald-200 border border-emerald-400/30';
        stopPoll();
      });
      
      sse.addEventListener('hello', (e)=>{
        try{
          const d = JSON.parse(e.data);
          if (d && d.last_id) {
            lastId = Math.max(lastId, d.last_id|0);
            sessionStorage.setItem('chat:lastId', String(lastId));
          }
        }catch(_){ }
      });

      sse.addEventListener('message', (e)=>{
        try{
          const m = JSON.parse(e.data);
          appendMsg(m); // <- nu renderMsg
        }catch(_){ }
      });


      sse.addEventListener('ping', ()=>{ /* keepalive */ });

   sse.addEventListener('error', ()=>{
        liveB.textContent='sync';
        liveB.className='badge bg-amber-500/15 text-amber-200 border border-amber-400/30';
        // NU redeschidem manual; EventSource reconectează singur cu retry:3000
        startPoll(true);
      });
    }

// opțional, dacă tab-ul revine din background și EventSource e CLOSED (2), redeschidem:
document.addEventListener('visibilitychange', ()=>{
  if (!document.hidden && sse && sse.readyState === 2) openSSE();
});

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const txt = (input.value||'').trim();
      if(!txt) return;
       const clientId = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      appendMsg({
        client_id: clientId,
        user_name: meName,
        role: meRole,
        body: txt,
        ts: Date.now()/1000
      }, { pending: true, clientId });
      input.value='';
      setSending(true);

      try{
        const r = await fetch('/api/chat/send.php', {
          method:'POST', headers:{'Content-Type':'application/json'},
          credentials:'include', body: JSON.stringify({ text: txt })
        });
        const j = await r.json().catch(()=>null);
        if(!r.ok || !j || !j.ok){
          const err = (j && j.error) || 'error';
          const t = { throttled:'Anti-spam: așteaptă 3s.', too_long:'Max 500 caractere.', duplicate:'Mesaj duplicat (30s).', unauthorized:'Nu ești autentificat.' }[err] || 'Eroare. Încearcă din nou.';
          removePending(clientId);
          input.value = txt;
          alert(t);
        } else {
          if (j.id) {
            const entry = pendingByClient.get(clientId);
            if (entry) {
              entry.serverId = j.id;
              entry.el.dataset.msgId = String(j.id);
              pendingByServer.set(j.id, entry);
            }
          }
          if (!sse || sse.readyState !== 1) {
            await pullLatest();
          }
        }
      }catch{
           removePending(clientId);
        input.value = txt;
        alert('Conexiune indisponibilă.');
      }finally{
        setSending(false);
        input.focus();
      }
    });

    window.addEventListener('beforeunload', ()=>{
      try{sse?.close();}catch{}
      stopPoll();
    });

    bootstrap();
  })();
  </script>
  <!-- /Chat Comunitate -->

</body>
</html>
