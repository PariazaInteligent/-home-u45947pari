<?php
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }
$loggedIn = !empty($_SESSION['user']);
$userRole = $loggedIn ? ($_SESSION['user']['rol'] ?? 'utilizator') : null;

if (!$loggedIn) {
  ?>
  <!DOCTYPE html>
  <meta charset="utf-8">
  <script>
    if (window.parent && window.parent !== window) {
      window.parent.location.hash = "dashboard.php";
    } else {
      location.href = "/layout.html#dashboard.php";
    }
  </script>
  <?php exit;
}
?>
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Centru de Mesaje | Pariază Inteligent</title>
  <link href="https://fonts.googleapis.com/css?family=Montserrat:700,400&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%}
    body{font-family:'Montserrat',Arial,sans-serif;color:#eaf7ff;background:linear-gradient(135deg,#0a0e27,#1a1f3a 50%,#0f1829);overflow-x:hidden;position:relative;min-height:100vh;color-scheme:dark}
    .particles{position:fixed;inset:0;z-index:0;pointer-events:none}
    .particle{position:absolute;border-radius:50%;will-change:transform}
    .wrap{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:52px 18px 36px}
    .brand{text-align:center;margin-bottom:6px;font-weight:800;font-size:clamp(22px,3vw,30px);background:linear-gradient(135deg,#00ff9d,#00b8ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 14px rgba(0,255,157,.22))}
    .subtitle{opacity:.9;text-align:center;margin-bottom:20px;color:#cfe8ff;font-weight:400}
    .role-badge{display:inline-block;margin-top:6px;font-size:.9rem;color:#8fffe8;opacity:.85}
    #messagesSection{width:100%;max-width:1200px;background:transparent;border:none;box-shadow:none;animation:fadeIn .45s ease;visibility:visible !important;opacity:1 !important;}
    @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    .toolbar{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:0 0 14px 0;align-items:center}
    .input,.select,.btn{appearance:none;border:1px solid rgba(0,255,157,.18);background:rgba(255,255,255,.08);color:#bfefff;border-radius:10px;padding:10px 12px;font-weight:600;outline:none;transition:border .2s,background .2s,color .2s,transform .2s}
    .input:focus,.select:focus{border-color:rgba(0,255,157,.45);background:rgba(255,255,255,.10)}
    .btn{cursor:pointer;background:linear-gradient(135deg,#00ff9d,#00b8ff);color:#0a0e27;border:0;box-shadow:0 6px 18px rgba(0,255,157,.25);font-weight:800}
    .btn:hover{transform:translateY(-1px);filter:brightness(1.04)}
    .btn.secondary{background:rgba(255,255,255,.08);color:#bfefff;border:1px solid rgba(0,255,157,.18);box-shadow:none;font-weight:700}
    .select{background:#0f1829;color:#cfe8ff;border-color:rgba(0,255,157,.22)}
    .select:hover{background:#101b31}
    .select:focus{background:#101b31;box-shadow:0 0 0 3px rgba(0,255,157,.15)}
    .tabs{display:flex;gap:10px;margin:8px 0 16px 0;flex-wrap:wrap;justify-content:center}
    .tab-btn{appearance:none;border:0;border-radius:12px;cursor:pointer;font-weight:800;padding:10px 16px;font-size:1rem;background:rgba(255,255,255,.08);border:1px solid rgba(0,255,157,.18);color:#9fefff;transition:transform .2s,filter .2s,background .2s,color .2s,border-color .2s}
    .tab-btn:hover{transform:translateY(-2px);filter:brightness(1.05)}
    .tab-btn.active{background:linear-gradient(135deg,#00ff9d,#00b8ff);color:#0a0e27;border-color:transparent;box-shadow:0 8px 20px rgba(0,255,157,.28)}
    .msg-list{list-style:none;margin:0;padding:0;display:grid;gap:16px;grid-template-columns:1fr !important;}
    @media (min-width:860px){.msg-list{grid-template-columns:1fr 1fr !important;}}
    .msg-item{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:16px 16px 14px;transition:transform .18s,box-shadow .18s,border-color .18s,background .18s;display:flex !important;flex-direction:column;gap:8px}
    .msg-item:hover{transform:translateY(-2px);border-color:rgba(0,255,157,.28);box-shadow:0 10px 24px rgba(0,0,0,.28);background:rgba(255,255,255,.075)}
    .msg-item.important{border-left:4px solid #ffd84a;background:rgba(255,216,74,.06)}
    .msg-item.unread{border-left:4px solid #21ffd2;background:rgba(4,255,187,.06)}
    .msg-title{font-weight:800;font-size:1.08rem;color:#26ffd9}
    .msg-title.important{color:#ffd84a}
    .msg-date{font-size:.92rem;color:#9bdfff;opacity:.82}
    .msg-content{color:#eafaff;line-height:1.55}
    .meta{font-size:.86rem;opacity:.8;color:#a8ecff}
    .msg-actions{display:flex;gap:10px;margin-top:4px;flex-wrap:wrap}
    .pagination{display:flex;gap:8px;justify-content:center;align-items:center;margin-top:16px;flex-wrap:wrap}
    .page-btn{border:1px solid rgba(0,255,157,.18);background:rgba(255,255,255,.08);color:#bfefff;padding:8px 12px;border-radius:10px;font-weight:700;cursor:pointer}
    .page-btn[disabled]{opacity:.5;cursor:not-allowed}
    .page-info{color:#cfe8ff;opacity:.9}
    .state{text-align:center;color:#bdefff;opacity:.9;padding:12px;grid-column:1/-1}
    /* opțional: spațiu puțin la stânga pentru butonul de întoarcere pe ecrane înguste */
    @media (max-width:480px){ .toolbar{justify-content:flex-start} }
  </style>
</head>
<body>
  <div class="particles" id="particles"></div>

  <div class="wrap" id="spa">
    <section id="messagesSection" aria-label="Centru de mesaje">
      <h1 class="brand">PARIAZĂ INTELIGENT</h1>
      <p class="subtitle">
        Centru de mesaje — vezi ultimele anunțuri & răspunsuri admin
        <?php if ($userRole === 'admin'): ?>
          <span class="role-badge">Ești autentificat ca <strong>Admin</strong></span>
        <?php endif; ?>
      </p>

      <div class="toolbar">
        <!-- BUTON ÎNAPOI LA DASHBOARD -->
        <a href="/layout.html#dashboard.php"
           id="backBtn"
           class="btn secondary"
           title="Înapoi la Dashboard"
           aria-label="Înapoi la Dashboard">‹ Înapoi la Dashboard</a>

        <input class="input" id="search" type="search" placeholder="Caută după titlu/conținut…">
        <select class="select" id="important">
          <option value="">Toate</option>
          <option value="1">Doar importante</option>
          <option value="0">Doar neimportante</option>
        </select>
        <div class="checkwrap" title="Afișează doar mesajele necitite">
          <input type="checkbox" id="onlyUnread"><label for="onlyUnread">Doar necitite</label>
        </div>
        <select class="select" id="perPage">
          <option value="10">10/pagină</option>
          <option value="20">20/pagină</option>
          <option value="50">50/pagină</option>
        </select>
        <button class="btn" id="applyFilters">Aplică filtre</button>
        <?php if ($userRole === 'admin'): ?>
          <a class="btn secondary" href="/mesaje-admin.php">Administrare mesaje</a>
        <?php endif; ?>
      </div>

      <div class="tabs">
        <button class="tab-btn active" data-tab="anunturi" id="anunturiTab">Anunțuri</button>
        <button class="tab-btn" data-tab="personale" id="personaleTab">Mesaje personale</button>
      </div>

      <ul class="msg-list" id="msgList"></ul>

      <div class="pagination" id="pager" hidden>
        <button class="page-btn" id="prevBtn">‹ Anterior</button>
        <span class="page-info" id="pageInfo"></span>
        <button class="page-btn" id="nextBtn">Următor ›</button>
      </div>
    </section>
  </div>

<script>
// Particule
(function(){
  var box=document.getElementById('particles'); if(!box) return;
  var COUNT=60, minDur=8, maxDur=16;
  var css=''; var frag=document.createDocumentFragment();
  for(var i=0;i<COUNT;i++){
    var p=document.createElement('div'); p.className='particle';
    var size=(Math.random()*3+2).toFixed(1);
    p.style.width=size+'px'; p.style.height=size+'px';
    p.style.left=(Math.random()*100)+'%'; p.style.top=(Math.random()*100)+'%';
    p.style.background= (Math.random()<0.5 ? 'rgba(0,255,157,.28)' : 'rgba(0,184,255,.28)');
    var delay=(Math.random()*6).toFixed(2)+'s';
    var dur=(Math.random()*(maxDur-minDur)+minDur).toFixed(2)+'s';
    var kf='float-'+i;
    var dx1=(Math.random()*140-70)|0, dy1=(Math.random()*140-70)|0;
    var dx2=(Math.random()*140-70)|0, dy2=(Math.random()*140-70)|0;
    var dx3=(Math.random()*140-70)|0, dy3=(Math.random()*140-70)|0;
    css += '@keyframes '+kf+'{0%,100%{transform:translate(0,0);opacity:.75}'+
           '25%{transform:translate('+dx1+'px,'+dy1+'px);opacity:.9}'+
           '50%{transform:translate('+dx2+'px,'+dy2+'px);opacity:.85}'+
           '75%{transform:translate('+dx3+'px,'+dy3+'px);opacity:.9}}';
    p.style.animation=kf+' '+dur+' ease-in-out infinite'; p.style.animationDelay=delay;
    frag.appendChild(p);
  }
  box.appendChild(frag); var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
})();

// API
var API_LIST = '/api/messages_list.php';
var API_MARK = '/api/messages_mark_read.php';

// State
var state = { tab:'anunturi', page:1, perPage:10, q:'', important:'', onlyUnread:false, total:0, pages:1, loading:false };

// DOM
var msgList = document.getElementById('msgList');
var pager   = document.getElementById('pager');
var prevBtn = document.getElementById('prevBtn');
var nextBtn = document.getElementById('nextBtn');
var pageInfo= document.getElementById('pageInfo');

// Guard vizibilitate împotriva stilurilor globale
(function(){
  try{
    var ul = document.getElementById('msgList');
    if (ul) {
      ul.style.display = 'grid';
      ul.hidden = false;
      if (ul.style.visibility === 'hidden') ul.style.visibility = 'visible';
      if (ul.style.opacity === '0') ul.style.opacity = '1';
    }
  }catch(_){}
})();

// Tabs
var tabBtns=document.querySelectorAll('.tab-btn');
for(var t=0;t<tabBtns.length;t++){
  tabBtns[t].addEventListener('click', (function(btn){
    return function(){
      for(var j=0;j<tabBtns.length;j++){ tabBtns[j].classList.remove('active'); }
      btn.classList.add('active');
      state.tab = String(btn.getAttribute('data-tab')||'anunturi');
      state.page = 1;
      fetchAndRender();
    };
  })(tabBtns[t]));
}

// Filtre
document.getElementById('applyFilters').addEventListener('click', function(){
  state.q = (document.getElementById('search').value||'').trim();
  state.important = document.getElementById('important').value;
  state.perPage = parseInt(document.getElementById('perPage').value,10) || 10;
  state.onlyUnread = !!document.getElementById('onlyUnread').checked;
  state.page = 1;
  fetchAndRender();
});
document.getElementById('search').addEventListener('keydown', function(e){
  if (e.key === 'Enter'){ e.preventDefault(); document.getElementById('applyFilters').click(); }
});

// BUTON ÎNAPOI — funcționează și din iframe (layout)
(function(){
  var back = document.getElementById('backBtn');
  if(!back) return;
  back.addEventListener('click', function(e){
    e.preventDefault();
    try{
      if (window.parent && window.parent !== window) {
        // dacă este încărcat în layout, schimbăm doar hash-ul
        window.parent.location.hash = "dashboard.php";
      } else {
        // fallback: mergem direct la layout + hash
        location.href = "/layout.html#dashboard.php";
      }
    } catch(_){
      location.href = "/layout.html#dashboard.php";
    }
  });
})();

// Pager
prevBtn.addEventListener('click', function(){ if (state.page>1){ state.page--; fetchAndRender(); } });
nextBtn.addEventListener('click', function(){ if (state.page<state.pages){ state.page++; fetchAndRender(); } });

// Helpers
function setLoading(on){ state.loading=on; if(on) msgList.innerHTML='<li class="state">Se încarcă…</li>'; }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }
function nl2br(s){ return String(s||'').replace(/\n/g,'<br>'); }

function renderItems(items){
  if (!items || !items.length){ msgList.innerHTML='<li class="state">Nimic de afișat.</li>'; return; }
  var frag=document.createDocumentFragment();
  for(var i=0;i<items.length;i++){
    var m=items[i];
    var li=document.createElement('li');
    var isImp = Number(m.important)===1;
    var isUnread = !!m.unread;
    li.className='msg-item'+(isImp?' important':'')+(isUnread?' unread':'');
    li.innerHTML =
      '<div class="msg-title '+(isImp?'important':'')+'">'+escapeHtml(m.titlu)+'</div>'+
      '<div class="meta">'+(m.tip==='anunt'?'Anunț public':'Mesaj personal')+'</div>'+
      '<div class="msg-date">'+escapeHtml(m.created_at_human || m.created_at || '')+'</div>'+
      '<div class="msg-content">'+nl2br(escapeHtml(m.continut || ''))+'</div>'+
      '<div class="msg-actions">'+
        (isUnread ? '<button class="btn" data-read="'+m.id+'">Marchează drept citit</button>' : '')+
        (isImp ? '<span class="btn secondary" style="border-color:#ffd84a;color:#ffd84a;background:rgba(255,216,74,.12)">Important</span>' : '')+
      '</div>';
    frag.appendChild(li);
  }
  msgList.innerHTML='';
  msgList.appendChild(frag);

  var markBtns = msgList.querySelectorAll('[data-read]');
  for(var k=0;k<markBtns.length;k++){
    markBtns[k].addEventListener('click', function(){
      var b=this; var id=Number(b.getAttribute('data-read')); b.disabled=true;
      fetch(API_MARK,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({mesaj_id:id})})
        .then(function(r){return r.json();})
        .then(function(js){
          if(js && js.success){ b.textContent='Marcat'; fetchAndRender(false); }
          else{ b.disabled=false; alert((js && js.error) || 'Nu s-a putut marca mesajul.'); }
        })
        .catch(function(){ b.disabled=false; alert('Eroare de rețea.'); });
    });
  }
}

function renderPager(){
  pager.hidden = !(state.pages>1);
  if (pager.hidden) return;
  prevBtn.disabled = state.page<=1;
  nextBtn.disabled = state.page>=state.pages;
  pageInfo.textContent = 'Pagina '+state.page+' / '+state.pages+' (total '+state.total+')';
}

function fetchAndRender(spinner){
  if (spinner===undefined) spinner=true;
  if (spinner) setLoading(true);
  var params = new URLSearchParams({tab:state.tab,page:state.page,per_page:state.perPage});
  if (state.q) params.set('q', state.q);
  if (state.important!=='') params.set('important', state.important);
  if (state.onlyUnread) params.set('unread','1');

  fetch(API_LIST+'?'+params.toString(),{credentials:'include'})
    .then(function(r){ return r.json(); })
    .then(function(js){
      var items = js.items || js.data || [];
      var total = Number(js.filtered_total != null ? js.filtered_total :
                         js.total_filtered != null ? js.total_filtered :
                         js.totalMatching != null ? js.totalMatching :
                         js.total != null ? js.total :
                         js.totalCount != null ? js.totalCount : items.length);
      var pages = Number(js.pages_filtered != null ? js.pages_filtered :
                         js.filtered_pages != null ? js.filtered_pages :
                         js.pages != null ? js.pages :
                         js.totalPages != null ? js.totalPages : 0);
      if (!pages || isNaN(pages)) { pages = Math.max(1, Math.ceil((total||0)/(state.perPage||10))); }
      if (state.page>pages){ state.page=pages; fetchAndRender(false); return; }
      state.total=total; state.pages=pages;
      renderItems(items); renderPager();
    })
    .catch(function(e){
      console.error(e);
      msgList.innerHTML='<li class="state">Eroare la încărcarea mesajelor.</li>';
      pager.hidden=true;
    })
    .finally(function(){ setLoading(false); });
}

// expun hook pentru loader, dar pornesc și direct
window.initMesaje = function(){ fetchAndRender(); };
fetchAndRender();
</script>
</body>
</html>
