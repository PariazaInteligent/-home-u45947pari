<?php
// /v1/bets.php — Jurnal transparent al operațiunilor de pariere
session_start();
$me = $_SESSION['user'] ?? null;
if (!$me) { header('Location: /v1/login.html'); exit; }
$role = strtoupper($me['role'] ?? 'USER');
function e($s){ return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
?>
<!DOCTYPE html>
<html lang="ro" data-theme="dark">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Jurnal Pariuri — Pariază Inteligent</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <style>
    html{ -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }
    .card{ border:1px solid rgba(255,255,255,.08); background:rgba(15,23,42,.6); border-radius:1rem; }
    .badge{ font-size:.7rem; padding:.15rem .5rem; border-radius:.5rem; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.05); }
    .confetti{ position:fixed; inset:0; pointer-events:none; }
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100" data-role="<?=e($role)?>">
  <header class="sticky top-0 z-40 bg-slate-950/70 backdrop-blur border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/v1/acasa.html" class="flex items-center gap-3">
        <span class="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center text-slate-900 font-extrabold">PI</span>
        <div>
          <div class="font-semibold">Pariază Inteligent</div>
          <div class="text-xs text-slate-400 -mt-0.5">Jurnal Pariuri</div>
        </div>
      </a>
      <nav class="flex items-center gap-3 text-sm">
        <a class="hover:text-white" href="/v1/dashboard-investitor.php">Panoul meu</a>
        <a class="hover:text-white" href="/v1/investitii.php">Investiții</a>
        <?php if($role==='ADMIN'): ?>
          <button id="btnNew" class="rounded-xl px-3 py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-semibold"><i class="fa-solid fa-plus"></i> Adaugă bet</button>
        <?php endif; ?>
      </nav>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-6">
    <!-- Filtre -->
    <section class="card p-4 mb-6">
      <div class="flex flex-col md:flex-row md:items-end gap-3">
        <div>
          <label class="text-sm text-slate-400">Perioadă</label>
          <select id="fRange" class="mt-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm">
            <option value="today">Astăzi</option>
            <option value="24h">Ultimele 24h</option>
            <option value="7d">Ultimele 7 zile</option>
            <option value="30d" selected>Ultimele 30 zile</option>
            <option value="mtd">Luna curentă</option>
            <option value="qtd">Trimestrul curent</option>
            <option value="ytd">Anul curent</option>
            <option value="all">Tot istoricul</option>
            <option value="custom">Personalizat</option>
          </select>
        </div>
        <div id="customRange" class="hidden flex gap-2">
          <div><label class="text-sm text-slate-400">De la</label><input id="fFrom" type="date" class="mt-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"/></div>
          <div><label class="text-sm text-slate-400">Până la</label><input id="fTo" type="date" class="mt-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"/></div>
        </div>
        <div class="flex-1">
          <label class="text-sm text-slate-400">Căutare</label>
          <input id="fQ" type="text" placeholder="Eveniment / selecție / ligă / status…" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"/>
        </div>
        <div>
          <label class="text-sm text-slate-400">Status</label>
          <select id="fStatus" class="mt-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm">
            <option value="ALL" selected>Toate</option>
            <option value="ACTIVE">Active</option>
            <option value="FINAL">Finalizate</option>
            <option value="PENDING">În Așteptare</option>
            <option value="WON">Câștigat</option>
            <option value="LOST">Pierdut</option>
            <option value="VOID">Anulat (Void)</option>
            <option value="HALF_WON">Jumătate Câștigat</option>
            <option value="HALF_LOST">Jumătate Pierdut</option>
          </select>
        </div>
        <div>
          <label class="text-sm text-slate-400">Sortare</label>
          <select id="fSort" class="mt-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm">
            <option value="event_at_desc">Cele mai noi</option>
            <option value="event_at_asc">Cele mai vechi</option>
            <option value="stake_desc">Miză ↓</option>
            <option value="stake_asc">Miză ↑</option>
            <option value="profit_desc">Profit ↓</option>
            <option value="profit_asc">Profit ↑</option>
          </select>
        </div>
        <div><button id="btnApply" class="mt-6 rounded-xl px-3 py-2 border border-white/10 hover:border-white/20 text-sm"><i class="fa-solid fa-filter"></i> Aplică</button></div>
      </div>
    </section>

    <!-- Sumar performanță -->
    <section class="card p-4 mb-6" id="sumCard">
      <div class="flex flex-wrap items-center gap-4">
        <div class="text-sm text-slate-400">Profit total net (bancă, toate grupurile filtrate):</div>
        <div id="sumNet" class="text-xl font-extrabold">—</div>
        <div class="badge" id="sumInfo">—</div>
      </div>
    </section>

    <!-- Lista grupuri -->
    <section id="list" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></section>
  </main>

  <!-- Modal nou bet (ADMIN) -->
  <?php if($role==='ADMIN'): ?>
  <dialog id="dlg" class="rounded-2xl p-0 w-[98%] max-w-2xl bg-slate-900 text-slate-100 border border-white/10">
    <form id="frm" class="p-5 space-y-3">
      <h3 class="text-lg font-semibold">Adaugă bet value</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label>Group UID<input name="group_uid" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" placeholder="BG-2025-001" required></label>
        <label>Eveniment<input name="event_name" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" required></label>
        <label>Sport<input name="sport" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"></label>
        <label>Ligă<input name="league" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"></label>
        <label>Selecție<input name="selection" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" required></label>
        <label>Cotă<input name="odds_decimal" type="number" step="0.001" min="1.01" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" required></label>
        <label>Miză (€)<input name="stake_eur" type="number" step="0.01" min="0.01" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" required></label>
        <label>Monedă<input name="currency" value="eur" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"></label>
        <label>Data/Ora eveniment<input name="event_at" type="datetime-local" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm" required></label>
      </div>
      <label>Notițe<textarea name="notes" rows="2" class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"></textarea></label>
      <div>
        <div class="text-sm text-slate-300 mb-1">Alocări (email: procent, câte una pe linie)</div>
        <textarea id="txtAlloc" rows="4" class="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
placeholder="investor1@site.ro: 30
investor2@site.ro: 70"></textarea>
        <div class="text-xs text-slate-400 mt-1">Totalul ar trebui să fie 100%.</div>
      </div>
      <div class="flex items-center justify-end gap-2 pt-2">
        <button type="button" id="btnCancel" class="rounded-xl px-3 py-2 border border-white/10 hover:border-white/20 text-sm">Anulează</button>
        <button class="rounded-xl px-3 py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 text-sm font-semibold">Salvează</button>
      </div>
    </form>
  </dialog>
  <?php endif; ?>

  <canvas class="confetti" id="confetti"></canvas>

  <script>
    const ROLE = (document.body.dataset.role||'USER').toUpperCase();

    // UI filtre
    const fRange = document.getElementById('fRange');
    const custom = document.getElementById('customRange');
    fRange.addEventListener('change', ()=>{ custom.classList.toggle('hidden', fRange.value!=='custom'); });

    document.getElementById('btnApply').addEventListener('click', loadList);
    document.addEventListener('DOMContentLoaded', loadList);

    async function loadList(){
      const q = document.getElementById('fQ').value.trim();
      const st = document.getElementById('fStatus').value;
      const sort = document.getElementById('fSort').value;
      const range = fRange.value;
      const from = document.getElementById('fFrom')?.value || '';
      const to   = document.getElementById('fTo')?.value || '';

      const url = new URL('/api/bets/list.php', location.origin);
      url.searchParams.set('q', q);
      url.searchParams.set('status', st);
      url.searchParams.set('sort', sort);
      url.searchParams.set('range', range);
      if(range==='custom'){ if(from) url.searchParams.set('from', from); if(to) url.searchParams.set('to', to); }

      const res = await fetch(url.toString(), { credentials:'include' });
      const j = await res.json().catch(()=>null);
      renderList(j);
    }

    function eur(c){ return new Intl.NumberFormat('ro-RO',{style:'currency',currency:'EUR'}).format((c||0)/100); }

    function renderList(j){
      const list = document.getElementById('list');
      list.innerHTML = '';
      if(!j || !j.ok){ list.innerHTML = `<div class="text-slate-400">Eroare la încărcare.</div>`; return; }

      // sumar
      const s = j.summary||{};
      const net = s.net_total_cents||0;
      const sumNet = document.getElementById('sumNet');
      sumNet.textContent = eur(net);
      const card = document.getElementById('sumCard');
      card.style.borderColor = net>0 ? 'rgba(16,185,129,.4)' : net<0 ? 'rgba(244,63,94,.4)' : 'rgba(255,255,255,.08)';
      card.style.background = net>0 ? 'rgba(6,95,70,.25)' : net<0 ? 'rgba(127,29,29,.25)' : 'rgba(15,23,42,.6)';
      document.getElementById('sumInfo').textContent = `${s.finalized||0} finalizate • ${s.pending||0} în așteptare • ${s.total_groups||0} grupuri`;

      // items
      j.items.forEach(it=>{
        const el = document.createElement('div');
        el.className = 'card p-4';
        const liveBadge = it.status==='PENDING' ? (it.status_human.includes('LIVE') ? '<span class="badge text-cyan-200">LIVE</span>' : `<span class="badge">${it.status_human}</span>`) : `<span class="badge">${it.status_human}</span>`;
        const res = it.result_cents??null;
        const resHTML = res===null? '—' : (res>0? `<span class="text-emerald-300">+${eur(res)}</span>` : res<0? `<span class="text-rose-300">${eur(res)}</span>` : eur(0));

        el.innerHTML = `
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-xs text-slate-400">${it.group_uid} • ${it.sport||''} ${it.league?('• '+it.league):''}</div>
              <div class="text-lg font-semibold">${it.event_name}</div>
              <div class="text-sm text-slate-300">${it.selection} @ ${it.odds_decimal.toFixed(2)} • Miză ${eur(it.stake_cents)}</div>
              <div class="text-xs text-slate-400">${new Date(it.event_at.replace(' ','T')).toLocaleString()}</div>
            </div>
            <div class="text-right space-y-1">
              ${liveBadge}
              <div class="text-sm">Rezultat: <span class="font-semibold">${resHTML}</span></div>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <div class="text-xs text-slate-400">Alocări: ${ (it.allocations||[]).map(a=>`${a.email||('u#'+a.user_id)} ${ (a.share_bps/100).toFixed(2)}%`).join(', ') || '—' }</div>
            ${ROLE==='ADMIN'
              ? `<div class="flex items-center gap-2">
                   <select class="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm __sel">
                     <option value="">Schimbă status…</option>
                     <option value="WON">Câștigat</option>
                     <option value="LOST">Pierdut</option>
                     <option value="VOID">Anulat (Void)</option>
                     <option value="HALF_WON">Jumătate Câștigat</option>
                     <option value="HALF_LOST">Jumătate Pierdut</option>
                   </select>
                   <input class="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm __score" placeholder="Scor (ex: 2-1)" style="width:7rem"/>
                   <button class="rounded-lg px-2 py-1 border border-white/10 hover:border-white/20 text-sm __apply">Aplică</button>
                 </div>`
              : ''
            }
          </div>
        `;

        // admin actions
        if(ROLE==='ADMIN'){
          const sel = el.querySelector('.__sel');
          const sc  = el.querySelector('.__score');
          const btn = el.querySelector('.__apply');
          btn.addEventListener('click', async ()=>{
            const st = sel.value;
            if(!st) return;
            btn.disabled=true; btn.textContent='...';
            try{
              const res = await fetch('/api/bets/update_status.php', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ group_id: it.id, status: st, score: sc.value||'' }),
                credentials:'include'
              });
              const j = await res.json();
              if(j && j.ok){
                if(st==='WON' || st==='HALF_WON') confetti();
                loadList();
              } else { alert('Eroare: ' + (j?.error||'unknown')); }
            }catch(e){ alert('Eroare rețea'); }
            finally{ btn.disabled=false; btn.textContent='Aplică'; }
          });
        }

        list.appendChild(el);
      });
    }

    // confetti simplu
    function confetti(){
      const c = document.getElementById('confetti'); const ctx = c.getContext('2d');
      c.width = innerWidth; c.height = innerHeight;
      const pieces = Array.from({length:120}, ()=>({
        x: Math.random()*c.width, y: -10, s: 4+Math.random()*6, vy: 2+Math.random()*3, vx: -2+Math.random()*4, a: Math.random()*Math.PI
      }));
      let t = 0;
      function tick(){
        ctx.clearRect(0,0,c.width,c.height);
        pieces.forEach(p=>{
          p.a += .1; p.x += p.vx; p.y += p.vy;
          ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a);
          ctx.fillStyle = `hsl(${Math.floor(Math.random()*360)},85%,65%)`;
          ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s);
          ctx.restore();
        });
        t++; if (t<120) requestAnimationFrame(tick); else ctx.clearRect(0,0,c.width,c.height);
      }
      tick();
    }

    // Modal nou bet (ADMIN)
    <?php if($role==='ADMIN'): ?>
    const dlg = document.getElementById('dlg');
    const btnNew = document.getElementById('btnNew');
    const btnCancel = document.getElementById('btnCancel');
    btnNew?.addEventListener('click', ()=> dlg.showModal());
    btnCancel?.addEventListener('click', ()=> dlg.close());

    document.getElementById('frm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const allocText = document.getElementById('txtAlloc').value.trim();
      const allocations = [];
      allocText.split('\n').forEach(line=>{
        const m = line.split(':');
        if(m.length>=2){
          const email = m[0].trim();
          const pct = parseFloat(m[1].replace('%','').trim());
          if(email && pct>0) allocations.push({ email, share_pct: pct });
        }
      });

      const payload = Object.fromEntries(fd.entries());
      payload.odds_decimal = parseFloat(payload.odds_decimal);
      payload.stake_eur = parseFloat(payload.stake_eur);
      payload.allocations = allocations;

      const r = await fetch('/api/bets/create.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), credentials:'include' });
      const j = await r.json().catch(()=>null);
      if(j && j.ok){ dlg.close(); loadList(); } else { alert('Eroare la creare: ' + (j?.message||j?.error||'unknown')); }
    });
    <?php endif; ?>
  </script>
</body>
</html>
