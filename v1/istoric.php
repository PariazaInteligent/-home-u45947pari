<?php
// /v1/istoric.php
session_start();

$me   = $_SESSION['user'] ?? null;
$role = strtoupper($me['role'] ?? 'GUEST');
if ($role==='GUEST') { header('Location: /v1/login.html'); exit; }
$isAdmin = ($role==='ADMIN');

function e($s){ return htmlspecialchars((string)$s, ENT_QUOTES,'UTF-8'); }
$name = trim($me['name'] ?? 'Investitor');
?>
<!DOCTYPE html>
<html lang="ro" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Istoricul Pariurilor — Banca Comună de Investiții</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <style>
    :root{ --acc-1:#2563eb; --acc-2:#06b6d4; --acc-3:#14b8a6; }
    html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    .hero-gradient { background: linear-gradient(135deg, var(--acc-1), var(--acc-2), var(--acc-3)); background-size: 180% 180%; animation: gradientMove 10s ease infinite; }
    .acc-gradient { background: linear-gradient(90deg, var(--acc-1), var(--acc-2), var(--acc-3)); }
    @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    .glow { box-shadow: 0 10px 30px rgba(34,211,238,.25), inset 0 0 0 1px rgba(255,255,255,.06); }
    .card-hover { transition: transform .25s ease, box-shadow .25s ease; }
    .card-hover:hover { transform: translateY(-3px); box-shadow: 0 15px 45px rgba(0,0,0,.35); }
    .nice-scroll::-webkit-scrollbar{ width:8px;} .nice-scroll::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.15); border-radius:8px;}
    .badge { padding:.25rem .5rem; border-radius:.5rem; font-size:.75rem; }
    .toast{display:flex;align-items:center;gap:.5rem;padding:.6rem .8rem;border-radius:.75rem;border:1px solid rgba(255,255,255,.12);background:rgba(2,6,23,.95);backdrop-filter:blur(6px)}
    .toast.success{border-color:rgba(34,197,94,.35)}
    .toast.warn{border-color:rgba(234,179,8,.35)}
    .toast.error{border-color:rgba(239,68,68,.35)}
    .table-head { background: rgba(255,255,255,.04); position: sticky; top: 0; backdrop-filter: blur(6px); }
    /* Drawer */
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(2px);display:none;}
    .drawer{position:fixed;top:0;right:-560px;width:560px;max-width:100%;height:100%;background:rgba(15,23,42,.95);border-left:1px solid rgba(255,255,255,.08);transition:right .3s ease;}
    .overlay.show{display:block;} .drawer.show{right:0;}

    /* ===== Modal add bet ===== */
    dialog#dlg {
      background: #0b1220;
      color: #e5e7eb;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 16px;
      padding: 0;
    }
    dialog#dlg::backdrop{
      background: rgba(2,6,23,.72);
      backdrop-filter: blur(3px);
    }

    /* header drawer când pariul e marcat ca favorit */
    .pinned-head {
      background: rgba(251,191,36,.07);           /* amber-400 low opacity */
      box-shadow: 0 10px 30px rgba(251,191,36,.22);
      border-bottom-color: rgba(251,191,36,.4) !important;
    }
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100"
      data-role="<?= e($role) ?>"
      data-user-name="<?= e($name) ?>">

  <!-- Toasts container -->
  <div id="toasts" class="fixed top-4 right-4 z-[2000] space-y-2"></div>

  <!-- Gate (fallback) -->
  <script>
    (function gate(){
      const role=(document.body.dataset.role||'GUEST').toUpperCase();
      if(role==='GUEST') window.location.replace('/v1/login.html');
    })();
  </script>

  <!-- NAV / TOPBAR -->
  <header class="sticky top-0 z-50 bg-slate-950/70 backdrop-blur border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/v1/dashboard-investitor.php" class="flex items-center gap-3">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl acc-gradient text-slate-900 font-extrabold glow">PI</span>
        <div>
          <div class="font-semibold tracking-wide">Pariază Inteligent</div>
          <div class="text-xs text-slate-400 -mt-0.5">Istoricul Pariurilor</div>
        </div>
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm text-slate-300">
        <a class="hover:text-white" href="/v1/dashboard-investitor.php">Dashboard</a>
        <a class="hover:text-white" href="/v1/investitii.php">Investiții</a>
        <a class="hover:text-white" href="/v1/retragere.html">Retrageri</a>
        <a class="hover:text-white" href="/v1/profil.html">Profil</a>
      </nav>
      <div class="flex items-center gap-2 text-sm">
        <a href="/v1/dashboard-investitor.php" class="rounded-xl px-3 py-2 border border-white/10 hover:border-white/20"><i class="fa-solid fa-arrow-left mr-2"></i>Înapoi</a>
      </div>
    </div>
  </header>

  <!-- HERO -->
  <section class="relative overflow-hidden">
    <div class="absolute inset-0 hero-gradient opacity-20"></div>
    <div class="max-w-7xl mx-auto px-4 py-8 md:py-12 relative">
      <div class="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold">Istoricul Pariurilor</h1>
          <p class="text-slate-300 max-w-xl">
  Tot istoricul tău financiar din pariuri — profit net, ROI și evoluție în timp — 
  prezentat ca un cont de investiții, nu ca un bilet pierdut prin inbox. 
  Filtrezi, analizezi și exporți în 2 clicuri.
</p>

        </div>
        <div class="text-sm text-slate-400">Utilizator: <span class="font-medium text-slate-200" id="userName"></span></div>
      </div>
    </div>
  </section>

  <main class="max-w-7xl mx-auto px-4 pb-24 space-y-6">

    <!-- Bară control / filtre -->
    <section class="card-hover rounded-2xl border border-white/10 bg-white/5 p-5">
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-3 text-sm">
        <div class="xl:col-span-3">
          <label class="text-slate-300">Căutare</label>
          <input id="fltSearch" placeholder="eveniment, ligă, etc." class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"/>
        </div>
        <div class="xl:col-span-2">
          <label class="text-slate-300">Interval</label>
          <select id="rangePreset" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <option value="7">7 zile</option>
            <option value="30" selected>30 zile</option>
            <option value="90">90 zile</option>
            <option value="365">12 luni</option>
            <option value="all">Tot</option>
            <option value="custom">Personalizat</option>
          </select>
        </div>
        <div id="rangeCustom" class="hidden xl:col-span-3 grid grid-cols-2 gap-2">
          <div>
            <label class="text-slate-400 text-xs">De la</label>
            <input id="dateFrom" type="date" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-1.5"/>
          </div>
          <div>
            <label class="text-slate-400 text-xs">Până la</label>
            <input id="dateTo" type="date" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-1.5"/>
          </div>
        </div>
        <div class="xl:col-span-2">
          <label class="text-slate-300">Sport</label>
          <select id="fltSport" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <option value="">Toate</option>
            <option>Fotbal</option>
            <option>Baschet</option>
            <option>Tenis</option>
            <option>Hochei</option>
            <option>Esports</option>
          </select>
        </div>
        <div class="xl:col-span-2">
          <label class="text-slate-300">Stare</label>
          <select id="fltStatus" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <option value="">Toate</option>
            <option value="PENDING">PENDING</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>
            <option value="VOID">VOID</option>
            <option value="HALF_WON">HALF_WON</option>
            <option value="HALF_LOST">HALF_LOST</option>
          </select>
        </div>
        <div class="xl:col-span-3 grid grid-cols-3 gap-2">
          <div>
            <label class="text-slate-300">Tip</label>
            <select id="fltType" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <option value="">Toate</option>
              <option>SINGLE</option>
              <option>MULTI</option>
            </select>
          </div>
          <div>
            <label class="text-slate-300">Book</label>
            <select id="fltBook" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <option value="">Toate</option>
              <option>StripeBet</option>
              <option>Comet</option>
              <option>Orbital</option>
              <option>Nova</option>
            </select>
          </div>
          <div>
            <label class="text-slate-300">Odds ≥</label>
            <input id="fltMinOdds" type="number" step="0.01" placeholder="1.50" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"/>
          </div>
        </div>
      </div>
      <div class="mt-4 flex items-center gap-2 text-xs">
        <label class="inline-flex items-center gap-2"><input id="fltPinned" type="checkbox"> Doar favorite</label>
        <label class="inline-flex items-center gap-2"><input id="fltLive" type="checkbox"> Doar live</label>
        <span class="ml-auto"></span>
        <?php if ($isAdmin): ?>
          <button id="btnAdd" class="rounded-xl px-3 py-2 bg-white text-slate-900 font-semibold text-sm"><i class="fa-solid fa-plus mr-1"></i> Adaugă bet</button>
        <?php endif; ?>
        <button id="btnApply" class="rounded-xl px-3 py-2 acc-gradient text-slate-900 font-semibold text-sm">Aplică</button>
        <button id="btnReset" class="rounded-xl px-3 py-2 border border-white/10 hover:border-white/20 text-sm">Reset</button>
      </div>
    </section>

    <!-- KPI -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><div class="text-slate-400 text-xs">Mize (Total)</div><div id="kpiStake" class="text-2xl font-extrabold mt-1">—</div></div>
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><div class="text-slate-400 text-xs">Returnat</div><div id="kpiReturn" class="text-2xl font-extrabold mt-1">—</div></div>
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><div class="text-slate-400 text-xs">Profit Net</div><div id="kpiNet" class="text-2xl font-extrabold mt-1">—</div></div>
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><div class="text-slate-400 text-xs">ROI</div><div id="kpiROI" class="text-2xl font-extrabold mt-1">—</div></div>
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><div class="text-slate-400 text-xs">Rată Câștig</div><div id="kpiHit" class="text-2xl font-extrabold mt-1">—</div></div>
      <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><div class="text-slate-400 text-xs">Cote Medii</div><div id="kpiOdds" class="text-2xl font-extrabold mt-1">—</div></div>
    </section>

    <!-- Grafice -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card-hover rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="flex items-center justify-between mb-2"><h2 class="font-semibold">Cumul P&L</h2><div class="text-xs text-slate-400">sold în timp (doar pariuri finalizate)</div></div>
        <div class="relative">
          <svg id="chartPL" viewBox="0 0 920 280" class="w-full h-64"></svg>
          <div id="tipPL" class="hidden absolute top-2 left-2 text-xs rounded-lg border border-white/10 bg-slate-900/80 backdrop-blur px-2 py-1"></div>
        </div>
      </div>
      <div class="card-hover rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="flex items-center justify-between mb-2"><h2 class="font-semibold">Distribuție Mize</h2><div class="text-xs text-slate-400">histogramă (€) — doar pariuri finalizate</div></div>
        <div class="relative">
          <svg id="chartStake" viewBox="0 0 920 280" class="w-full h-64"></svg>
          <div id="tipStake" class="hidden absolute top-2 left-2 text-xs rounded-lg border border-white/10 bg-slate-900/80 backdrop-blur px-2 py-1"></div>
        </div>
      </div>
    </section>

    <!-- Tabel + acțiuni -->
    <section class="card-hover rounded-2xl border border-white/10 bg-white/5 p-0 overflow-hidden" id="cardTable">
      <div class="table-head px-4 py-2 text-xs text-slate-300 flex items-center justify-between">
        <div class="text-slate-500">Rezultate</div>
        <div class="flex items-center gap-2">
          <button id="btnExportCSV" class="rounded-lg px-2 py-1 border border-white/10 hover:border-white/20"><i class="fa-solid fa-file-csv mr-1"></i>CSV</button>
          <button id="btnExportJSON" class="rounded-lg px-2 py-1 border border-white/10 hover:border-white/20"><i class="fa-brands fa-js mr-1"></i>JSON</button>
          <select id="perPage" class="rounded-lg bg-white/5 border border-white/10 px-2 py-1">
            <option>25</option><option selected>50</option><option>100</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-12 px-3 py-2 text-[11px] text-slate-400 border-b border-white/5">
        <button data-sort="ts" class="text-left col-span-2 hover:text-white">Data <i class="fa-solid fa-sort"></i></button>
        <button data-sort="sport" class="text-left col-span-1 hover:text-white">Sport <i class="fa-solid fa-sort"></i></button>
        <button data-sort="event" class="text-left col-span-3 hover:text-white">Eveniment <i class="fa-solid fa-sort"></i></button>
        <button data-sort="odds" class="text-left col-span-1 hover:text-white">Cote <i class="fa-solid fa-sort"></i></button>
        <button data-sort="stake" class="text-right col-span-1 hover:text-white">Miză <i class="fa-solid fa-sort"></i></button>
        <button data-sort="ret" class="text-right col-span-1 hover:text-white">Return <i class="fa-solid fa-sort"></i></button>
        <button data-sort="pnl" class="text-right col-span-1 hover:text-white">P&L <i class="fa-solid fa-sort"></i></button>
        <button data-sort="status" class="text-left col-span-1 hover:text-white">Stare <i class="fa-solid fa-sort"></i></button>
        <div class="col-span-1 text-right">—</div>
      </div>
      <div id="rows" class="max-h-[560px] overflow-auto nice-scroll divide-y divide-white/5"></div>
      <div id="empty" class="hidden p-6 text-sm text-slate-400">Nu există pariuri pentru filtrele curente.</div>
      <div class="flex items-center justify-between p-3 text-xs text-slate-400 border-t border-white/5">
        <div id="pageInfo">—</div>
        <div class="flex items-center gap-2">
          <button id="prevPage" class="rounded-lg px-2 py-1 border border-white/10 hover:border-white/20">⟵</button>
          <button id="nextPage" class="rounded-lg px-2 py-1 border border-white/10 hover:border-white/20">⟶</button>
        </div>
      </div>
    </section>
  </main>

  <!-- FOOTER -->
  <footer class="py-8 border-t border-white/5">
    <div class="max-w-7xl mx-auto px-4 text-sm text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>© <span id="year"></span> Pariază Inteligent — Istoricul Pariurilor</div>
      <div class="flex items-center gap-4">
        <a class="hover:text-white" href="/v1/dashboard-investitor.php">Dashboard</a>
        <a class="hover:text-white" href="/v1/profil.html">Profil</a>
        <a class="hover:text-white" href="/logout.php">Deconectare</a>
      </div>
    </div>
  </footer>

  <!-- Drawer Detalii -->
  <div id="ov" class="overlay z-[999]"></div>
  <aside id="drawer" class="drawer z-[1000]">
    <div class="h-full flex flex-col">
      <div id="drawerHead" class="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div class="flex items-center gap-2 font-semibold">
          <span>Detalii Bilet</span>
          <span id="d_headFav"
                class="hidden text-[11px] font-normal px-2 py-0.5 rounded border
                       bg-amber-400/20 border-amber-400/30 text-amber-200">
            ★ Favorit
          </span>
        </div>
        <button id="btnCloseDrawer"
                class="rounded-lg px-2 py-1 border border-white/10 hover:border-white/20">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="p-4 space-y-3 text-sm overflow-auto nice-scroll">
        <div class="text-xs text-slate-400">ID: <span id="d_id">—</span></div>
        <div class="text-xs text-slate-400">Data: <span id="d_ts">—</span></div>
        <div class="flex items-center gap-2"><span id="d_badge" class="badge"></span><span id="d_title" class="font-medium"></span></div>
        <div id="d_meta" class="text-slate-300 text-xs"></div>

        <!-- Extras -->
        <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
          <div class="text-slate-400 text-xs mb-1">Note / Scor</div>
          <div id="d_extras" class="text-xs text-slate-300"></div>
        </div>

        <!-- Statistici bilet -->
        <div class="rounded-xl border border-white/10 bg-slate-900/60 p-3">
          <div class="text-slate-400 text-xs mb-2">Statistici bilet</div>
          <dl id="d_stats" class="text-xs text-slate-300 grid grid-cols-2 gap-x-4 gap-y-1">
            <!-- populated in JS -->
          </dl>
        </div>

        <!-- Detalii tehnice (ADMIN only) -->
        <div id="techWrap" class="rounded-xl border border-white/10 bg-slate-900/60 p-3 hidden">
          <div class="flex items-center justify-between mb-1">
            <div class="text-slate-400 text-xs">Detalii tehnice</div>
            <button id="btnCopyPayload"
                    class="text-[10px] leading-none px-2 py-1 rounded border border-white/10 hover:border-white/20 bg-white/5 text-slate-300 flex items-center gap-1">
              <i class="fa-solid fa-copy text-[10px]"></i>
              <span>Copiază</span>
            </button>
          </div>
          <pre id="d_payload" class="text-[11px] whitespace-pre-wrap max-h-40 overflow-auto nice-scroll bg-slate-950/40 p-2 rounded border border-white/5"></pre>
        </div>

      </div>
    </div>
  </aside>

  <?php if ($isAdmin): ?>
  <!-- Modal Adaugă (ADMIN) -->
  <dialog id="dlg">
    <form id="formAdd" class="p-5 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Adaugă bet</h3>
        <button type="button" id="btnCancel" class="rounded-lg px-2 py-1 border border-white/10 hover:border-white/20"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <!-- Group UID auto + regenerate -->
        <div class="sm:col-span-2">
          <div class="text-slate-400 text-xs">Group UID (auto)</div>
          <div class="mt-1 flex items-center gap-2">
            <input class="mt-0 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2" name="group_uid" id="group_uid" readonly>
            <button type="button" id="btnRegenUID" class="rounded-lg px-2 py-2 border border-white/10 hover:border-white/20" title="Regenerare UID"><i class="fa-solid fa-rotate"></i></button>
          </div>
        </div>

        <div><div class="text-slate-400 text-xs">Eveniment</div><input class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2" name="event" required></div>
        <div><div class="text-slate-400 text-xs">Sport</div><input class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2" name="sport"></div>
        <div><div class="text-slate-400 text-xs">Ligă</div><input class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2" name="league"></div>
        <div><div class="text-slate-400 text-xs">Selecție</div><input class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2" name="selection"></div>
        <div><div class="text-slate-400 text-xs">Cotă</div><input class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2" name="odds" type="number" step="0.01" min="1.01" required></div>
        <div><div class="text-slate-400 text-xs">Miză (€)</div><input class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2" name="stake_eur" type="number" step="0.01" min="0.5" required></div>

        <!-- Datetime smart -->
        <div class="sm:col-span-2">
          <div class="text-slate-400 text-xs">Data/Ora eveniment</div>
          <input class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2"
                 name="event_at_dt" id="event_at_dt"
                 type="datetime-local" step="60" required>
          <div class="text-[11px] text-slate-400 mt-1">Se trimite automat ca format <code>YYYY-MM-DD HH:MM</code>.</div>
        </div>

        <div class="sm:col-span-2"><div class="text-slate-400 text-xs">Note</div><textarea class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2" name="notes" rows="3"></textarea></div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button class="rounded-xl px-3 py-2 bg-white text-slate-900 font-semibold">Salvează</button>
      </div>
      <div id="errAdd" class="text-rose-300 text-sm hidden mt-2">Eroare la salvare.</div>
    </form>
  </dialog>
  <?php endif; ?>

  <script>
  // ===== Bootstrap meta
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('userName').textContent = document.body.dataset.userName || 'Investitor';
  const IS_ADMIN = <?= $isAdmin ? 'true' : 'false' ?>;

  // ===== Helpers
  function toast(msg,type='success'){
    const t=document.createElement('div');
    t.className='toast '+type;
    t.innerHTML = "<i class='fa-solid "+(type==='success'?"fa-circle-check":type==='warn'?"fa-triangle-exclamation":"fa-circle-exclamation")+"'></i><span>"+msg+"</span>";
    document.getElementById('toasts').appendChild(t);
    setTimeout(()=>t.remove(), 3200);
  }
  function fmtEUR(v){
    return new Intl.NumberFormat('ro-RO',{style:'currency',currency:'EUR'}).format(+v||0);
  }
  function clamp(x,min,max){ return Math.max(min, Math.min(max,x)); }
  function sevColor(status){
    return status==='WON'?'bg-emerald-500/15 text-emerald-200'
         :status==='LOST'?'bg-rose-500/15 text-rose-200'
         :status==='VOID'?'bg-slate-500/15 text-slate-200'
         :status==='HALF_WON'?'bg-emerald-500/15 text-emerald-200'
         :status==='HALF_LOST'?'bg-rose-500/15 text-rose-200'
         :'bg-amber-500/15 text-amber-200';
  }
  function withinRangeTS(ts){
    const f=dateFrom.value, t=dateTo.value;
    if(!f||!t) return true;
    const d=new Date(ts).toISOString().slice(0,10);
    return d>=f && d<=t;
  }

  // helper comun: doar pariuri finalizate (fără PENDING)
  function getSettledRows(rows){
    return rows.filter(r => r.status !== 'PENDING');
  }

  // ===== State
  const state={ all:[], view:[], page:1, perPage:50, sortKey:'ts', sortDir:'desc' };

  // ===== Range preset helpers
  function setPreset(p){
    const now=new Date();
    const start=new Date(now); start.setHours(0,0,0,0);
    const end=new Date(now); end.setHours(23,59,59,999);
    if(p==='7')      start.setDate(now.getDate()-6);
    else if(p==='30')start.setDate(now.getDate()-29);
    else if(p==='90')start.setDate(now.getDate()-89);
    else if(p==='365')start.setDate(now.getDate()-364);
    else if(p==='all'){
      document.getElementById('dateFrom').value='';
      document.getElementById('dateTo').value='';
      return;
    }
    document.getElementById('dateFrom').value=start.toISOString().slice(0,10);
    document.getElementById('dateTo').value=end.toISOString().slice(0,10);
  }

  // ===== API adapters
  function toApiRange(p){
    if(p==='7') return '7d';
    if(p==='30') return '30d';
    if(p==='90') return '90d';
    if(p==='365') return '365d';
    if(p==='all') return 'all';
    return 'all';
  }
  function normStatus(s){ return String(s||'').toUpperCase(); }

  // payout brut / pnl brut
  function normalizeApiItems(items){
    return (items||[]).map(it=>{
      const stake = +it.stake_eur || 0;
      const odds  = +it.odds || 1.0;
      const status = normStatus(it.status||'PENDING');

      let ret =
          status==='WON'        ? +(stake*odds).toFixed(2)
        : status==='VOID'       ? stake
        : status==='HALF_WON'   ? +(stake + (stake*(odds-1))/2).toFixed(2)
        : status==='HALF_LOST'  ? +(stake/2).toFixed(2)
        : 0;

      const pnl = +(ret - stake).toFixed(2);

      const ts  = it.event_at ? Date.parse((it.event_at+'').replace(' ','T')) : Date.now();

      const apiGroupId = it.bet_group_id ?? it.id ?? it.group_id ?? null;
      const isPinned   = !!(it.pinned);

      return {
        id: 'BG'+(apiGroupId ?? Math.random().toString(36).slice(2,8)),
        apiId: apiGroupId,
        ts,
        sport: it.sport || '',
        league: it.league || '',
        type: 'SINGLE',
        legs: [], // ascuns oricum
        event: it.event || '',
        eventAll: [it.event || ''],
        market: it.selection || '',
        odds: +odds,
        stake: +stake,
        ret: +ret,
        pnl: +pnl,
        status,
        book: it.book || '',
        live: !!it.live,
        pinned: isPinned,
        tags: [],
        score: it.score || '',
        notes: it.notes || ''
      };
    });
  }

  async function fetchApiBets(){
    const preset = document.getElementById('rangePreset').value;
    const apiRange = toApiRange(preset);
    const st = (document.getElementById('fltStatus').value||'').toLowerCase();
    const q  = document.getElementById('fltSearch').value.trim();

    const url = new URL('/api/bets/list.php', location.origin);
    url.searchParams.set('range', apiRange);
    if(st) url.searchParams.set('status', st);
    if(q)  url.searchParams.set('q', q);

    try{
      const r = await fetch(url.toString(), { credentials:'include' });
      if(!r.ok) throw 0;
      const j = await r.json();
      if(!(j && j.ok)) throw 0;
      return normalizeApiItems(j.items||[]);
    }catch(e){
    console.error('eroare la /api/bets/list.php', e);
    toast('nu am putut încărca pariurile din baza de date. verifică logurile sau încearcă din nou.', 'error');
    return [];
  }

  }

 

  // ===== Filters / sort / paginate
  function matchFilters(b){
    const q=(document.getElementById('fltSearch').value||'').toLowerCase();
    const sport=document.getElementById('fltSport').value;
    const st=document.getElementById('fltStatus').value;
    const typ=document.getElementById('fltType').value;
    const book=document.getElementById('fltBook').value;
    const minOdds=parseFloat(document.getElementById('fltMinOdds').value||'0');
    const pinned=document.getElementById('fltPinned').checked;
    const live=document.getElementById('fltLive').checked;

    // interval custom
    if(document.getElementById('rangePreset').value==='custom' && !withinRangeTS(b.ts)) return false;

    if(sport && b.sport!==sport) return false;
    if(st && b.status!==st) return false;
    if(typ && b.type!==typ) return false;
    if(book && b.book!==book) return false;
    if(minOdds && b.odds < minOdds) return false;
    if(pinned && !b.pinned) return false;
    if(live && !b.live) return false;

    if(q){
      const hay=[b.id,b.event,b.league,b.sport,b.book,(b.tags||[]).join(' ')].join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  }

  function sortBets(a,b){
    const k=state.sortKey;
    const dir=state.sortDir==='asc'?1:-1;
    if(k==='ts')    return (a.ts-b.ts)*dir;
    if(k==='stake'||
       k==='ret'  ||
       k==='pnl'  ||
       k==='odds') return ((a[k]-b[k])||0)*dir;
    return String(a[k]||'').localeCompare(String(b[k]||''))*dir;
  }

  function paginate(list){
    const pp=state.perPage;
    const start=(state.page-1)*pp;
    return list.slice(start, start+pp);
  }

  function getFilteredSorted(){
    return state.all.filter(matchFilters).sort(sortBets);
  }

  // ===== KPIs / Charts

  function renderKPIs(rows){
    const settledRows = getSettledRows(rows);

    if(!settledRows.length){
      ['kpiStake','kpiReturn','kpiNet','kpiROI','kpiHit','kpiOdds']
        .forEach(id=>document.getElementById(id).textContent='—');
      return;
    }

    const stake = settledRows.reduce((s,x)=>s+x.stake,0);
    const ret   = settledRows.reduce((s,x)=>s+x.ret,0);
    const net   = ret-stake;

    const nonPendingCount = settledRows.length;
    const wonCount = settledRows.filter(x=>x.status==='WON' || x.status==='HALF_WON').length;

    const avgOdds = settledRows.reduce((s,x)=>s+x.odds,0)/settledRows.length;

    document.getElementById('kpiStake').textContent = fmtEUR(stake.toFixed(2));
    document.getElementById('kpiReturn').textContent= fmtEUR(ret.toFixed(2));
    document.getElementById('kpiNet').textContent   = (net>=0?'+':'')+fmtEUR(net.toFixed(2));
    document.getElementById('kpiROI').textContent   = (stake>0?((net/stake)*100).toFixed(2):'0.00')+'%';
    document.getElementById('kpiHit').textContent   = (nonPendingCount?((wonCount/nonPendingCount)*100).toFixed(1):'0.0')+'%';
    document.getElementById('kpiOdds').textContent  = avgOdds.toFixed(2);
  }

  // Grafic Cumul P&L:
  function drawPL(rows){
    const svg=document.getElementById('chartPL');
    const tip=document.getElementById('tipPL');
    svg.innerHTML='';
    tip.classList.add('hidden');

    const settled = getSettledRows(rows);
    if(!settled.length) return;

    const W=920,H=280,pad=28;
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);

    const sorted=[...settled].sort((a,b)=>a.ts-b.ts);

    const openingBalance = 0; // baseline = 0

    let runningBal = openingBalance;
    const balArr=[];
    for (const bet of sorted){
      runningBal += (bet.ret - bet.stake);
      balArr.push(+runningBal.toFixed(2));
    }

    const lo = Math.min(openingBalance, ...balArr);
    const hi = Math.max(openingBalance, ...balArr);
    const rng = (hi-lo)||1;

    function xCoord(i){
      return pad + i*(W-2*pad)/(sorted.length-1||1);
    }
    const yCoords = balArr.map(v =>
      (H-pad) - ((v-lo)/rng)*(H-2*pad)
    );

    const pathD = yCoords
      .map((yy,i)=> (i?`L ${xCoord(i)} ${yy}`:`M ${xCoord(i)} ${yy}`))
      .join(' ');
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',pathD);
    p.setAttribute('fill','none');
    p.setAttribute('stroke','#22d3ee');
    p.setAttribute('stroke-width','2');
    svg.appendChild(p);

    const baseY = (H-pad) - ((openingBalance-lo)/rng)*(H-2*pad);
    const baseLine=document.createElementNS('http://www.w3.org/2000/svg','line');
    baseLine.setAttribute('x1',pad);
    baseLine.setAttribute('x2',W-pad);
    baseLine.setAttribute('y1',baseY);
    baseLine.setAttribute('y2',baseY);
    baseLine.setAttribute('stroke','#64748b');
    baseLine.setAttribute('stroke-dasharray','3,3');
    baseLine.setAttribute('opacity','0.6');
    svg.appendChild(baseLine);

    const overlay=document.createElementNS('http://www.w3.org/2000/svg','rect');
    overlay.setAttribute('x','0');
    overlay.setAttribute('y','0');
    overlay.setAttribute('width',W);
    overlay.setAttribute('height',H);
    overlay.setAttribute('fill','transparent');
    svg.appendChild(overlay);

    const cursor=document.createElementNS('http://www.w3.org/2000/svg','line');
    cursor.setAttribute('y1',pad);
    cursor.setAttribute('y2',H-pad);
    cursor.setAttribute('stroke','#94a3b8');
    cursor.setAttribute('stroke-dasharray','3,3');
    cursor.setAttribute('opacity','0');
    svg.appendChild(cursor);

    overlay.addEventListener('mousemove',(e)=>{
      const rect=svg.getBoundingClientRect();
      const px=e.clientX-rect.left;
      const pct=clamp((px-pad)/(W-2*pad),0,1);
      const idx=Math.round(pct*(sorted.length-1));

      cursor.setAttribute('x1',xCoord(idx));
      cursor.setAttribute('x2',xCoord(idx));
      cursor.setAttribute('opacity','1');

      tip.classList.remove('hidden');
      tip.style.left=(px+8)+'px';
      tip.style.top='8px';
      tip.innerHTML =
        `<div class='text-slate-200 font-medium'>${new Date(sorted[idx].ts).toLocaleDateString('ro-RO')}</div>`+
        `<div>Cumul: ${fmtEUR(balArr[idx])}</div>`;
    });

    overlay.addEventListener('mouseleave',()=>{
      cursor.setAttribute('opacity','0');
      tip.classList.add('hidden');
    });
  }

  // Histograma mizelor:
  function drawStakeHist(rows){
    const svg=document.getElementById('chartStake');
    const tip=document.getElementById('tipStake');
    svg.innerHTML='';
    tip.classList.add('hidden');

    const settled = getSettledRows(rows);
    if(!settled.length) return;

    const W=920,H=280,pad=28;
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);

    const stakes=settled.map(r=>r.stake);
    const maxStake=Math.max(...stakes,0);

    if(maxStake<=0){
      return;
    }

    const bins=20;
    const binSize=maxStake/bins || 1;
    const hist=new Array(bins).fill(0);

    stakes.forEach(s=>{
      const idx=Math.min(bins-1, Math.floor(s/binSize));
      hist[idx]++;
    });

    const maxCnt=Math.max(...hist,1);
    const barSlotWidth=(W-2*pad)/bins;
    const barW=barSlotWidth*0.9;
    const barOffset=(barSlotWidth-barW)/2;

    hist.forEach((count,i)=>{
      const x = pad + i*barSlotWidth + barOffset;
      const h = ((H-2*pad)*(count/maxCnt));
      const y = H-pad - h;

      const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
      rect.setAttribute('x',x);
      rect.setAttribute('y',y);
      rect.setAttribute('width',barW);
      rect.setAttribute('height',h);
      rect.setAttribute('fill','#34d399');
      rect.setAttribute('opacity','0.85');
      svg.appendChild(rect);

      const low  = i*binSize;
      const high = (i+1)*binSize;
      const niceRange = `<div class='text-slate-200 font-medium'>${fmtEUR(low.toFixed(2))} – ${fmtEUR(high.toFixed(2))}</div>`;
      const niceCount = `<div>${count} ${count===1?'bilet':'bilete'}</div>`;

      rect.addEventListener('mousemove',(e)=>{
        const rectSvg=svg.getBoundingClientRect();
        const px=e.clientX-rectSvg.left;
        tip.classList.remove('hidden');
        tip.style.left=(px+8)+'px';
        tip.style.top='8px';
        tip.innerHTML = niceRange + niceCount;
      });
      rect.addEventListener('mouseleave',()=>{
        tip.classList.add('hidden');
      });
    });
  }

  // ===== Toggle pin server-side
  async function togglePinOnServer(betObj){
    const newPinned = !betObj.pinned;

    if (!betObj.apiId) {
      toast('Nu pot identifica pariul pentru pin.','error');
      return;
    }

    try {
      const res = await fetch('/api/bets/pin.php', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          bet_group_id: betObj.apiId,
          pinned: newPinned
        })
      });

      if(!res.ok) throw new Error('bad status');

      const j = await res.json();
      if(!j || !j.ok){
        throw new Error('bad json');
      }

      betObj.pinned = !!j.pinned;

      toast(j.pinned ? 'Adăugat la favorite' : 'Scos din favorite', 'success');

      renderRows();

    } catch(err){
      toast('Nu am putut salva preferința.','error');
    }
  }

  // ===== Table rendering
  function renderRows(){
    const wrap=document.getElementById('rows');
    const empty=document.getElementById('empty');
    wrap.innerHTML='';

    const filtered=getFilteredSorted();

    const total=filtered.length;
    const pages=Math.max(1, Math.ceil(total/state.perPage));
    state.page = clamp(state.page,1,pages);

    const pageRows=paginate(filtered);
    state.view=pageRows;

    document.getElementById('pageInfo').textContent = `Pagina ${state.page}/${pages} • ${total} rezultate`;

    if(pageRows.length===0){
      empty.classList.remove('hidden');
      renderKPIs([]);
      drawPL([]);
      drawStakeHist([]);
      return;
    }
    empty.classList.add('hidden');

    const frag=document.createDocumentFragment();
    pageRows.forEach(b=> frag.appendChild(renderRow(b)));
    wrap.appendChild(frag);

    // KPIs / Grafice folosesc lista filtrată întreagă (nu doar pagina)
    renderKPIs(filtered);
    drawPL(filtered);
    drawStakeHist(filtered);
  }

  function renderRow(b){
    const row=document.createElement('div');
    row.className='grid grid-cols-12 px-3 py-2 text-sm hover:bg-white/5';
    row.dataset.id=b.id;

    row.innerHTML = `
      <div class='col-span-2 flex items-center gap-2'>
        <span>${new Date(b.ts).toLocaleString('ro-RO',{dateStyle:'short', timeStyle:'short'})}</span>
      </div>
      <div class='col-span-1'>${b.sport||'—'}</div>
      <div class='col-span-3'>
        ${b.pinned
          ? `<span class="text-amber-300 mr-1" title="Marcat favorit">★</span>`
          : ``}
        ${b.event||'—'}
        <span class='text-xs text-slate-400'>${b.league||''}</span>
      </div>

      <div class='col-span-1'>${(b.odds||0).toFixed(2)}</div>
      <div class='col-span-1 text-right'>${fmtEUR(b.stake)}</div>
      <div class='col-span-1 text-right'>${fmtEUR(b.ret)}</div>
      <div class='col-span-1 text-right ${b.pnl>=0?'text-emerald-300':'text-rose-300'}'>${(b.pnl>=0?'+':'')+fmtEUR(b.pnl)}</div>
      <div class='col-span-1'><span class='badge ${sevColor(b.status)}'>${b.status}</span></div>
      <div class='col-span-1 text-right space-x-1'>
        <button data-act='fav' class='rounded px-2 py-1 border border-white/10 hover:border-white/20'><i class='fa-solid fa-thumbtack ${b.pinned?'text-amber-300':'text-slate-500'}'></i></button>
        <button data-act='open' class='rounded px-2 py-1 border border-white/10 hover:border-white/20'><i class='fa-solid fa-eye'></i></button>
        ${IS_ADMIN && b.apiId ? `<button data-act='admin' class='rounded px-2 py-1 border border-white/10 hover:border-white/20'><i class='fa-solid fa-gear'></i></button>`:''}
      </div>`;

    row.querySelector('[data-act="fav"]').addEventListener('click', (e)=>{
      e.stopPropagation();
      togglePinOnServer(b);
    });

    row.querySelector('[data-act="open"]').addEventListener('click',(e)=>{
      e.stopPropagation(); openDetail(b.id);
    });

    if(IS_ADMIN && b.apiId){
      row.querySelector('[data-act="admin"]').addEventListener('click',(e)=>{
        e.stopPropagation(); openAdminInline(row, b);
      });
    }

    row.addEventListener('click',(e)=>{
      if(e.target.closest('button')) return;
      openDetail(b.id);
    });

    return row;
  }

  // Inline admin controls
  function openAdminInline(hostRow, bet){
    hostRow.parentElement.querySelectorAll('.__adminInline').forEach(x=>x.remove());

    const ctrl=document.createElement('div');
    ctrl.className='__adminInline px-3 py-2 bg-slate-900/60 border-t border-white/10 col-span-12';
    ctrl.innerHTML = `
      <div class='grid grid-cols-12 gap-2 items-center text-xs'>
        <div class='col-span-12 sm:col-span-7 flex items-center gap-2'>
          <label class='text-slate-400'>Status</label>
          <select class='rounded px-2 py-1 bg-white/5 border border-white/10' id='__st'>
            ${['PENDING','WON','LOST','VOID','HALF_WON','HALF_LOST'].map(s=>`<option value='${s}' ${bet.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <label class='text-slate-400'>Scor</label>
          <input class='rounded px-2 py-1 bg-white/5 border border-white/10' id='__score' placeholder='ex: 2-1' value="${bet.score||''}">
          <button class='rounded px-3 py-1 bg-white text-slate-900 font-semibold' id='__apply'>Aplică</button>
        </div>
        <div class='col-span-12 sm:col-span-5 text-right text-slate-400'>ID grup: <strong>${bet.apiId}</strong></div>
      </div>`;

    const wrapper=document.createElement('div');
    wrapper.className='grid grid-cols-12';
    wrapper.appendChild(ctrl);
    hostRow.after(wrapper);

    wrapper.querySelector('#__apply').addEventListener('click', async ()=>{
      const st = wrapper.querySelector('#__st').value;
      const sc = wrapper.querySelector('#__score').value.trim();
      try{
        const res = await fetch('/api/bets/update_status.php', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ bet_group_id: Number(bet.apiId), status: st.toLowerCase(), score: sc })
        });
        if(!res.ok) throw 0;
        toast('Actualizat.');
        await reloadData();
      }catch(e){
        toast('Eroare la actualizare.','error');
      }
    });
  }

  // ===== Detail drawer
  function openDetail(id){
    const b = state.all.find(x => x.id === id);
    if(!b) return;

    const ov = document.getElementById('ov');
    const dr = document.getElementById('drawer');
    ov.classList.add('show');
    dr.classList.add('show');

    // header vizual favorit
    const headEl = document.getElementById('drawerHead');
    const favEl  = document.getElementById('d_headFav');
    if (b.pinned){
      headEl.classList.add('pinned-head');
      favEl.classList.remove('hidden');
    } else {
      headEl.classList.remove('pinned-head');
      favEl.classList.add('hidden');
    }

    // ID + timestamp
    document.getElementById('d_id').textContent =
      b.id + (b.apiId ? ` (grp ${b.apiId})` : ``);

    document.getElementById('d_ts').textContent =
      new Date(b.ts).toLocaleString('ro-RO');

    // badge status
    const badge = document.getElementById('d_badge');
    badge.className = 'badge ' + sevColor(b.status);
    badge.textContent = b.status + ' • ' + (b.type || 'SINGLE');

    // titlu eveniment
    document.getElementById('d_title').textContent = b.event;

    // meta line
    document.getElementById('d_meta').innerHTML =
      `Liga: <strong>${b.league || '—'}</strong> • ` +
      `Book: <strong>${b.book || '—'}</strong> • ` +
      `Cote: <strong>${(b.odds||0).toFixed(2)}</strong> • ` +
      `Miză: <strong>${fmtEUR(b.stake)}</strong> • ` +
      `Return: <strong>${fmtEUR(b.ret)}</strong> • ` +
      `P&L: <strong class="${b.pnl>=0?'text-emerald-300':'text-rose-300'}">`+
        `${(b.pnl>=0?'+':'')+fmtEUR(b.pnl)}`+
      `</strong>`;

    // extras (scor / note)
    document.getElementById('d_extras').textContent =
      `Scor: ${b.score || '—'} • Note: ${b.notes || '—'}`;

    // statistici bilet
    const dStats = document.getElementById('d_stats');
    const roiPct = (b.stake > 0)
      ? ((b.pnl / b.stake) * 100).toFixed(2)
      : '0.00';

    dStats.innerHTML = `
      <div class="text-slate-400">Miză</div>
      <div class="text-right font-medium">${fmtEUR(b.stake)}</div>

      <div class="text-slate-400">Return</div>
      <div class="text-right font-medium">${fmtEUR(b.ret)}</div>

      <div class="text-slate-400">P&L</div>
      <div class="text-right font-medium ${b.pnl>=0?'text-emerald-300':'text-rose-300'}">
        ${(b.pnl>=0?'+':'')+fmtEUR(b.pnl)}
      </div>

      <div class="text-slate-400">ROI</div>
      <div class="text-right font-medium">${roiPct}%</div>

      <div class="text-slate-400">Book</div>
      <div class="text-right font-medium">${b.book || '—'}</div>

      <div class="text-slate-400">Status</div>
      <div class="text-right font-medium">${b.status}</div>
    `;

    // detalii tehnice doar pt admin
    const techWrap   = document.getElementById('techWrap');
    const payloadPre = document.getElementById('d_payload');
    const btnCopy    = document.getElementById('btnCopyPayload');

    if (IS_ADMIN) {
      techWrap.classList.remove('hidden');

      const rawPayload = {
        id: b.id,
        apiId: b.apiId,
        eventAll: b.eventAll,
        tags: b.tags
      };
      payloadPre.textContent = JSON.stringify(rawPayload, null, 2);

      btnCopy.onclick = () => {
        navigator.clipboard.writeText(payloadPre.textContent || '')
          .then(()=> toast('Copiat în clipboard', 'success'))
          .catch(()=> toast('Nu am putut copia', 'error'));
      };

    } else {
      techWrap.classList.add('hidden');
      payloadPre.textContent = '';
      btnCopy.onclick = null;
    }
  }

  function closeDetail(){
    const ov = document.getElementById('ov');
    const dr = document.getElementById('drawer');
    ov.classList.remove('show');
    dr.classList.remove('show');
  }
  document.getElementById('ov').addEventListener('click', closeDetail);
  document.getElementById('btnCloseDrawer').addEventListener('click', closeDetail);

  // ===== Exports (exportăm TOT setul filtrat, nu doar pagina curentă)
  function exportCSV(items){
    const header='id,apiId,ts,sport,league,type,event,odds,stake,ret,pnl,status,book\n';
    const lines = items.map(b=>
      [b.id,b.apiId,new Date(b.ts).toISOString(),b.sport,b.league,b.type,b.event,(b.odds||0).toFixed(2),b.stake.toFixed(2),b.ret.toFixed(2),b.pnl.toFixed(2),b.status,b.book]
        .map(x=>`"${String(x).replace(/"/g,'""')}"`)
        .join(',')
    );
    const blob=new Blob([header+lines.join('\n')],{type:'text/csv'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='istoric_pariuri.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportJSON(items){
    const blob=new Blob([JSON.stringify(items,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='istoric_pariuri.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ===== Bindings (liste, sort, paginare)
  document.getElementById('rangePreset').addEventListener('change',(e)=>{
    const v=e.target.value;
    const custom=document.getElementById('rangeCustom');
    if(v==='custom'){
      custom.classList.remove('hidden');
    } else {
      custom.classList.add('hidden');
      setPreset(v);
      reloadData();
    }
  });

  document.getElementById('btnApply').addEventListener('click', ()=> renderRows());

  document.getElementById('btnReset').addEventListener('click', ()=>{
    ['fltSearch','fltSport','fltStatus','fltType','fltBook','fltMinOdds'].forEach(id=>{
      const el=document.getElementById(id);
      if(el.tagName==='SELECT') el.value='';
      else el.value='';
    });
    document.getElementById('fltPinned').checked=false;
    document.getElementById('fltLive').checked=false;
    document.getElementById('rangePreset').value='30';
    document.getElementById('rangeCustom').classList.add('hidden');
    setPreset('30');
    reloadData();
  });

  document.querySelectorAll('[data-sort]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const k=b.getAttribute('data-sort');
      if(state.sortKey===k){
        state.sortDir = (state.sortDir==='asc')?'desc':'asc';
      } else {
        state.sortKey=k;
        state.sortDir='asc';
      }
      renderRows();
    });
  });

  document.getElementById('perPage').addEventListener('change', (e)=>{
    state.perPage=parseInt(e.target.value,10)||50;
    state.page=1;
    renderRows();
  });

  document.getElementById('prevPage').addEventListener('click', ()=>{
    state.page=Math.max(1,state.page-1);
    renderRows();
  });

  document.getElementById('nextPage').addEventListener('click', ()=>{
    const total=getFilteredSorted().length;
    const pages=Math.max(1,Math.ceil(total/state.perPage));
    state.page=Math.min(pages,state.page+1);
    renderRows();
  });

  document.getElementById('btnExportCSV').addEventListener('click', ()=>{
    const fullFiltered = getFilteredSorted();
    exportCSV(fullFiltered);
  });
  document.getElementById('btnExportJSON').addEventListener('click', ()=>{
    const fullFiltered = getFilteredSorted();
    exportJSON(fullFiltered);
  });

  // ===== Admin add modal
  <?php if ($isAdmin): ?>
  const dlg = document.getElementById('dlg');
  const btnAdd = document.getElementById('btnAdd');
  const groupUID = document.getElementById('group_uid');
  const btnRegenUID = document.getElementById('btnRegenUID');
  const dtInput = document.getElementById('event_at_dt');

  function pad(n){ return String(n).padStart(2,'0'); }
  function toLocalDTValue(d){
    return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
  }
  function genGroupUID(){
    const d=new Date();
    const y=d.getFullYear(), m=pad(d.getMonth()+1), a=pad(d.getDate());
    const rnd=Math.random().toString(16).slice(2,6).toUpperCase();
    return `BG-${y}-${m}-${a}-${rnd}`;
  }

  btnAdd?.addEventListener('click', ()=>{
    groupUID.value = genGroupUID();
    const base=new Date();
    base.setMinutes(base.getMinutes()+120,0,0);
    dtInput.value = toLocalDTValue(base);

    document.getElementById('formAdd').reset();
    groupUID.value = genGroupUID();
    dtInput.value = toLocalDTValue(base);

    dlg.showModal();
  });

  btnRegenUID?.addEventListener('click', ()=>{
    groupUID.value = genGroupUID();
  });

  document.getElementById('btnCancel')?.addEventListener('click', ()=>{
    dlg.close();
  });

  document.getElementById('formAdd')?.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    payload.currency = 'eur';

    payload.odds = parseFloat(payload.odds||'0');
    payload.stake_eur = parseFloat(payload.stake_eur||'0');

    const raw = (payload.event_at_dt||'').trim();
    if(!raw){
      document.getElementById('errAdd').classList.remove('hidden');
      return;
    }
    payload.event_at = raw.replace('T',' ').slice(0,16);
    delete payload.event_at_dt;

    if(!payload.group_uid) payload.group_uid = genGroupUID();

    try{
      const res = await fetch('/api/bets/create.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw 0;
      dlg.close();
      ev.currentTarget.reset();
      toast('Bet creat.');
      await reloadData();
    }catch(e){
      document.getElementById('errAdd').classList.remove('hidden');
    }
  });
  <?php endif; ?>

  // ===== Data reload
  async function reloadData(){
    state.page=1;
    state.all = await fetchApiBets();
    renderRows();
  }

  // ===== Bootstrap
  (async function init(){
    setPreset('30');
    await reloadData();
  })();
  </script>
</body>
</html>
