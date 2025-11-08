<?php
session_start();
$a = random_int(1,9); $b = random_int(1,9);
$_SESSION['reg_captcha'] = $a + $b;
?><!DOCTYPE html>
<html lang="ro" data-theme="dark">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Înregistrare — Banca Comună</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
<style>
  .ok{color:#86efac}.bad{color:#fca5a5}
</style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100">
<main class="relative z-10 flex items-center justify-center min-h-screen px-4">
  <div class="w-full max-w-md">
    <div class="rounded-3xl p-0.5 bg-gradient-to-br from-blue-600/40 via-cyan-500/30 to-teal-400/40">
      <section class="rounded-3xl bg-slate-900/80 backdrop-blur p-7 md:p-8">
        <h1 class="text-xl font-bold">Creează cont</h1>
        <form id="regForm" class="mt-6 space-y-4" novalidate>
          <input type="text" id="hpWebsite" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true" />

          <div>
            <label class="text-sm text-slate-300" for="email">Email</label>
            <input id="email" type="email" required autocomplete="email" placeholder="nume@domeniu.com"
              class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400/60">
            <p id="emailErr" class="hidden mt-1 text-xs text-rose-300">Email invalid.</p>
          </div>

          <div>
            <label class="text-sm text-slate-300" for="password">Parolă</label>
            <input id="password" type="password" minlength="10" maxlength="72" required autocomplete="new-password" placeholder="••••••••"
              class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400/60">
            <input id="password2" type="password" minlength="10" maxlength="72" required autocomplete="new-password" placeholder="Confirmare parolă"
              class="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-cyan-400/60">
            <p id="pwdErr" class="hidden mt-1 text-xs text-rose-300">Parolele nu coincid.</p>

            <!-- Reguli parolă (live) -->
            <ul id="pwRules" class="mt-3 text-xs space-y-1 text-slate-400">
              <li data-k="len">• 10–72 caractere</li>
              <li data-k="low">• cel puțin o literă mică (a–z)</li>
              <li data-k="up">• cel puțin o literă mare (A–Z)</li>
              <li data-k="dig">• cel puțin o cifră (0–9)</li>
              <li data-k="sym">• cel puțin un simbol (!@#$%^&*...)</li>
              <li data-k="space">• fără spații</li>
              <li data-k="ascii">• doar caractere ASCII vizibile</li>
            </ul>
          </div>

          <div>
            <label class="text-sm text-slate-300" for="captcha">CAPTCHA</label>
            <div class="mt-1 flex gap-2 items-center">
              <span class="text-sm text-slate-300">Cât face <strong><?="$a + $b"?></strong>?</span>
              <input id="captcha" type="number" inputmode="numeric" required
                class="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-cyan-400/60">
            </div>
          </div>

          <label class="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <input id="terms" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-white/5" required>
            <span>Accept <a class="underline decoration-dotted hover:text-white" href="/termeni.html" target="_blank">Termenii și Condițiile</a></span>
          </label>

          <button id="btnReg" type="submit" class="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-semibold">
            <i class="fa-solid fa-user-plus"></i><span>Înregistrează-te</span>
          </button>
          <p id="formErr" class="hidden text-sm text-rose-300">Eroare. Verifică datele.</p>
          <p id="formOk" class="hidden text-sm text-emerald-300">Cont creat. Verifică emailul pentru confirmare.</p>
        </form>
      </section>
    </div>
  </div>
</main>

<script>
const email = document.getElementById('email');
const emailErr=document.getElementById('emailErr');
const p1=document.getElementById('password'); const p2=document.getElementById('password2');
const pwdErr=document.getElementById('pwdErr');
const rules=document.getElementById('pwRules').querySelectorAll('[data-k]');
const btn=document.getElementById('btnReg');
const hp=document.getElementById('hpWebsite');
const formErr=document.getElementById('formErr'); const formOk=document.getElementById('formOk');
const captcha=document.getElementById('captcha');

function checkPw(){
  const v=p1.value;
  const ok = {
  len: v.length>=10 && v.length<=72,
  low: /[a-z]/.test(v),
  up: /[A-Z]/.test(v),
  dig: /\d/.test(v),
  sym: /[^A-Za-z0-9]/.test(v),      // <-- aici e fix-ul
  space: !/\s/.test(v),
  ascii: /^[\x20-\x7E]+$/.test(v)
};

  rules.forEach(li=>{
    const k=li.getAttribute('data-k'); li.className = ok[k] ? 'ok' : 'bad';
  });
  return Object.values(ok).every(Boolean);
}
[p1,p2].forEach(el=>el.addEventListener('input', checkPw));
email.addEventListener('blur', ()=> emailErr.classList.toggle('hidden', email.validity.valid));
document.getElementById('regForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  formErr.classList.add('hidden'); formOk.classList.add('hidden');
  const pwOk = checkPw();
  if(!email.validity.valid || !pwOk || p1.value!==p2.value || !captcha.value || hp.value){
    if(p1.value!==p2.value) pwdErr.classList.remove('hidden'); else pwdErr.classList.add('hidden');
    formErr.textContent='Date invalide.'; formErr.classList.remove('hidden'); return;
  }
  btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i><span>Trimit...</span>';
  try{
    const r=await fetch('/api/register.php',{method:'POST',headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email: email.value.trim(), password: p1.value, captcha: captcha.value })});
    const data=await r.json().catch(()=>({}));
    if(data && data.ok){ formOk.classList.remove('hidden'); setTimeout(()=>{ window.location.assign('/verify-sent.php'); },600); }
    else if(data && data.code==='email_exists'){ formErr.textContent='Acest email este deja folosit.'; formErr.classList.remove('hidden'); }
    else if(data && data.code==='captcha'){ formErr.textContent='CAPTCHA invalid.'; formErr.classList.remove('hidden'); }
    else if(data && data.code==='rate'){ formErr.textContent='Prea multe încercări. Reîncearcă mai târziu.'; formErr.classList.remove('hidden'); }
    else if(data && data.code==='password_policy'){ formErr.textContent='Parola nu respectă regulile.'; formErr.classList.remove('hidden'); }
    else { formErr.textContent='Nu am putut crea contul.'; formErr.classList.remove('hidden'); }
  }catch(_){ formErr.textContent='Eroare rețea.'; formErr.classList.remove('hidden'); }
  finally{ btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-user-plus"></i><span>Înregistrează-te</span>'; }
});
</script>
</body></html>
