<?php
// /v1/pariuri.php
session_start();
$me   = $_SESSION['user'] ?? null;
$role = strtoupper($me['role'] ?? 'GUEST');
if ($role==='GUEST') { header('Location: /v1/login.html'); exit; }
function e($s){ return htmlspecialchars((string)$s, ENT_QUOTES,'UTF-8'); }
$isAdmin = ($role==='ADMIN');
?>
<!DOCTYPE html>
<html lang="ro" data-theme="dark">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Jurnal Pariuri — Pariază Inteligent</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <style>
    body{background:#0b1220;color:#e5e7eb}
    .card{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);border-radius:16px}
    .btn{border:1px solid rgba(255,255,255,.12);padding:.5rem .8rem;border-radius:12px}
    .badge{padding:.2rem .5rem;border-radius:8px;font-size:.75rem}
    .status-pending{background:rgba(234,179,8,.15);color:#fde68a}
    .status-won{background:rgba(16,185,129,.2);color:#a7f3d0}
    .status-lost{background:rgba(239,68,68,.2);color:#fecaca}
    .status-void{background:rgba(148,163,184,.2);color:#e2e8f0}
  </style>
</head>
<body class="min-h-screen">
  <header class="sticky top-0 z-10 backdrop-blur bg-slate-900/60 border-b border-white/10">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="/v1/dashboard-investitor.php" class="btn">Panoul meu</a>
        <span class="text-slate-400">/</span>
        <span>Jurnal Pariuri</span>
      </div>
      <div class="flex items-center gap-3">
        <select id="fRange" class="btn">
          <option value="30d">Ultimele 30 de zile</option>
          <option value="7d">Ultimele 7 zile</option>
          <option value="today">Astăzi</option>
          <option value="all" selected>Tot istoricul</option>
        </select>
        <select id="fStatus" class="btn">
          <option value="all">Toate</option>
          <option value="pending">Active</option>
          <option value="settled">Finalizate</option>
          <option value="won">Câștigate</option>
          <option value="lost">Pierdute</option>
          <option value="void">Anulate</option>
          <option value="half_won">Jumătate câștigate</option>
          <option value="half_lost">Jumătate pierdute</option>
        </select>
        <input id="fQ" class="btn" placeholder="Căutare...">
        <?php if ($isAdmin): ?>
          <button id="btnAdd" class="btn bg-white text-slate-900 font-semibold"><i class="fa-solid fa-plus"></i> Adaugă bet</button>
        <?php endif; ?>
      </div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-6 space-y-4">
    <div id="sum" class="card p-4">
      <div class="text-sm text-slate-400">Profit total net (bancă, după comision) — pentru filtrul curent:</div>
      <div id="sumVal" class="text-2xl font-extrabold mt-1">—</div>
    </div>
    <div id="list" class="space-y-3"></div>
  </main>

  <?php if ($isAdmin): ?>
  <!-- Modal Adaugă -->
  <dialog id="dlg" class="card p-0 w-full max-w-2xl">
    <form id="formAdd" class="p-5 space-y-3">
      <h3 class="text-lg font-semibold mb-2">Adaugă bet</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><div class="text-sm text-slate-400">Group UID</div><input class="btn w-full" name="group_uid" placeholder="ex: BG-2025-001"></div>
        <div><div class="text-sm text-slate-400">Eveniment</div><input class="btn w-full" name="event" required></div>
        <div><div class="text-sm text-slate-400">Sport</div><input class="btn w-full" name="sport"></div>
        <div><div class="text-sm text-slate-400">Ligă</div><input class="btn w-full" name="league"></div>
        <div><div class="text-sm text-slate-400">Selecție</div><input class="btn w-full" name="selection"></div>
        <div><div class="text-sm text-slate-400">Cotă</div><input class="btn w-full" name="odds" type="number" step="0.01" min="1.01" required></div>
        <div><div class="text-sm text-slate-400">Miză (€)</div><input class="btn w-full" name="stake_eur" type="number" step="0.01" min="0.5" required></div>
        <div><div class="text-sm text-slate-400">Monedă</div><input class="btn w-full" name="currency" value="eur"></div>
        <div class="sm:col-span-2"><div class="text-sm text-slate-400">Data/Ora eveniment (YYYY-MM-DD HH:MM)</div><input class="btn w-full" name="event_at" placeholder="2025-10-20 20:45" required></div>
        <div class="sm:col-span-2"><div class="text-sm text-slate-400">Note</div><textarea class="btn w-full" name="notes" rows="3"></textarea></div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" id="btnCancel" class="btn">Anulează</button>
        <button class="btn bg-white text-slate-900 font-semibold">Salvează</button>
      </div>
      <div id="errAdd" class="text-rose-300 text-sm hidden mt-2">Eroare la salvare.</div>
    </form>
  </dialog>
  <?php endif; ?>

  <script>
    const isAdmin = <?= $isAdmin?'true':'false' ?>;

    function fmtEUR(x){ return new Intl.NumberFormat('ro-RO',{style:'currency',currency:'EUR'}).format(x); }
    function statusBadge(s){
      const cls = s==='pending'?'status-pending':(s==='won'?'status-won':(s==='lost'?'status-lost':'status-void'));
      const label = {pending:'În desfășurare',won:'Câștigat',lost:'Pierdut',void:'Anulat',half_won:'1/2 Câștigat',half_lost:'1/2 Pierdut'}[s] || s;
      return `<span class="badge ${cls}">${label}</span>`;
    }

    async function loadList(){
      const range=document.getElementById('fRange').value;
      const st=document.getElementById('fStatus').value;
      const q=document.getElementById('fQ').value.trim();
      const url = new URL('/api/bets/list.php', location.origin);
      url.searchParams.set('range', range);
      url.searchParams.set('status', st);
      if(q) url.searchParams.set('q', q);
      const res = await fetch(url, {credentials:'include'});
      const j = await res.json();
      const box = document.getElementById('list'); box.innerHTML='';
      let sum = 0;
      if(j && j.ok){
        j.items.forEach(it=>{
          if(typeof it.profit_net_eur === 'number') sum += it.profit_net_eur;
          const bar = document.createElement('div');
          bar.className='card p-4';
          bar.innerHTML = `
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div class="text-slate-300 font-semibold">${it.event}</div>
                <div class="text-xs text-slate-400">${it.sport||'-'} • ${it.league||'-'} • ${new Date(it.event_at.replace(' ','T')).toLocaleString('ro-RO')}</div>
                <div class="text-sm mt-1">Selecție: <span class="font-semibold">${it.selection||'-'}</span> @ ${it.odds} • Miză: <span class="font-semibold">${fmtEUR(it.stake_eur)}</span></div>
              </div>
              <div class="flex items-center gap-2">
                ${statusBadge(it.status)}
                ${it.score ? `<span class="badge">${it.score}</span>`:''}
                ${typeof it.profit_net_eur==='number' ? `<span class="badge ${it.profit_net_eur>=0?'status-won':'status-lost'}">${fmtEUR(it.profit_net_eur)}</span>`:''}
                ${isAdmin ? adminControls(it) : ''}
              </div>
            </div>
            ${it.notes ? `<div class="text-xs text-slate-400 mt-2">${it.notes}</div>`:''}
          `;
          box.appendChild(bar);
        });
      }
      document.getElementById('sumVal').textContent = fmtEUR(sum);
    }

    function adminControls(it){
      return `
        <select data-id="${it.id}" class="btn __st">
          <option value="pending" ${it.status==='pending'?'selected':''}>În desfășurare</option>
          <option value="won" ${it.status==='won'?'selected':''}>Câștigat</option>
          <option value="lost" ${it.status==='lost'?'selected':''}>Pierdut</option>
          <option value="void" ${it.status==='void'?'selected':''}>Anulat</option>
          <option value="half_won" ${it.status==='half_won'?'selected':''}>1/2 Câștigat</option>
          <option value="half_lost" ${it.status==='half_lost'?'selected':''}>1/2 Pierdut</option>
        </select>
        <input class="btn __score" data-id="${it.id}" placeholder="Scor (opțional)" value="${it.score||''}">
        <button class="btn __apply" data-id="${it.id}">Aplică</button>
      `;
    }

    document.getElementById('fRange').addEventListener('change', loadList);
    document.getElementById('fStatus').addEventListener('change', loadList);
    document.getElementById('fQ').addEventListener('input', ()=>{clearTimeout(window.__t);window.__t=setTimeout(loadList,300);});

    document.addEventListener('click', async (e)=>{
      if(e.target.matches('.__apply')){
        const id = e.target.getAttribute('data-id');
        const sel = document.querySelector(`select.__st[data-id="${id}"]`).value;
        const sc  = document.querySelector(`input.__score[data-id="${id}"]`).value.trim();
        const res = await fetch('/api/bets/update_status.php', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({bet_group_id:+id,status:sel,score:sc})});
        if(res.ok){ loadList(); } else { alert('Eroare la actualizare.'); }
      }
    });

    // Add modal
    <?php if ($isAdmin): ?>
    const dlg = document.getElementById('dlg');
    const btnAdd = document.getElementById('btnAdd');
    btnAdd?.addEventListener('click', ()=>dlg.showModal());
    document.getElementById('btnCancel')?.addEventListener('click', ()=>dlg.close());
    document.getElementById('formAdd')?.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const fd = new FormData(ev.currentTarget);
      const payload = Object.fromEntries(fd.entries());
      payload.odds = parseFloat(payload.odds||'0');
      payload.stake_eur = parseFloat(payload.stake_eur||'0');
      const res = await fetch('/api/bets/create.php', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      if(res.ok){ dlg.close(); ev.currentTarget.reset(); loadList(); } else { document.getElementById('errAdd').classList.remove('hidden'); }
    });
    <?php endif; ?>

    loadList();
  </script>
</body>
</html>
