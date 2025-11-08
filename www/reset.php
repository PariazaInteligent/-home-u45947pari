<?php
$token = $_GET['t'] ?? '';
?><!DOCTYPE html>
<html lang="ro"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Setează parolă nouă</title>
<script src="https://cdn.tailwindcss.com"></script>
</head><body class="min-h-screen bg-slate-950 text-slate-100">
<main class="max-w-md mx-auto p-6">
  <h1 class="text-xl font-bold">Setează parolă nouă</h1>
  <p class="text-slate-400 mt-1 text-sm">Completează câmpurile de mai jos.</p>

  <form id="f" class="mt-4 space-y-3">
    <input type="password" id="p1" minlength="8" required placeholder="Parolă nouă"
           class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3">
    <input type="password" id="p2" minlength="8" required placeholder="Confirmare parolă"
           class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3">
    <button id="btn" class="w-full rounded-2xl px-5 py-3 bg-white text-slate-900 font-semibold">Resetează parola</button>
    <p id="msg" class="text-sm mt-2"></p>
  </form>
</main>

<script>
const token = <?= json_encode($token) ?>;
const f = document.getElementById('f');
const p1 = document.getElementById('p1');
const p2 = document.getElementById('p2');
const btn = document.getElementById('btn');
const msg = document.getElementById('msg');

f.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(p1.value !== p2.value){ msg.textContent='Parolele nu coincid.'; msg.className='text-rose-300 text-sm mt-2'; return; }
  btn.disabled = true; btn.textContent = 'Validez...'; msg.textContent='';
  try{
    const r = await fetch('/api/recover_finish.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ token: token, password: p1.value })
    });
    const data = await r.json();
    if(data && data.ok){
      msg.textContent='Parola a fost schimbată. Poți să te autentifici.';
      msg.className='text-emerald-300 text-sm mt-2';
      setTimeout(()=>{ window.location.href = '/v1/login.html'; }, 1200);
    } else {
      msg.textContent='Link invalid sau expirat.';
      msg.className='text-rose-300 text-sm mt-2';
      btn.disabled = false; btn.textContent = 'Resetează parola';
    }
  }catch(_){
    msg.textContent='Eroare rețea. Reîncearcă.';
    msg.className='text-rose-300 text-sm mt-2';
    btn.disabled = false; btn.textContent = 'Resetează parola';
  }
});
</script>
</body></html>
