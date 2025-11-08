diff --git a/public_html/v1/dashboard-investitor.php b/public_html/v1/dashboard-investitor.php
index 120b1000c27abfd31815b630d0ea63d7c3141743..e2a8bc84e122177d2e1543793f4397a7d5e62bce 100644
--- a/public_html/v1/dashboard-investitor.php
+++ b/public_html/v1/dashboard-investitor.php
@@ -194,50 +194,66 @@ if ($name === '') $name = 'Investitor';
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
 
+        <form id="chatSearchForm" class="mb-2 flex items-center gap-2 text-xs">
+          <input id="chatSearchInput" autocomplete="off" maxlength="120"
+                 class="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
+                 placeholder="Caută în arhivă (minim 2 caractere)…" />
+          <button type="submit"
+                  class="rounded-xl px-3 py-2 border border-white/10 hover:border-cyan-400/40 text-[11px] uppercase tracking-wide text-slate-300">Caută</button>
+        </form>
+
+        <div id="chatSearchResults" class="hidden rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs space-y-2">
+          <div class="flex items-center justify-between gap-3 text-[11px] uppercase tracking-wide text-slate-400">
+            <span id="chatSearchMeta"></span>
+            <button type="button" id="chatSearchClose" class="text-slate-500 hover:text-slate-200 transition"><i class="fa-solid fa-xmark"></i></button>
+          </div>
+          <div id="chatSearchItems" class="max-h-36 overflow-y-auto nice-scroll space-y-2"></div>
+        </div>
+
         <div id="chatFeed" class="h-48 overflow-y-auto nice-scroll space-y-2 p-1 rounded-xl border border-white/10 bg-slate-900/50" aria-live="polite"></div>
 
         <form id="chatForm" class="mt-3 flex items-center gap-2">
           <input id="chatInput" maxlength="500" autocomplete="off"
                 class="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
                 placeholder="Scrie un mesaj (max 500 caractere)…" />
           <button id="chatSend" type="submit"
                 class="rounded-xl px-3 py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 text-sm font-semibold">
             Trimite
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
 
@@ -976,207 +992,406 @@ if ($name === '') $name = 'Investitor';
 
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
 
-  <!-- Chat Comunitate (SSE single-instance + dedup) -->
+  <!-- Chat Comunitate (SSE single-instance + dedup + lazy history + search) -->
   <script>
   (function(){
     const feed  = document.getElementById('chatFeed');
     const form  = document.getElementById('chatForm');
     const input = document.getElementById('chatInput');
     const btn   = document.getElementById('chatSend');
     const liveB = document.getElementById('chatLive');
+    const searchForm   = document.getElementById('chatSearchForm');
+    const searchInput  = document.getElementById('chatSearchInput');
+    const searchResults = document.getElementById('chatSearchResults');
+    const searchMeta   = document.getElementById('chatSearchMeta');
+    const searchItems  = document.getElementById('chatSearchItems');
+    const searchClose  = document.getElementById('chatSearchClose');
+    const searchSubmit = searchForm ? searchForm.querySelector('button[type="submit"]') : null;
     if(!feed || !form) return;
 
     const meName = document.body.dataset.userName || 'Investitor';
     let lastId = +(sessionStorage.getItem('chat:lastId') || 0);
+    let oldestId = null;
+    let loadingOlder = false;
+    let olderEnd = false;
     let sse = null;
     let pollTimer = null;
+    let searchAbort = null;
     const POLL_MS = 4000;
+    const PAGE_LIMIT = 50;
     const SEEN = new Set();            // dedup sigur
     const NF_TIME = new Intl.DateTimeFormat('ro-RO',{hour:'2-digit',minute:'2-digit'});
+    const NF_DATE = new Intl.DateTimeFormat('ro-RO',{dateStyle:'short',timeStyle:'short'});
 
     function esc(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
     function atBottom(){ return Math.abs(feed.scrollHeight - feed.scrollTop - feed.clientHeight) < 6; }
     function scrollBottom(){ feed.scrollTo({top:feed.scrollHeight, behavior:'smooth'}); }
 
-    function appendMsg(m){
+    function buildRow(m){
       const id = m.id|0;
-      if (id && SEEN.has(id)) return;
+      if (id && SEEN.has(id)) return null;
       if (id) {
         SEEN.add(id);
-        if (SEEN.size > 5000) { // protecție memorie
+        if (SEEN.size > 5000) {
           let n = 0;
           for (const x of SEEN){ SEEN.delete(x); if(++n>=1000) break; }
         }
-        lastId = Math.max(lastId, id);
-        sessionStorage.setItem('chat:lastId', String(lastId));
+        if (oldestId === null || id < oldestId) oldestId = id;
+        if (id > lastId) {
+          lastId = id;
+          sessionStorage.setItem('chat:lastId', String(lastId));
+        }
       }
       const mine = (m.user_name === meName);
       const row = document.createElement('div');
       row.className = 'w-full flex ' + (mine ? 'justify-end' : 'justify-start');
+      if (id) row.dataset.chatId = String(id);
 
       const badge = m.role === 'ADMIN'
         ? '<span class="badge bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 ml-2">Admin</span>'
         : '';
 
       row.innerHTML = `
         <div class="max-w-[85%] rounded-2xl px-3 py-2 text-sm border bg-white/5 border-white/10">
           <div class="text-[11px] opacity-80 mb-1">
             <i class="fa-regular fa-user"></i> ${esc(m.user_name||'—')} ${badge}
             <span class="ml-2 text-slate-500">${NF_TIME.format(new Date((m.ts||0)*1000))}</span>
           </div>
           <div>${esc(m.body||'')}</div>
         </div>`;
+      return row;
+    }
+
+    function appendMsg(m){
+      const row = buildRow(m);
+      if (!row) return;
       const stick = atBottom();
       feed.appendChild(row);
       if (stick) scrollBottom();
     }
 
-function stopPoll(){
+    function prependBatch(items){
+      if (!items || !items.length) return false;
+      const frag = document.createDocumentFragment();
+      let appended = false;
+      for (const m of items) {
+        const row = buildRow(m);
+        if (!row) continue;
+        frag.appendChild(row);
+        appended = true;
+      }
+      if (!appended) return false;
+      feed.insertBefore(frag, feed.firstChild);
+      return true;
+    }
+
+    async function loadOlder(){
+      if (loadingOlder || olderEnd || !oldestId) return false;
+      loadingOlder = true;
+      feed.setAttribute('aria-busy','true');
+      feed.dataset.loadingOlder = '1';
+      const prevHeight = feed.scrollHeight;
+      const prevTop = feed.scrollTop;
+      let inserted = false;
+      try{
+        const r = await fetch(`/api/chat/fetch.php?before_id=${encodeURIComponent(oldestId)}&limit=${PAGE_LIMIT}`, {credentials:'include'});
+        const j = await r.json();
+        const items = Array.isArray(j.items) ? j.items : [];
+        if (!items.length) {
+          olderEnd = true;
+        } else {
+          inserted = prependBatch(items);
+          if (items.length < PAGE_LIMIT) olderEnd = true;
+          if (inserted) {
+            const diff = feed.scrollHeight - prevHeight;
+            if (diff > 0) feed.scrollTop = diff + prevTop;
+          }
+        }
+      }catch(_){
+        // silent fallback
+      }finally{
+        delete feed.dataset.loadingOlder;
+        feed.removeAttribute('aria-busy');
+        loadingOlder = false;
+      }
+      return inserted;
+    }
+
+    feed.addEventListener('scroll', ()=>{
+      if (feed.scrollTop <= 12) loadOlder();
+    });
+
+    function stopPoll(){
       if (!pollTimer) return;
       clearInterval(pollTimer);
       pollTimer = null;
     }
 
     async function pullLatest(){
       try{
         const r = await fetch(`/api/chat/fetch.php?since_id=${encodeURIComponent(lastId||0)}`, {credentials:'include'});
         const j = await r.json();
         (j.items||[]).forEach(appendMsg);
       }catch(_){/* fallback silent */}
     }
 
     function startPoll(immediate=false){
       if (pollTimer) return;
       if (immediate) pullLatest();
       pollTimer = setInterval(pullLatest, POLL_MS);
     }
 
     async function bootstrap(){
       try{
-        const r = await fetch('/api/chat/fetch.php?limit=50', {credentials:'include'});
+        const r = await fetch(`/api/chat/fetch.php?limit=${PAGE_LIMIT}`, {credentials:'include'});
         const j = await r.json();
-        (j.items||[]).forEach(appendMsg);
+        const items = Array.isArray(j.items) ? j.items : [];
+        items.forEach(appendMsg);
+        if (!items.length || items.length < PAGE_LIMIT) olderEnd = true;
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
-         startPoll(true);
+        startPoll(true);
       }
     }
 
     function openSSE(){
-   if (sse) { try{sse.close();}catch{}; sse=null; }
+      if (sse) { try{sse.close();}catch{}; sse=null; }
       const url = `/api/chat/stream.php?last_id=${encodeURIComponent(lastId||0)}`;
       sse = new EventSource(url); // same-origin -> fără withCredentials
 
       sse.addEventListener('open', ()=>{
         liveB.textContent='live';
         liveB.className='badge bg-emerald-500/15 text-emerald-200 border border-emerald-400/30';
         stopPoll();
       });
-      
+
       sse.addEventListener('hello', (e)=>{
         try{
           const d = JSON.parse(e.data);
           if (d && d.last_id) {
-            lastId = Math.max(lastId, d.last_id|0);
-            sessionStorage.setItem('chat:lastId', String(lastId));
+            const lid = d.last_id|0;
+            if (lid > lastId) {
+              lastId = lid;
+              sessionStorage.setItem('chat:lastId', String(lastId));
+            }
           }
-        }catch(_){}
+        }catch(_){ }
       });
 
       sse.addEventListener('message', (e)=>{
         try{
           const m = JSON.parse(e.data);
-          appendMsg(m); // <- nu renderMsg
-        }catch(_){}
+          appendMsg(m);
+        }catch(_){ }
       });
 
-
       sse.addEventListener('ping', ()=>{ /* keepalive */ });
 
-   sse.addEventListener('error', ()=>{
+      sse.addEventListener('error', ()=>{
         liveB.textContent='sync';
         liveB.className='badge bg-amber-500/15 text-amber-200 border border-amber-400/30';
-        // NU redeschidem manual; EventSource reconectează singur cu retry:3000
         startPoll(true);
       });
     }
 
-// opțional, dacă tab-ul revine din background și EventSource e CLOSED (2), redeschidem:
-document.addEventListener('visibilitychange', ()=>{
-  if (!document.hidden && sse && sse.readyState === 2) openSSE();
-});
+    document.addEventListener('visibilitychange', ()=>{
+      if (!document.hidden && sse && sse.readyState === 2) openSSE();
+    });
+
+    function clearSearchResults(){
+      if (searchAbort) { searchAbort.abort(); searchAbort = null; }
+      if (searchItems) searchItems.innerHTML = '';
+      if (searchMeta) searchMeta.textContent = '';
+      if (searchResults) searchResults.classList.add('hidden');
+    }
+
+    function setSearchLoading(state){
+      if (!searchForm) return;
+      searchForm.classList.toggle('opacity-60', state);
+      if (searchSubmit) searchSubmit.disabled = state;
+    }
+
+    function renderSearch(term, items, hint){
+      if (!searchResults || !searchItems || !searchMeta) return;
+      searchItems.innerHTML = '';
+
+      if (hint === 'too_short') {
+        const row = document.createElement('div');
+        row.className = 'text-slate-500';
+        row.textContent = 'Introdu minim 2 caractere pentru a căuta.';
+        searchItems.appendChild(row);
+      } else if (hint === 'auth') {
+        const row = document.createElement('div');
+        row.className = 'text-slate-500';
+        row.textContent = 'Sesiunea a expirat. Reautentifică-te pentru a căuta în arhivă.';
+        searchItems.appendChild(row);
+      } else if (!items.length) {
+        const row = document.createElement('div');
+        row.className = 'text-slate-500';
+        row.textContent = hint === 'error' ? 'Căutarea nu este disponibilă momentan.' : 'Nicio potrivire găsită.';
+        searchItems.appendChild(row);
+      } else {
+        for (const item of items) {
+          const id = item.id|0;
+          const entry = document.createElement('button');
+          entry.type = 'button';
+          entry.dataset.resultId = String(id);
+          entry.className = 'w-full text-left rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition';
+          entry.innerHTML = `
+            <div class="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
+              <span><i class="fa-regular fa-user"></i> ${esc(item.user_name||'—')}</span>
+              <span>${NF_DATE.format(new Date((item.ts||0)*1000))}</span>
+            </div>
+            <div class="mt-1 text-slate-200">${esc(item.body||'')}</div>`;
+          entry.addEventListener('click', ()=>{
+            focusMessage(id);
+          });
+          searchItems.appendChild(entry);
+        }
+      }
+
+      searchMeta.textContent = items.length
+        ? `${items.length} rezultate pentru „${term}”`
+        : `Rezultate pentru „${term}”`;
+      searchResults.classList.remove('hidden');
+    }
+
+    searchClose?.addEventListener('click', ()=>{
+      clearSearchResults();
+    });
+
+    searchInput?.addEventListener('input', ()=>{
+      if (!searchInput.value.trim()) clearSearchResults();
+    });
+
+    searchForm?.addEventListener('submit', async (e)=>{
+      e.preventDefault();
+      const term = (searchInput?.value || '').trim();
+      if (term.length < 2) {
+        clearSearchResults();
+        return;
+      }
+      if (searchAbort) { searchAbort.abort(); }
+      const controller = new AbortController();
+      searchAbort = controller;
+      setSearchLoading(true);
+      try{
+        const r = await fetch(`/api/chat/search.php?q=${encodeURIComponent(term)}&limit=20`, {credentials:'include', signal: controller.signal});
+        if (!r.ok) {
+          renderSearch(term, [], r.status === 401 ? 'auth' : 'error');
+          return;
+        }
+        const j = await r.json();
+        renderSearch(term, Array.isArray(j.items) ? j.items : [], j.hint || null);
+      }catch(err){
+        if (err.name !== 'AbortError') {
+          renderSearch(term, [], 'error');
+        }
+      }finally{
+        if (searchAbort === controller) searchAbort = null;
+        setSearchLoading(false);
+      }
+    });
 
+    async function focusMessage(rawId){
+      const targetId = rawId|0;
+      if (!targetId) return;
+      let attempts = 0;
+      if (!SEEN.has(targetId)) {
+        if (oldestId !== null && targetId < oldestId) {
+          while (!SEEN.has(targetId) && !olderEnd && attempts < 15) {
+            await loadOlder();
+            attempts++;
+          }
+        } else if (targetId > lastId) {
+          await pullLatest();
+        }
+      }
+      const node = feed.querySelector(`[data-chat-id="${targetId}"]`);
+      if (!node) {
+        alert('Mesajul este mai vechi. Continuă să derulezi în sus pentru a încărca mai mult din arhivă.');
+        return;
+      }
+      const top = Math.max(0, node.offsetTop - 12);
+      feed.scrollTo({ top, behavior: 'smooth' });
+      const bubble = node.firstElementChild;
+      if (bubble) {
+        bubble.classList.add('ring-2','ring-cyan-400/70');
+        setTimeout(()=>bubble.classList.remove('ring-2','ring-cyan-400/70'), 2000);
+      }
+    }
 
     form.addEventListener('submit', async (e)=>{
       e.preventDefault();
       const txt = (input.value||'').trim();
       if(!txt) return;
       btn.disabled = true;
 
       try{
         const r = await fetch('/api/chat/send.php', {
           method:'POST', headers:{'Content-Type':'application/json'},
           credentials:'include', body: JSON.stringify({ text: txt })
         });
         const j = await r.json().catch(()=>null);
         if(!r.ok || !j || !j.ok){
           const err = (j && j.error) || 'error';
           const t = { throttled:'Anti-spam: așteaptă 3s.', too_long:'Max 500 caractere.', duplicate:'Mesaj duplicat (30s).', unauthorized:'Nu ești autentificat.' }[err] || 'Eroare. Încearcă din nou.';
           alert(t);
         } else {
           input.value=''; // mesajul va veni prin SSE
-           if (!sse || sse.readyState !== 1) {
+          if (!sse || sse.readyState !== 1) {
             await pullLatest();
           }
         }
       }catch{
         alert('Conexiune indisponibilă.');
       }finally{
         btn.disabled=false;
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
 
+
 </body>
 </html>
