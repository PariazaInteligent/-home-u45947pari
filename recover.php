<?php
?><!DOCTYPE html>
<html lang="ro"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Recuperare parolă</title>
<script src="https://cdn.tailwindcss.com"></script>
</head><body class="min-h-screen bg-slate-950 text-slate-100">
<main class="max-w-md mx-auto p-6">
  <h1 class="text-xl font-bold">Recuperare parolă</h1>
  <p class="text-slate-400 mt-1 text-sm">Introdu adresa ta de email.</p>

  <form id="f" class="mt-4 space-y-3">
    <input id="email" type="email" required placeholder="nume@domeniu.com"
           class="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none">
    <button id="btn" class="w-full rounded-2xl px-5 py-3 bg-white text-slate-900 font-semibold">Trimite link-ul</button>
    <p id="msg" class="text-sm mt-2"></p>
  </form>
</main>

<script>
const f = document.getElementById('f');
const email = document.getElementById('email');
const btn = document.getElementById('btn');
const msg = document.getElementById('msg');

f.addEventListener('submit', async (e)=>{
  e.preventDefault();
  msg.textContent = ''; btn.disabled = true; btn.textContent = 'Trimit...';
  try{
    const r = await fetch('/api/recover_start.php', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email: email.value.trim() })
    });
    await r.json().catch(()=>({}));
    msg.textContent = 'Dacă adresa există, ți-am trimis un link de resetare.';
    msg.className = 'text-emerald-300 text-sm mt-2';
  }catch(_){
    msg.textContent = 'Eroare rețea. Reîncearcă.';
    msg.className = 'text-rose-300 text-sm mt-2';
  } finally {
    btn.disabled = false; btn.textContent = 'Trimite link-ul';
  }
});
</script>
</body></html>
