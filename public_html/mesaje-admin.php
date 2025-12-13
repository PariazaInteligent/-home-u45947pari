<?php
// mesaje-admin.php
require __DIR__.'/require_admin.php'; // 403 dacă nu e admin
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }
$adminName = htmlspecialchars($_SESSION['user']['nume'] ?? 'Admin');
?>
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Administrare Mesaje | Pariază Inteligent</title>
<link rel="icon" href="/favicon.ico" />
<style>
  /* ====== Tema globală ====== */
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{
    font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color:#eaf7ff;
    background:linear-gradient(135deg,#0a0e27 0%, #1a1f3a 50%, #0f1829 100%);
    overflow-x:hidden; position:relative; min-height:100vh;
    color-scheme: dark;
  }
  .particles{position:fixed;inset:0;z-index:0;pointer-events:none}
  .particle{position:absolute;border-radius:50%;will-change:transform}

  /* ====== Secțiune fluidă ====== */
  .wrap{
    position:relative;z-index:1; min-height:100vh;
    display:flex; flex-direction:column; gap:16px;
    padding:54px 18px 36px;
    max-width:1200px; margin:0 auto;
  }
  .brand{
    text-align:center;font-weight:800;
    font-size:clamp(22px,3vw,30px);
    background:linear-gradient(135deg,#00ff9d,#00b8ff);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
    filter:drop-shadow(0 0 14px rgba(0,255,157,.22));
  }
  .subtitle{opacity:.92;text-align:center;margin-top:6px;margin-bottom:8px;color:#cfe8ff}

  /* ====== Toolbar ====== */
  .toolbar{
    display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:center;
    margin-top:8px;
  }
  .seg{
    background:rgba(255,255,255,.08);
    border:1px solid rgba(0,255,157,.18); border-radius:12px;
    padding:6px; display:flex; gap:6px;
  }
  .seg button{
    appearance:none;border:0;border-radius:10px;cursor:pointer;
    font-weight:800; padding:8px 12px; font-size:.95rem;
    background:transparent; color:#9fefff;
    transition:transform .18s ease, filter .18s ease, background .18s ease, color .18s ease;
  }
  .seg button:hover{ transform:translateY(-1px); filter:brightness(1.05) }
  .seg button.active{
    background:linear-gradient(135deg,#00ff9d,#00b8ff);
    color:#0a0e27; box-shadow:0 8px 18px rgba(0,255,157,.25);
  }
  .search{
    display:flex;gap:8px;align-items:center;
    background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18);
    border-radius:12px; padding:6px 8px; min-width:260px;
  }
  .search input{
    background:transparent;border:0;outline:none;color:#eaf7ff;width:220px;
  }

  /* ===== Butoane ===== */
  .btn{
    appearance:none;border:0;border-radius:10px;cursor:pointer;font-weight:700;
    background:linear-gradient(135deg,#00ff9d,#00b8ff);color:#0a0e27;
    box-shadow:0 6px 18px rgba(0,255,157,.25);
    padding:9px 12px;font-size:.95rem; transition:transform .2s ease, filter .2s ease;
    text-decoration:none; display:inline-block;
  }
  .btn:hover{ transform:translateY(-1px); filter:brightness(1.04) }
  .btn.ghost{
    background:transparent; color:#9fefff; border:1px solid rgba(0,255,157,.18);
    box-shadow:none;
  }
  .btn.warn{ background:linear-gradient(135deg,#ff8a6b,#ffc14b); color:#07201a }

  /* ====== Listă ====== */
  .list{
    display:grid; gap:14px; grid-template-columns:1fr;
    margin-top:8px;
  }
  @media (min-width:860px){ .list{ grid-template-columns:1fr 1fr } }
  .card{
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);
    border-radius:16px; padding:14px 14px 12px;
    display:flex;flex-direction:column;gap:6px;
    transition:transform .18s, box-shadow .18s, border-color .18s, background .18s;
  }
  .card:hover{ transform:translateY(-2px); border-color:rgba(0,255,157,.28); box-shadow:0 10px 24px rgba(0,0,0,.28); background:rgba(255,255,255,.075) }
  .card.important{ border-left:4px solid #ffd84a; background:rgba(255,216,74,.06) }
  .card .title{font-weight:800;color:#26ffd9}
  .card .title.badge-imp{color:#ffd84a}
  .muted{font-size:.92rem;color:#9bdfff;opacity:.82}
  .content{color:#eafaff;white-space:pre-wrap}
  .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .badge{
    font-size:.8rem; padding:4px 8px; border-radius:8px;
    background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18);
  }
  .badge.live{ background:rgba(0,255,157,.14); border-color:rgba(0,255,157,.3); color:#00ffb0 }
  .badge.draft{ background:rgba(255,255,255,.08); color:#cfe8ff }

  /* ====== Formular ====== */
  .panel{
    margin-top:16px; background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:16px;
    display:none; opacity:0; transform:translateY(10px);
    transition:opacity .25s ease, transform .25s ease;
  }
  .panel.show{ display:block; opacity:1; transform:translateY(0) }
  .panel h3{
    font-size:1.1rem; margin-bottom:8px; font-weight:800;
    background:linear-gradient(135deg,#00ff9d,#00b8ff);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  }
  .grid{display:grid; gap:12px; grid-template-columns:1fr}
  @media (min-width:860px){ .grid{grid-template-columns:1fr 1fr} .span-2{grid-column:1/-1} }
  label{display:block; font-size:.95rem; opacity:.9; margin-bottom:6px}
  input[type="text"], textarea, select{
    width:100%; padding:11px 12px; border-radius:10px;
    border:1px solid rgba(255,255,255,.25);
    background:#0f1829; color:#cfe8ff; outline:none;
    transition:border .25s, background .25s; font-size:15px;
  }
  textarea{ min-height:120px; resize:vertical }
  input:focus, textarea:focus, select:focus{
    border-color:rgba(0,255,157,.45); background:#101b31; box-shadow:0 0 0 3px rgba(0,255,157,.12);
  }
  select option, select optgroup{ background:#0b1426; color:#cfe8ff }
  .hint{font-size:.85rem; color:#9bdfff; opacity:.9}

  /* ====== Paginare & Toast ====== */
  .pager{display:flex;gap:10px;justify-content:center;align-items:center;margin:6px 0}
  .pager .info{opacity:.85}
  .toast{position:fixed;right:16px;bottom:16px;background:#132034; color:#cfe8ff;border:1px solid rgba(0,255,157,.25); padding:10px 12px;border-radius:10px;box-shadow:0 10px 24px rgba(0,0,0,.35); z-index:20000; display:none}

  /* ==== User picker ==== */
  .picker{
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    background: rgba(255,255,255,.08);
    border:1px solid rgba(255,255,255,.18);
    border-radius: 12px;
    padding: 8px;
    z-index: 1000;
  }
  .picker .chips{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .picker .chip{
    display:flex; align-items:center; gap:6px;
    padding:6px 10px; border-radius:999px;
    background:rgba(0,255,157,.14);
    border:1px solid rgba(0,255,157,.3);
    color:#aef7ff; font-size:.92rem;
  }
  .picker .chip button{
    appearance:none; border:0; background:transparent; color:#eaf7ff; cursor:pointer; font-size:14px;
  }
  #pickerInput{
    flex:1; min-width:180px;
    background:transparent; border:0; outline:none; color:#fff; font-size:15px; padding:6px 4px;
  }
  #pickerDropdown{
    position:absolute; left:8px; right:8px; top:100%;
    margin-top:6px; background:#132034; border:1px solid rgba(0,255,157,.25);
    border-radius:12px; box-shadow:0 10px 24px rgba(0,0,0,.35); z-index: 15000;
    max-height:260px; overflow:auto; display:none;
  }
  .suggest-item{
    padding:10px 12px; cursor:pointer; display:flex; flex-direction:column; gap:2px;
    border-bottom:1px solid rgba(255,255,255,.06);
  }
  .suggest-item:last-child{border-bottom:0}
  .suggest-item:hover{ background:rgba(255,255,255,.06) }
  .suggest-item .name{ color:#9ff; font-weight:700 }
  .suggest-item .sub{ color:#bfe; opacity:.85; font-size:.9rem }
</style>
</head>
<body>
<div class="particles" id="particles"></div>

<div class="wrap">
  <h1 class="brand">PARIAZĂ INTELIGENT</h1>
  <p class="subtitle">Panou administrare mesaje — salut, <strong><?= $adminName ?></strong></p>

  <!-- Toolbar -->
  <div class="toolbar">
    <!-- BUTON ÎNAPOI LA DASHBOARD -->
    <a href="/layout.html#dashboard.php"
       id="backBtn"
       class="btn ghost"
       title="Înapoi la Dashboard"
       aria-label="Înapoi la Dashboard">‹ Înapoi la Dashboard</a>

    <div class="seg" id="tabSeg">
      <button data-tab="anunturi" class="active">Anunțuri</button>
      <button data-tab="personale">Personale</button>
    </div>

    <div class="seg">
      <button id="btnRefresh" title="Reîncarcă">Reîncarcă</button>
      <button id="btnNew" class="active" title="Adaugă mesaj">+ Mesaj nou</button>
    </div>

    <div class="search">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#9fefff"><path d="M21 20l-5.7-5.7a7 7 0 10-1.3 1.3L20 21zM4 10a6 6 0 1112 0A6 6 0 014 10z"/></svg>
      <input id="q" placeholder="Caută în titlu/conținut (opțional)" />
      <button class="btn ghost" id="btnSearch">Caută</button>
    </div>
  </div>

  <!-- Listă -->
  <div class="list" id="list"></div>
  <div class="pager">
    <button class="btn ghost" id="prev">◀︎</button>
    <div class="info" id="pageInfo">Pagina 1</div>
    <button class="btn ghost" id="next">▶︎</button>
  </div>

  <!-- Formular create / update -->
  <div class="panel" id="createPanel" aria-hidden="true">
    <h3 id="formTitle">Adaugă mesaj</h3>
    <form id="msgForm" autocomplete="off">
      <input type="hidden" id="msgId" />
      <div class="grid">
        <div>
          <label for="tip">Tip</label>
          <select id="tip">
            <option value="anunt">Anunț (public)</option>
            <option value="personal">Personal (către anumiți utilizatori)</option>
          </select>
        </div>
        <div>
          <label for="important">Important</label>
          <select id="important">
            <option value="0">Nu</option>
            <option value="1">Da</option>
          </select>
        </div>

        <div class="span-2">
          <label for="titlu">Titlu</label>
          <input type="text" id="titlu" required />
        </div>

        <div class="span-2">
          <label for="continut">Conținut</label>
          <textarea id="continut" required></textarea>
        </div>

        <div class="span-2" id="targetsWrap" style="display:none">
          <label>Destinatari</label>
          <div id="userPicker" class="picker">
            <div class="chips" id="pickerChips"></div>
            <input type="text" id="pickerInput" placeholder="Caută după nume sau email..." autocomplete="off" />
            <div class="dropdown" id="pickerDropdown"></div>
          </div>
          <input type="hidden" id="targets" />
          <div class="hint">Tastează pentru a căuta. Click pe un rezultat pentru a-l adăuga. Poți selecta mai mulți.</div>
        </div>

        <div class="row span-2" style="gap:8px;margin-top:4px">
          <button type="submit" class="btn" id="saveBtn">Salvează</button>
          <button type="button" class="btn ghost" id="resetBtn">Reset</button>
          <button type="button" class="btn ghost" id="closePanelBtn">Închide</button>
        </div>
      </div>
    </form>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
/* ===== Particule ===== */
(function(){
  const box=document.getElementById('particles'); if(!box) return;
  const COUNT=80, minDur=8, maxDur=16;
  let css=''; const frag=document.createDocumentFragment();
  for(let i=0;i<COUNT;i++){
    const p=document.createElement('div'); p.className='particle';
    const size=(Math.random()*3+2).toFixed(1);
    p.style.width=size+'px'; p.style.height=size+'px';
    p.style.left=(Math.random()*100)+'%'; p.style.top=(Math.random()*100)+'%';
    p.style.background= Math.random()<.5 ? 'rgba(0,255,157,.28)' : 'rgba(0,184,255,.28)';
    const delay=(Math.random()*6).toFixed(2)+'s';
    const dur=(Math.random()*(maxDur-minDur)+minDur).toFixed(2)+'s';
    const kf='float-'+i;
    const dx1=(Math.random()*140-70)|0, dy1=(Math.random()*140-70)|0;
    const dx2=(Math.random()*140-70)|0, dy2=(Math.random()*140-70)|0;
    const dx3=(Math.random()*140-70)|0, dy3=(Math.random()*140-70)|0;
    css+=`@keyframes ${kf}{0%,100%{transform:translate(0,0);opacity:.75}
           25%{transform:translate(${dx1}px,${dy1}px);opacity:.9}
           50%{transform:translate(${dx2}px,${dy2}px);opacity:.85}
           75%{transform:translate(${dx3}px,${dy3}px);opacity:.9}}`;
    p.style.animation=`${kf} ${dur} ease-in-out infinite`; p.style.animationDelay=delay;
    frag.appendChild(p);
  }
  box.appendChild(frag); const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
})();

/* ===== Helpers ===== */
const $  = (sel, root=document)=> root.querySelector(sel);
const $$ = (sel, root=document)=> [...root.querySelectorAll(sel)];
const API = '/api';
let state = { tab:'anunturi', page:1, per_page:10, q:'' };

function toast(msg, ok=true){
  const t = $('#toast');
  t.textContent = msg;
  t.style.borderColor = ok ? 'rgba(0,255,157,.35)' : 'rgba(255,120,120,.35)';
  t.style.display = 'block';
  setTimeout(()=> t.style.display='none', 2600);
}

/* ===== Buton Înapoi — funcționează și din iframe (layout) ===== */
(function(){
  const back = document.getElementById('backBtn');
  if(!back) return;
  back.addEventListener('click', function(e){
    e.preventDefault();
    try{
      if (window.parent && window.parent !== window) {
        window.parent.location.hash = "dashboard.php";
      } else {
        location.href = "/layout.html#dashboard.php";
      }
    } catch(_){
      location.href = "/layout.html#dashboard.php";
    }
  });
})();

/* ===== Panel helpers (show/hide + scroll) ===== */
const panel = $('#createPanel');
const btnNew = $('#btnNew');
const closePanelBtn = $('#closePanelBtn');

function openPanel(titleText='Adaugă mesaj'){
  $('#formTitle').textContent = titleText;
  panel.classList.add('show');
  panel.setAttribute('aria-hidden','false');
  setTimeout(()=>{
    panel.scrollIntoView({behavior:'smooth', block:'end'});
    $('#titlu')?.focus();
  }, 30);
  btnNew.textContent = 'Anulează';
  btnNew.classList.remove('active');
}

function closePanel(){
  panel.classList.remove('show');
  panel.setAttribute('aria-hidden','true');
  btnNew.textContent = '+ Mesaj nou';
  btnNew.classList.add('active');
}

btnNew.addEventListener('click', ()=>{
  if (panel.classList.contains('show')) {
    closePanel();
  } else {
    $('#resetBtn').click();
    openPanel('Adaugă mesaj');
  }
});

closePanelBtn.addEventListener('click', closePanel);

// Închidere cu Esc
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape' && panel.classList.contains('show')) {
    closePanel();
  }
});

/* ===== Listare & paginare ===== */
async function loadList(){
  const list = $('#list'); list.innerHTML = '';
  $('#pageInfo').textContent = `Pagina ${state.page}`;
  const url = `${API}/messages_list.php?tab=${state.tab}&page=${state.page}&per_page=${state.per_page}` + (state.q ? `&q=${encodeURIComponent(state.q)}` : '');
  try{
    const res = await fetch(url, {credentials:'include'});
    if(!res.ok){ throw new Error(`HTTP ${res.status}`); }
    const data = await res.json();
    const items = data.data || [];
    if(items.length === 0){
      list.innerHTML = `<div class="card"><div class="title">Nimic de afișat</div><div class="muted">Nu există mesaje pe această pagină.</div></div>`;
      return;
    }
    items.forEach(it=>{
      const li = document.createElement('div');
      li.className = 'card' + (Number(it.important) ? ' important' : '');
      li.innerHTML = `
        <div class="row" style="justify-content:space-between">
          <div class="title ${Number(it.important)?'badge-imp':''}">${it.titlu || '(fără titlu)'}</div>
          <div class="row">
            <span class="badge ${Number(it.publicat)?'live':'draft'}">${Number(it.publicat)?'Publicat':'Ciornă'}</span>
            <span class="badge">#${it.id}</span>
          </div>
        </div>
        <div class="muted">${it.created_at || ''} · tip: ${it.tip}</div>
        <div class="content">${(it.continut||'').slice(0,400)}${(it.continut||'').length>400?'…':''}</div>
        ${it.tip === 'personal' ? `<div class="muted" id="recipients-${it.id}">Destinatari: <em>se încarcă…</em></div>` : ``}
        <div class="row" style="margin-top:6px">
          <button class="btn ghost" data-act="edit" data-id="${it.id}">Editează</button>
          <button class="btn ghost" data-act="toggle" data-id="${it.id}">${Number(it.publicat)?'Depublică':'Publică'}</button>
          <button class="btn warn" data-act="del" data-id="${it.id}">Șterge</button>
        </div>
      `;
      list.appendChild(li);

      if (it.tip === 'personal') fetchRecipients(it.id);
    });

    $$('.card [data-act]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const id = Number(btn.dataset.id);
        const act = btn.dataset.act;
        if(act==='edit'){ await loadIntoForm(id); }
        else if(act==='toggle'){ await apiToggle(id); }
        else if(act==='del'){ await apiDelete(id); }
      });
    });

  }catch(e){
    list.innerHTML = `<div class="card"><div class="title">Eroare</div><div class="muted">Nu s-a putut încărca lista.</div></div>`;
  }
}

/* ===== API actions ===== */
async function apiCreate(payload){
  const res = await fetch(`${API}/messages_create.php`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    credentials:'include', body: JSON.stringify(payload)
  });
  return res.json();
}
async function apiUpdate(payload){
  const res = await fetch(`${API}/messages_update.php`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    credentials:'include', body: JSON.stringify(payload)
  });
  return res.json();
}
async function apiDelete(id){
  if(!confirm('Sigur dorești să ștergi mesajul?')) return;
  const res = await fetch(`${API}/messages_delete.php`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    credentials:'include', body: JSON.stringify({id})
  });
  const j = await res.json();
  if(j.success){ toast('Șters.'); loadList(); }
  else toast(j.error || 'Eroare la ștergere', false);
}
async function apiToggle(id){
  const res = await fetch(`${API}/messages_toggle_publish.php`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    credentials:'include', body: JSON.stringify({id})
  });
  const j = await res.json();
  if(j.success){ toast('Status actualizat.'); loadList(); }
  else toast(j.error || 'Eroare la publicare', false);
}

/* ===== Destinatari pentru mesajele personale ===== */
const recipientsCache = new Map();

async function fetchRecipients(id){
  if (recipientsCache.has(id)) {
    renderRecipients(id, recipientsCache.get(id));
    return;
  }
  try{
    const r = await fetch(`${API}/messages_recipients.php?id=${id}`, {credentials:'include'});
    const j = await r.json();
    if (j && j.success) {
      const arr = j.data || [];
      recipientsCache.set(id, arr);
      renderRecipients(id, arr);
    } else {
      renderRecipients(id, null, j.error || 'Eroare încărcare destinatari');
    }
  }catch{
    renderRecipients(id, null, 'Eroare rețea destinatari');
  }
}

function renderRecipients(id, arr, err){
  const box = document.getElementById(`recipients-${id}`);
  if (!box) return;
  if (err) { box.innerHTML = `Destinatari: <span style="color:#ff9b9b">${err}</span>`; return; }
  if (!arr || arr.length === 0) { box.innerHTML = 'Destinatari: (niciunul)'; return; }
  const chips = arr.map(u=>`<span class="badge" title="${u.email}">${u.nume}</span>`).join(' ');
  box.innerHTML = `Destinatari: ${chips}`;
}

/* ===== Formular ===== */
const form = $('#msgForm');
const tipSel = $('#tip');
const impSel = $('#important');
const titlu = $('#titlu');
const continut = $('#continut');
const targetsWrap = $('#targetsWrap');
const targets = $('#targets');
const msgId = $('#msgId');
const formTitle = $('#formTitle');

tipSel.addEventListener('change', ()=>{
  targetsWrap.style.display = tipSel.value === 'personal' ? '' : 'none';
});

$('#resetBtn').addEventListener('click', ()=>{
  msgId.value=''; formTitle.textContent='Adaugă mesaj';
  form.reset(); tipSel.value='anunt'; impSel.value='0'; targetsWrap.style.display='none';
  picker.selected = []; pickerRenderChips(); picker.input.value=''; picker.hidden.value='';
});

async function loadIntoForm(id){
  const cardBtn = document.querySelector(`.card [data-act="edit"][data-id="${id}"]`);
  const card = cardBtn ? cardBtn.closest('.card') : null;

  msgId.value = id;
  formTitle.textContent = `Editează mesaj #${id}`;

  const title = card?.querySelector('.title')?.textContent?.trim() || '';
  const isImp = card?.classList.contains('important') ? '1' : '0';
  const body = card?.querySelector('.content')?.textContent || '';

  titlu.value = title;
  continut.value = body;
  impSel.value = isImp;

  const meta = card?.querySelector('.muted')?.textContent || '';
  const isPersonal = /tip:\s*personal/i.test(meta);
  tipSel.value = isPersonal ? 'personal' : 'anunt';
  targetsWrap.style.display = tipSel.value === 'personal' ? '' : 'none';

  if (isPersonal){
    try{
      const r = await fetch(`${API}/messages_recipients.php?id=${id}`, {credentials:'include'});
      const j = await r.json();
      picker.selected = (j.success ? (j.data || []) : []).map(u=>({id:Number(u.id), nume:u.nume, email:u.email}));
      pickerRenderChips();
    }catch{
      picker.selected = []; pickerRenderChips();
    }
  } else {
    picker.selected = []; pickerRenderChips();
  }

  if (!panel.classList.contains('show')) openPanel(`Editează mesaj #${id}`);
  else {
    setTimeout(()=> panel.scrollIntoView({behavior:'smooth', block:'end'}), 20);
  }
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();

  const payload = {
    tip: (tipSel.value || 'anunt').trim(),
    titlu: (titlu.value || '').trim(),
    continut: (continut.value || '').trim(),
    important: Number(impSel.value)||0
  };

  if(payload.tip === 'personal'){
    const arr = pickerGetIds();
    if(arr.length === 0){ toast("Pentru 'personal', alege cel puțin un destinatar.", false); return; }
    payload.targets = arr;
  }

  try{
    const id = Number(msgId.value||'0');
    let resp;
    if(id>0){
      payload.id = id;
      resp = await apiUpdate(payload);
    }else{
      resp = await apiCreate(payload);
    }
    if(resp.success){
      toast(id>0?'Salvat.':'Creat.');
      $('#resetBtn').click();
      closePanel();
      loadList();
    }else{
      toast(resp.error || 'Eroare la salvare', false);
    }
  }catch(err){
    toast('Eroare de rețea/server', false);
  }
});

/* ===== Evenimente UI ===== */
$('#tabSeg').addEventListener('click', (e)=>{
  const b = e.target.closest('button'); if(!b) return;
  $$('#tabSeg button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  state.tab = b.dataset.tab;
  state.page = 1;
  closePanel();
  $('#resetBtn').click();
  loadList();
});

$('#prev').addEventListener('click', ()=>{ if(state.page>1){ state.page--; loadList(); } });
$('#next').addEventListener('click', ()=>{ state.page++; loadList(); });
$('#btnRefresh').addEventListener('click', ()=> loadList());
$('#btnSearch').addEventListener('click', ()=>{
  state.q = ($('#q').value||'').trim();
  state.page = 1;
  loadList();
});

/* ===== User picker logic ===== */
const picker = {
  input:  document.getElementById('pickerInput'),
  chips:  document.getElementById('pickerChips'),
  dd:     document.getElementById('pickerDropdown'),
  hidden: document.getElementById('targets'),
  selected: [], // [{id, nume, email}]
  timer: null
};

function pickerRenderChips(){
  picker.chips.innerHTML = '';
  picker.selected.forEach(u=>{
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `<span>${u.nume}</span><button title="Elimină" aria-label="Elimină" data-id="${u.id}">×</button>`;
    chip.querySelector('button').onclick = ()=> pickerRemove(u.id);
    picker.chips.appendChild(chip);
  });
  picker.hidden.value = picker.selected.map(u=>u.id).join(',');
}

function pickerRemove(id){
  picker.selected = picker.selected.filter(u=>u.id!==id);
  pickerRenderChips();
}

function pickerAdd(u){
  if (!picker.selected.some(x=>x.id===u.id)){
    picker.selected.push(u);
    pickerRenderChips();
  }
  picker.dd.style.display = 'none';
  picker.input.value = '';
  picker.input.focus();
}

async function pickerSearch(q){
  if (!q || q.length < 1){ picker.dd.style.display='none'; picker.dd.innerHTML=''; return; }
  try{
    const url = `/api/users_search.php?q=${encodeURIComponent(q)}&limit=20`;
    const r = await fetch(url, {credentials:'include'});
    if(!r.ok){
      picker.dd.style.display='none';
      toast(`Căutare eșuată (${r.status}). Asigură-te că ești admin logat.`, false);
      return;
    }
    let j;
    try { j = await r.json(); }
    catch(e){
      picker.dd.style.display='none';
      toast('Răspuns invalid de la users_search.php (nu este JSON).', false);
      return;
    }
    const data = j.data || [];
    if (data.length === 0){ picker.dd.style.display='none'; picker.dd.innerHTML=''; return; }
    picker.dd.innerHTML = data.map(u => `
      <div class="suggest-item" data-id="${u.id}" data-name="${u.nume}" data-email="${u.email}">
        <span class="name">${u.nume}</span>
        <span class="sub">${u.email}</span>
      </div>
    `).join('');
    [...picker.dd.querySelectorAll('.suggest-item')].forEach(it=>{
      it.onclick = () => pickerAdd({
        id: Number(it.dataset.id),
        nume: it.dataset.name,
        email: it.dataset.email
      });
    });
    picker.dd.style.display = 'block';
  }catch(err){
    picker.dd.style.display = 'none';
    toast('Eroare de rețea la căutare destinatari.', false);
  }
}

/* events */
picker.input.addEventListener('input', ()=>{
  clearTimeout(picker.timer);
  const q = picker.input.value.trim();
  picker.timer = setTimeout(()=> pickerSearch(q), 220);
});
picker.input.addEventListener('keydown', (e)=>{
  if(e.key === 'Backspace' && picker.input.value === '' && picker.selected.length){
    pickerRemove(picker.selected[picker.selected.length-1].id);
  }
});
document.addEventListener('click', (e)=>{
  if (!e.target.closest('#userPicker')) picker.dd.style.display='none';
});

/* helper submit -> IDs array */
function pickerGetIds(){
  const raw = picker.hidden.value.trim();
  if (!raw) return [];
  return raw.split(',').map(s=>parseInt(s,10)).filter(n=>!isNaN(n));
}

/* ===== Init ===== */
loadList();
</script>
</body>
</html>
