<?php
// /v1/retrageri.php — Banca Comună (min 10€ on-blur + IBAN flow + history include REJECTED)
session_start();
$me   = $_SESSION['user'] ?? null;
$role = strtoupper($me['role'] ?? 'GUEST');
if ($role==='GUEST') { header('Location: /v1/login.html'); exit; }

function e($s){ return htmlspecialchars((string)$s, ENT_QUOTES,'UTF-8'); }
$name = trim($me['name'] ?? ($me['email'] ?? 'Investitor'));
?>
<!DOCTYPE html>
<html lang="ro" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Retrageri — Banca Comună de Investiții</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <style>
    :root{ --acc-1:#2563eb; --acc-2:#06b6d4; --acc-3:#14b8a6; }
    html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    .hero-gradient{ background: linear-gradient(135deg, var(--acc-1), var(--acc-2), var(--acc-3)); background-size:180% 180%; animation: gm 10s ease infinite }
    @keyframes gm{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    .glow{ box-shadow:0 10px 30px rgba(34,211,238,.25), inset 0 0 0 1px rgba(255,255,255,.06) }
    .card-hover{ transition: transform .25s ease, box-shadow .25s ease }
    .card-hover:hover{ transform:translateY(-3px); box-shadow:0 15px 45px rgba(0,0,0,.35) }
    .nice-scroll::-webkit-scrollbar{ width:8px } .nice-scroll::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.15); border-radius:8px }
    .toast{display:flex;align-items:center;gap:.5rem;padding:.6rem .8rem;border-radius:.75rem;border:1px solid rgba(255,255,255,.12);background:rgba(2,6,23,.95);backdrop-filter:blur(6px)}
    .toast.success{border-color:rgba(34,197,94,.35)} .toast.warn{border-color:rgba(234,179,8,.35)} .toast.error{border-color:rgba(239,68,68,.35)}
    .badge{ padding:.25rem .5rem; border-radius:.5rem; font-size:.75rem; line-height:1rem; white-space:nowrap }
    .modal{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(2,6,23,.7); backdrop-filter: blur(6px) }
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100"
      data-role="<?= e($role) ?>"
      data-user-name="<?= e($name) ?>">

  <!-- Toasts -->
  <div id="toasts" class="fixed top-4 right-4 z-[70] space-y-2"></div>

  <!-- Gate -->
  <script>
    (function(){ const role=(document.body.dataset.role||'GUEST').toUpperCase(); if(role==='GUEST') location.replace('/v1/login.html'); })();
  </script>

  <!-- NAV -->
  <header class="sticky top-0 z-50 bg-slate-950/70 backdrop-blur border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/v1/dashboard-investitor.php" class="flex items-center gap-3">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-extrabold glow">PI</span>
        <div>
          <div class="font-semibold tracking-wide">Pariază Inteligent</div>
          <div class="text-xs text-slate-400 -mt-0.5">Retrageri</div>
        </div>
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm text-slate-300">
        <a class="hover:text-white" href="/v1/dashboard-investitor.php">Dashboard</a>
        <a class="hover:text-white" href="/v1/investitii.php">Investiții</a>
        <a class="text-white" href="/v1/retrageri.php">Retrageri</a>
        <a class="hover:text-white" href="/v1/profil.html">Profil</a>
      </nav>
      <div class="flex items-center gap-2">
        <a href="/v1/dashboard-investitor.php" class="rounded-xl px-3 py-2 border border-white/10 hover:border-white/20 text-sm">
          <i class="fa-solid fa-arrow-left mr-2"></i>Înapoi la Dashboard
        </a>
      </div>
    </div>
  </header>

  <!-- HERO -->
  <section class="relative overflow-hidden">
    <div class="absolute inset-0 hero-gradient opacity-20"></div>
    <div class="max-w-7xl mx-auto px-4 py-8 md:py-12 relative">
      <div class="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold">Retrageri</h1>
          <p class="text-slate-300 max-w-xl">
            Minim <strong>10 €</strong> per retragere. Pentru transfer bancar avem nevoie de
            <strong>IBAN + Titular</strong>.
          </p>
        </div>
        <div class="text-sm text-slate-400">Cont: <span class="font-medium text-slate-200" id="userName"></span></div>
      </div>
    </div>
  </section>

  <main class="max-w-7xl mx-auto px-4 pb-20">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Solicită Retragere -->
      <section class="lg:col-span-2 card-hover rounded-2xl border border-white/10 bg-white/5 p-5" id="cardWithdraw">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Solicită o Retragere</h2>
          <span class="text-xs text-slate-400">
  Procesare medie: <span id="avgProc">—</span>
</span>


        </div>

        <div class="space-y-4 text-sm">
          <!-- Sold disponibil -->
          <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-4 flex items-center justify-between">
            <div>
              <div class="text-slate-400">Suma disponibilă pentru retragere (Sold Total Curent):</div>
              <div id="available" class="text-xl font-extrabold mt-1">—</div>
            </div>
            <span id="availBadge" class="badge bg-white/10 text-slate-300 border border-white/10">live</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- stânga -->
            <div>
              <label class="text-slate-300" for="amount">Sumă de retras (€)</label>
              <input id="amount" type="number" min="10" step="1" placeholder="Ex: 1000"
                     class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-cyan-400/60"/>
              <p class="text-xs text-slate-400 mt-1">Minim 10 €. Poți apăsa rapid:</p>

              <div class="mt-1 flex flex-wrap gap-2" id="quickChips">
                <button data-quick="0.25" class="px-2 py-1 text-xs rounded-lg border border-white/10 hover:border-white/20">25%</button>
                <button data-quick="0.5"  class="px-2 py-1 text-xs rounded-lg border border-white/10 hover:border-white/20">50%</button>
                <button data-quick="0.75" class="px-2 py-1 text-xs rounded-lg border border-white/10 hover:border-white/20">75%</button>
                <button data-quick="1"    class="px-2 py-1 text-xs rounded-lg border border-white/10 hover:border-white/20">100%</button>
              </div>

              <!-- Estimare taxă -->
              <div class="mt-3 rounded-xl border border-white/10 bg-slate-900/60 p-3 text-slate-300">
                <div class="flex items-center justify-between text-sm">
                  <span>Taxă de Platformă (dinamică)</span>
                  <span id="feePct">—</span>
                </div>
                <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>Taxă estimată</div><div class="text-right" id="feeEst">—</div>
                  <div>Net care îți intră</div><div class="text-right font-medium" id="netEst">—</div>
                  <div>De scăzut din sold</div><div class="text-right" id="impactEst">—</div>
                </div>
                <div class="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Algoritm influențat de: #investitori, cereri în curs, lichiditate.</span>
                  <span id="surgeBadge" class="badge bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">Normal</span>
                </div>
                <div class="mt-2 text-[11px] text-slate-400">
                  <strong>Mod taxare:</strong> <code>pe deasupra</code> — primești suma cerută; taxa se scade suplimentar din sold.
                </div>
              </div>
            </div>

            <!-- dreapta: Payout profile mini-card -->
            <div>
              <label class="text-slate-300">Detalii plată (IBAN)</label>
              <div class="mt-1 p-3 rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 text-sm leading-relaxed">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-slate-400 text-xs">Titular</div>
                    <div id="ppHolder" class="font-medium">—</div>
                  </div>
                  <button id="btnEditIban" class="rounded-lg px-2 py-1 border border-white/10 hover:border-white/20 text-xs">
                    <i class="fa-regular fa-pen-to-square mr-1"></i>Editează
                  </button>
                </div>
                <div class="mt-2">
                  <div class="text-slate-400 text-xs">IBAN</div>
                  <div id="ppIban" class="font-mono text-sm">—</div>
                </div>
                <div id="ppWarn" class="mt-2 text-xs text-amber-300 hidden">
                  <i class="fa-solid fa-triangle-exclamation mr-1"></i> Nu ai IBAN salvat. Îl poți adăuga acum.
                </div>
              </div>

              <div class="mt-3 p-3 rounded-xl border border-white/10 bg-slate-900/60 text-xs text-slate-300">
                <ul class="list-disc ml-5 space-y-1">
                  <li>Suma solicitată trebuie să fie ≥ <strong>10 €</strong> și ≤ soldul disponibil <em>minus taxa</em>.</li>
                  <li>Dacă nu ai IBAN, îl poți salva înaintea retragerii.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <button id="btnWithdraw"
              class="inline-flex items-center gap-2 rounded-2xl px-5 py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-semibold shadow hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed">
              <i class="fa-solid fa-money-bill-transfer"></i>
              <span>Trimite Cererea de Retragere</span>
            </button>
            <span id="state" class="text-xs text-slate-400"></span>
          </div>
        </div>
      </section>

      

      <!-- Statut cereri -->
      <section class="card-hover rounded-2xl border border-white/10 bg-white/5 p-5" id="cardPending">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Statutul Cererilor Tale</h2>
          <div class="flex items-center gap-2">
            <select id="pendingRange" class="rounded-xl bg-white/5 border border-white/10 px-2 py-1 text-xs outline-none focus:border-cyan-400/60">
              <option value="30">30 zile</option><option value="90" selected>90 zile</option><option value="365">12 luni</option><option value="all">Toate</option>
            </select>
            <button id="btnRefresh" class="rounded-xl px-3 py-1.5 border border-white/10 hover:border-white/20 text-xs flex items-center gap-1"><i class="fa-solid fa-rotate"></i><span>Refresh</span></button>
          </div>
        </div>
        <ul id="pendingList" class="space-y-3 text-sm"></ul>
        <div id="pendingEmpty" class="hidden text-sm text-slate-400">Nu ai cereri în așteptare.</div>
      </section>

      <!-- Istoric retrageri (aprobat + respins) -->
      <section class="card-hover rounded-2xl border border-white/10 bg-white/5 p-5" id="cardHistory">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">Istoricul Retragerilor</h2>
          <div class="flex items-center gap-2">
            <select id="historyRange" class="rounded-xl bg-white/5 border border-white/10 px-2 py-1 text-xs outline-none focus:border-cyan-400/60">
              <option value="90">90 zile</option><option value="365" selected>12 luni</option><option value="all">Toate</option>
            </select>
            <button id="btnExportCSV" class="rounded-xl px-3 py-1.5 border border-white/10 hover:border-white/20 text-xs flex items-center gap-1">
              <i class="fa-solid fa-file-csv"></i><span>Export CSV</span>
            </button>
          </div>
        </div>
        <ul id="historyList" class="space-y-3 text-sm"></ul>
        <div id="historyEmpty" class="hidden text-sm text-slate-400">Nu ai retrageri în acest interval.</div>
      </section>

      

      <!-- Diagnostics ascuns (opțional) -->
      <section class="hidden card-hover rounded-2xl border border-white/10 bg-white/5 p-5" id="cardDiag">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold">Diagnostics & Teste</h2>
          <button id="btnRunTests" class="rounded-xl px-3 py-1.5 border border-white/10 hover:border-white/20 text-xs flex items-center gap-1"><i class="fa-solid fa-vial"></i><span>Rulează teste</span></button>
        </div>
        <div id="testOut" class="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed"></div>
      </section>

    </div>
  </main>

  <footer class="py-8 border-t border-white/5">
    <div class="max-w-7xl mx-auto px-4 text-sm text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>© <span id="year"></span> Pariază Inteligent — Retrageri</div>
      <div class="flex items-center gap-4">
        <a class="hover:text-white" href="/v1/dashboard-investitor.php">Dashboard</a>
        <a class="hover:text-white" href="/v1/profil.html">Profil</a>
        <a class="hover:text-white text-rose-300" href="/logout.php">Deconectare</a>
      </div>
    </div>
  </footer>

  <!-- MODAL IBAN -->
  <div id="ibanModal" class="modal hidden z-[80]">
    <div class="w-full max-w-md rounded-2xl bg-slate-900/95 border border-white/10 p-5">
      <div class="flex items-start justify-between">
        <h3 class="text-lg font-semibold">Adaugă datele de plată</h3>
        <button id="ibanClose" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <p class="text-sm text-slate-400 mt-1">Pentru a retrage, avem nevoie de <strong>IBAN</strong> și <strong>titular</strong>.</p>
      <div class="mt-4 space-y-3 text-sm">
        <div>
          <label class="text-slate-300">Titular cont</label>
          <input id="inpHolder" type="text" placeholder="Ex: Popescu Andrei"
                 class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-cyan-400/60">
        </div>
        <div>
          <label class="text-slate-300">IBAN</label>
          <input id="inpIban" type="text" placeholder="RO49AAAA1B31007593840000"
                 class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-cyan-400/60">
          <div class="text-xs text-slate-500 mt-1">Se verifică automat (mod-97). Poți scrie cu spații sau fără.</div>
        </div>
      </div>
      <div class="mt-4 flex items-center justify-between">
        <button id="ibanSave" class="rounded-xl px-4 py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-semibold">
          Salvează în cont
        </button>
        <button id="ibanCancel" class="rounded-xl px-3 py-2 border border-white/10 hover:border-white/20 text-sm">Renunță</button>
      </div>
      <div id="ibanErr" class="mt-3 text-xs text-rose-300 hidden"></div>
    </div>
  </div>

  <script>
    document.getElementById('year').textContent = new Date().getFullYear();
    document.getElementById('userName').textContent = document.body.dataset.userName || 'Investitor';

    /* ---------- Helpers ---------- */
    function showToast(msg,type='success'){
      const box=document.createElement('div');
      box.className=`toast ${type}`;
      box.innerHTML = `<i class='fa-solid ${
        type==='success' ? 'fa-circle-check' : type==='warn' ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'
      }'></i><span>${msg}</span>`;
      document.getElementById('toasts').appendChild(box);
      setTimeout(()=> box.remove(), 3000);
    }
    function fmtEUR(v){ return new Intl.NumberFormat('ro-RO',{style:'currency',currency:'EUR'}).format(v); }
    
    function humanizeAvg(seconds){
  if(!Number.isFinite(seconds) || seconds<=0) return '—';
  const h = Math.round(seconds/3600);
  if (h < 48) return `~${h}h`;
  const d = Math.round(seconds/86400*10)/10; // o zecimală
  return d % 1 === 0 ? `~${d} zile` : `~${d.toFixed(1)} zile`;
}
function renderAvgProcDisplay(avgSeconds){
  const el = document.getElementById('avgProc');
  if(!el) return;
  el.textContent = (Number.isFinite(avgSeconds) && avgSeconds > 0)
    ? humanizeAvg(avgSeconds)
    : '—';
}



    /* ---------- Constante ---------- */
    const MIN_WITHDRAW_EUR = 10;

    /* ---------- State ---------- */
    const state = {
  balance: 0,
  items: [],
  metrics: { investors:0, pending:0, liquidity:1 },
  feeRate: null,
  historyFiltered: [],
  payout: { has:false, iban:null, holder:null }
};


    /* ---------- IBAN utils ---------- */
    function cleanIban(s){ return (s||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
    function maskIban(s){ s=cleanIban(s); if(!s) return '—'; if(s.length<=8) return s; return s.slice(0,4)+'••••••'+s.slice(-4); }
    function ibanMod97(iban){
      const A='A'.charCodeAt(0);
      let str = (iban.slice(4) + iban.slice(0,4)).toUpperCase().replace(/[^A-Z0-9]/g,'');
      let converted = '';
      for (let i=0;i<str.length;i++){
        const ch=str[i];
        if(/[A-Z]/.test(ch)) converted += (ch.charCodeAt(0)-A+10).toString();
        else converted += ch;
      }
      let rem=0;
      for(let i=0;i<converted.length;i++){ rem = (rem*10 + (converted.charCodeAt(i)-48)) % 97; }
      return rem;
    }
    function isValidIBAN(s){
      const x=cleanIban(s);
      if(x.length<15 || x.length>34) return false;
      return ibanMod97(x)===1;
    }

    /* ---------- API ---------- */
    async function loadSummary(){
      try{ const r=await fetch('/api/wallet/summary.php',{credentials:'include'}); const j=await r.json(); return { balance:+(j.balance_eur||0) }; }catch{ return { balance:0 }; }
    }
    async function loadTransactions(){
      try{ const r=await fetch('/api/user/transactions.php',{credentials:'include'}); const j=await r.json(); return Array.isArray(j)?j:(j.items||[]); }
      catch{ return []; }
    }
    async function loadPlatformMetrics(){
      try{ const r=await fetch('/api/platform/metrics.php',{credentials:'include'}); const m=await r.json(); return { investors:m.investors_total??800, pending:m.pending_withdrawals??6, liquidity:m.liquidity_ratio??0.72 }; }
      catch{ return { investors:800, pending:6, liquidity:0.72 }; }
    }
    async function loadPayoutProfile(){
      try{
        const r=await fetch('/api/user/payout_profile.php',{credentials:'include'});
        if(!r.ok) throw 0;
        const j=await r.json();
        const iban = (j.iban||'').trim();
        const holder = (j.holder_name||'').trim();
        state.payout = { has: !!(iban&&holder), iban, holder };
      }catch{
        state.payout = { has:false, iban:null, holder:null };
      }
      renderPayoutMini();
    }
    async function savePayoutProfile(iban, holder){
      const r = await fetch('/api/user/payout_profile_upsert.php',{
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify({ iban, holder_name: holder })
      });
      const j = await r.json().catch(()=>null);
      if(!r.ok || !j || !j.ok) throw new Error((j&&j.error)||'server_error');
      return true;
    }

    /* ---------- Taxă dinamică ---------- */
    const FEE_MODE='on_top';
    const FEE_PARAMS = {
  base: 0.0399,     // 3,99% bază
  min:  0.0399,     // limită minimă 3,99%
  max:  0.2199,     // limită maximă 21,99%
  a: 0.012, k: 0.7, N0: 500, scale: 300, // rămân neschimbate
  b: 0.007, pending_norm: 50,            // la fel
  c: 0.010,
  fixed: 0.99       // +0,99 € fix
};

    function clamp(x,min,max){ return Math.max(min,Math.min(max,x)); }
    function sigmoid(x,k){ return 1/(1+Math.exp(-(k||1)*x)); }
    function computeFeeRate(m){
      const sInvest=sigmoid((m.investors- (FEE_PARAMS.N0||1))/(FEE_PARAMS.scale||1),FEE_PARAMS.k);
      const sPending=clamp((m.pending||0)/(FEE_PARAMS.pending_norm||50),0,1);
      const sLiq=clamp(1-(m.liquidity??1),0,1);
      return clamp(FEE_PARAMS.base + FEE_PARAMS.a*sInvest + FEE_PARAMS.b*sPending + FEE_PARAMS.c*sLiq, FEE_PARAMS.min, FEE_PARAMS.max);
    }
    function surgeLevel(rate){
  const b = FEE_PARAMS.base;
  if (rate <= b + 0.02) {
    return {label:'Normal',   cls:'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'};
  }
  if (rate <= b + 0.08) {
    return {label:'Moderată', cls:'bg-amber-500/15 text-amber-200 border border-amber-400/30'};
  }
  return {label:'Ridicată',   cls:'bg-rose-500/15 text-rose-200 border border-rose-400/30'};
}

    function computeFee(amount){
      const rate = state.feeRate ?? computeFeeRate(state.metrics);
      const fee = +(amount*rate + (FEE_PARAMS.fixed||0)).toFixed(2);
      const net = amount;
      const impact = +(amount + fee).toFixed(2);
      return { rate, fee, net, balanceImpact:impact };
    }

    /* ---------- Payout mini-card ---------- */
    function renderPayoutMini(){
      const h=document.getElementById('ppHolder'); const i=document.getElementById('ppIban'); const w=document.getElementById('ppWarn');
      if(state.payout.has){
        h.textContent = state.payout.holder||'—';
        i.textContent = maskIban(state.payout.iban);
        w.classList.add('hidden');
      }else{
        h.textContent = '—';
        i.textContent = '—';
        w.classList.remove('hidden');
      }
    }

    /* ---------- Estimări & validare ---------- */
    function updateAvailBadge(){
  const badge = document.getElementById('availBadge');
  if(!badge) return;
  badge.textContent = 'live';
  badge.className = 'badge bg-white/10 text-slate-300 border border-white/10';
}

    function surgeBadge(rate){
      const lvl=surgeLevel(rate);
      const sb=document.getElementById('surgeBadge'); sb.textContent=lvl.label; sb.className='badge '+lvl.cls;
    }
    // IMPORTANT: nu mai forțăm 10€ pe input; doar calculăm dacă e valid numeric
    function updateDynEst(){
      const input=document.getElementById('amount');
      let amount = parseFloat(input.value||'');
      const pctEl = document.getElementById('feePct');
      const feeEl = document.getElementById('feeEst');
      const netEl = document.getElementById('netEst');
      const impEl = document.getElementById('impactEst');

      if(!Number.isFinite(amount) || amount<=0){
        pctEl.textContent='—'; feeEl.textContent='—'; netEl.textContent='—'; impEl.textContent='—';
        return;
      }
      const {rate,fee,net,balanceImpact} = computeFee(amount);
      pctEl.textContent=(rate*100).toFixed(2)+'%';
      feeEl.textContent=fmtEUR(fee);
      netEl.textContent=fmtEUR(net);
      impEl.textContent=fmtEUR(balanceImpact);
      surgeBadge(rate);
    }
    // aplicăm minimul DOAR la blur/change sau la trimitere
    function enforceMinOnBlur(){
      const el=document.getElementById('amount');
      let v=parseFloat(el.value||'0');
      if(!Number.isFinite(v) || v<MIN_WITHDRAW_EUR){
        el.value = String(MIN_WITHDRAW_EUR);
        updateDynEst();
      }
    }
    function validateAmount(amount, balance){
      if(!Number.isFinite(amount) || amount<MIN_WITHDRAW_EUR || amount>100000) return false;
      const { balanceImpact } = computeFee(amount);
      return (balanceImpact <= balance + 1e-8);
    }

    /* ---------- Lists (pending/history) ---------- */
    function inRange(dateISO, days){ if(days==='all')return true; const d=new Date(dateISO); const diff=(Date.now()-d)/86400000; return diff<=parseInt(days,10); }
    function renderPending(items){
      const wrap=document.getElementById('pendingList'), empty=document.getElementById('pendingEmpty'); wrap.innerHTML='';
      const days=document.getElementById('pendingRange').value;
      const pending=items.filter(t=>t.type==='WITHDRAWAL_REQUEST' && (t.status||'').toUpperCase()==='PENDING' && inRange(t.date,days)).sort((a,b)=>a.date>b.date?-1:1);
      (pending.length?empty.classList.add('hidden'):empty.classList.remove('hidden'));
      pending.forEach(t=>{
        const li=document.createElement('li');
        li.className='rounded-xl border border-white/10 bg-slate-900/60 p-3';
        li.innerHTML=`<div class='flex items-start justify-between flex-wrap gap-3'>
          <div class='flex items-start gap-3'><i class="fa-solid fa-hourglass-half text-amber-300 mt-0.5 text-sm"></i>
            <div><div class='font-medium'>Cerere #${t.id}</div><div class='text-xs text-slate-400'>${t.date} • ${t.method||'—'}</div></div>
          </div>
          <div class='font-semibold text-amber-200 text-right min-w-[120px]'>${fmtEUR(t.amount)}</div></div>`;
        wrap.appendChild(li);
      });
    }

    function vizForStatus(s){
      s=(s||'').toUpperCase();
      if(s==='APPROVED' || s==='SETTLED') return {label:'Retragere aprobată', icon:'fa-circle-check', cls:'text-emerald-300', amt:'text-emerald-200'};
      if(s==='REJECTED') return {label:'Retragere respinsă', icon:'fa-circle-xmark', cls:'text-rose-300', amt:'text-rose-200'};
      if(s==='CANCELED') return {label:'Retragere anulată', icon:'fa-circle-minus', cls:'text-slate-300', amt:'text-slate-200'};
      return {label:'Retragere procesată', icon:'fa-circle-info', cls:'text-slate-300', amt:'text-slate-200'};
    }

    function renderHistory(items){
      const wrap=document.getElementById('historyList'), empty=document.getElementById('historyEmpty'); wrap.innerHTML='';
      const days=document.getElementById('historyRange').value;

      // includem: WITHDRAWAL (orice status) + REJECTED din WITHDRAWAL_REQUEST
      const rows = items.filter(t=>
        inRange(t.date,days) && (
          t.type==='WITHDRAWAL' ||
          (t.type==='WITHDRAWAL_REQUEST' && (t.status||'').toUpperCase()==='REJECTED')
        )
      ).sort((a,b)=>a.date>b.date?-1:1);

      state.historyFiltered=rows;
      (rows.length?empty.classList.add('hidden'):empty.classList.remove('hidden'));

      rows.forEach(t=>{
        const v = vizForStatus(t.status);
        const li=document.createElement('li');
        li.className='rounded-xl border border-white/10 bg-slate-900/60 p-3 flex items-start justify-between flex-wrap gap-3';
        li.innerHTML=`<div class="flex items-start gap-3">
            <i class="fa-solid ${v.icon} ${v.cls} mt-0.5 text-sm"></i>
            <div>
              <div class='font-medium'>${v.label}</div>
              <div class='text-xs text-slate-400'>${t.date} • ${t.method||'—'} • ${t.status||''}</div>
            </div>
          </div>
          <div class='font-semibold ${v.amt} text-right min-w-[120px]'>${fmtEUR(t.amount)}</div>`;
        wrap.appendChild(li);
      });
    }

function computeAvgFromTransactions(items){
  try{
    if(!Array.isArray(items) || !items.length) return null;
    const approved = items
      .filter(t => t.type === 'WITHDRAWAL' && /^(APPROVED|SETTLED)$/i.test(t.status||''))
      .map(t => ({...t, ts: new Date(t.date).getTime()}))
      .sort((a,b)=>a.ts-b.ts);

    const reqs = items
      .filter(t => t.type === 'WITHDRAWAL_REQUEST')
      .map(t => ({...t, ts: new Date(t.date).getTime()}))
      .sort((a,b)=>a.ts-b.ts);

    if(!approved.length || !reqs.length) return null;

    const used = new Set();
    const secs = [];
    for(const w of approved){
      let bestIdx = -1, bestDiff = Infinity;
      for(let i=0;i<reqs.length;i++){
        if(used.has(i)) continue;
        const r = reqs[i];
        if(r.ts > w.ts) break;
        const diff = w.ts - r.ts;
        if(diff >= 0 && diff < bestDiff){
          bestDiff = diff;
          bestIdx = i;
        }
      }
      // limităm perechile la 30 zile ca să evităm matching greșit
      if(bestIdx >= 0 && bestDiff <= 30*24*3600*1000){
        used.add(bestIdx);
        secs.push(bestDiff/1000);
      }
    }
    if(!secs.length) return null;
    const avg = secs.reduce((a,b)=>a+b,0)/secs.length;
    return { avgSeconds: avg, n: secs.length };
  }catch{ return null; }
}


    function exportCSV(items){
      const header='date,type,status,method,amount\n';
      const lines=items.map(t=>[t.date,t.type,t.status||'',t.method||'',t.amount].join(','));
      const blob=new Blob([header+lines.join('\n')],{type:'text/csv'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='retrageri.csv'; a.click(); URL.revokeObjectURL(a.href);
    }
    (function exportBtnHook(){ document.getElementById('btnExportCSV').onclick=()=>exportCSV(state.historyFiltered||[]); })();

    

    /* ---------- Modal IBAN ---------- */
    const modal = document.getElementById('ibanModal'), mErr=document.getElementById('ibanErr');
    function openIban(){ modal.classList.remove('hidden'); mErr.classList.add('hidden'); document.getElementById('inpHolder').value=state.payout.holder||''; document.getElementById('inpIban').value=state.payout.iban||''; }
    function closeIban(){ modal.classList.add('hidden'); }
    document.getElementById('btnEditIban').addEventListener('click', openIban);
    document.getElementById('ibanClose').addEventListener('click', closeIban);
    document.getElementById('ibanCancel').addEventListener('click', closeIban);
    document.getElementById('ibanSave').addEventListener('click', async ()=>{
      const holder=(document.getElementById('inpHolder').value||'').trim();
      const rawIban=(document.getElementById('inpIban').value||'').trim();
      const iban=cleanIban(rawIban);
      if(holder.length<4){ mErr.textContent='Introduceți numele complet al titularului.'; mErr.classList.remove('hidden'); return; }
      if(!isValidIBAN(iban)){ mErr.textContent='IBAN invalid. Verificați și încercați din nou.'; mErr.classList.remove('hidden'); return; }
      try{
        await savePayoutProfile(iban, holder);
        state.payout={has:true, iban, holder};
        renderPayoutMini();
        showToast('Date IBAN salvate.');
        closeIban();
      }catch(e){
        mErr.textContent='Nu am putut salva IBAN-ul. Încercați mai târziu.'; mErr.classList.remove('hidden');
      }
    });

    /* ---------- Evenimente formular ---------- */
    document.getElementById('quickChips').addEventListener('click',(e)=>{
      const b=e.target.closest('[data-quick]'); if(!b) return;
      let v=Math.floor(state.balance * parseFloat(b.dataset.quick));
      if(v<MIN_WITHDRAW_EUR) v=MIN_WITHDRAW_EUR;
      document.getElementById('amount').value=String(v);
      updateDynEst();
    });
    const amountEl = document.getElementById('amount');
    amountEl.addEventListener('input', updateDynEst);
    amountEl.addEventListener('blur', enforceMinOnBlur);
    amountEl.addEventListener('change', enforceMinOnBlur); // pentru mobile

    async function sendWithdrawal(amount){
      const est=computeFee(amount);
      document.getElementById('state').textContent='Trimit cererea...';
      try{
        const r=await fetch('/api/withdrawals/create.php',{
          method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
          body: JSON.stringify({ amount_eur: amount, client_fee_est_eur: est.fee, client_fee_rate: est.rate, fee_mode: 'on_top' })
        });
        const j=await r.json().catch(()=>null);
        if(!r.ok || !j || !j.ok) throw new Error((j&&j.error)||'server_error');
        showToast('Cererea ta a fost trimisă spre aprobare.');
        document.getElementById('state').textContent='';
        amountEl.value=String(MIN_WITHDRAW_EUR);
        updateDynEst();
        refresh();
      }catch(e){
        document.getElementById('state').textContent=''; showToast('Nu am putut trimite cererea.','error');
      }
    }

    document.getElementById('btnWithdraw').addEventListener('click', async ()=>{
      let amount = parseFloat(amountEl.value||'0');

      // aplicăm minimul la click (după blur oricum rulează)
      if(!Number.isFinite(amount) || amount<MIN_WITHDRAW_EUR){
        amountEl.value=String(MIN_WITHDRAW_EUR);
        updateDynEst();
        showToast('Suma minimă pentru retragere este 10 €.', 'warn');
        return;
      }
      if(!validateAmount(amount, state.balance)){
        const { balanceImpact }=computeFee(amount);
        showToast(balanceImpact>state.balance ? 'Suma + taxa depășesc fondurile disponibile.' : 'Introduceți o sumă validă.', 'warn');
        return;
      }
      if(!state.payout.has){ showToast('Nu poți retrage fără IBAN. Completează datele de plată.', 'warn'); openIban(); return; }
      await sendWithdrawal(amount);
    });

    document.getElementById('btnRefresh').addEventListener('click', ()=>{ refresh().then(()=>showToast('Actualizat')); });
    document.getElementById('pendingRange').addEventListener('change', ()=>renderPending(state.items||[]));
    document.getElementById('historyRange').addEventListener('change', ()=>{ renderHistory(state.items||[]); });

async function loadProcessingStatsFromAPI(){
  try{
    const r = await fetch('/api/user/withdrawals/processing_stats.php', { credentials:'include' });
    if(!r.ok) return null;
    const j = await r.json();
    if(j && j.ok && Number.isFinite(j.avg_seconds) && j.n > 0){
      return { avgSeconds: j.avg_seconds, n: j.n };
    }
    return null;
  }catch{ return null; }
}


    /* ---------- Refresh principal ---------- */
    async function refresh(){
      const s=await loadSummary(); state.balance=+(+s.balance).toFixed(2);
      
      document.getElementById('available').textContent=fmtEUR(state.balance);
      state.metrics = await loadPlatformMetrics();

      state.feeRate=computeFeeRate(state.metrics);
      updateAvailBadge();

      // prefill o singură dată
      if(!amountEl.value) amountEl.value=String(MIN_WITHDRAW_EUR);
      updateDynEst();

      const items=await loadTransactions(); state.items=items; renderPending(items); renderHistory(items);
      await loadPayoutProfile();
      
      // Media timpului de procesare (preferăm server => fallback client)
let stats = await loadProcessingStatsFromAPI();
if(!stats){
  const local = computeAvgFromTransactions(state.items||[]);
  if(local) stats = local;
}
renderAvgProcDisplay(stats?.avgSeconds);



      const btn=document.getElementById('btnWithdraw');
      const zero=state.balance<=0.01; btn.disabled=zero; amountEl.disabled=zero;
      btn.classList.toggle('opacity-50',zero); btn.classList.toggle('cursor-not-allowed',zero);
    }

    // Diagnostics quick (opțional)
    (function(){
      if(new URLSearchParams(location.search).get('debug')!=='1') return;
      const out=document.getElementById('testOut'), card=document.getElementById('cardDiag'); card.classList.remove('hidden');
      function log(s){ out.textContent += s+'\n'; } function ok(n,c){ log((c?'✅':'❌')+' '+n); }
      document.getElementById('btnRunTests').addEventListener('click',()=>{
        out.textContent='';
        ok('IBAN valid RO49AAAA1B31007593840000', isValidIBAN('RO49 AAAA 1B31 0075 9384 0000'));
        ok('IBAN invalid RO00AAAA...', !isValidIBAN('RO00AAAA1B31007593840000'));
        const c=computeFee(10); ok('Min 10 balanceImpact >= 10', c.balanceImpact>=10);
      });
    })();

    // init
    refresh();
  </script>
</body>
</html>
