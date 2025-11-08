<section class="mt-6 p-4 rounded-2xl border border-white/10 bg-white/5">
<div class="flex items-center justify-between">
<div>
<h3 class="font-semibold">Activează Face ID / Passkey</h3>
<p class="text-sm text-slate-400">Conectare fără parolă pe acest dispozitiv (platform authenticator).</p>
</div>
<button id="btnAddPasskey" class="rounded-xl px-4 py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-semibold">
Adaugă Passkey
</button>
</div>
<p id="pkMsg" class="mt-2 text-xs text-slate-400"></p>
</section>


<script>
const b64uToBuf = (b64u)=>{ const s=b64u.replace(/-/g,'+').replace(/_/g,'/'); const pad='='.repeat((4-(s.length%4))%4); const str=atob(s+pad); const buf=new ArrayBuffer(str.length); const view=new Uint8Array(buf); for(let i=0;i<str.length;i++) view[i]=str.charCodeAt(i); return buf; };
const bufToB64u = (buf)=>{ const bytes=new Uint8Array(buf); let bin=''; for(const b of bytes) bin+=String.fromCharCode(b); return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };


async function addPasskey(){
const msg = document.getElementById('pkMsg');
msg.textContent = '';
try{
const r = await fetch('/api/passkeys/start-attestation.php', { credentials:'include', cache:'no-store' });
if(!r.ok) throw new Error('http');
const opts = await r.json();
const pub = {...opts.publicKey};
if(pub.challenge) pub.challenge = b64uToBuf(pub.challenge);
if(pub.user && pub.user.id) pub.user.id = b64uToBuf(pub.user.id);


const cred = await navigator.credentials.create({ publicKey: pub });
if(!cred) throw new Error('no_cred');


const payload = {
id: cred.id,
type: cred.type,
rawId: bufToB64u(cred.rawId),
response: {
clientDataJSON: bufToB64u(cred.response.clientDataJSON),
attestationObject: bufToB64u(cred.response.attestationObject)
}
};


const res = await fetch('/api/passkeys/finish-attestation.php', {
method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload)
});
const data = await res.json().catch(()=>({}));
if(data && data.ok){ msg.textContent = 'Passkey adăugată cu succes pe acest dispozitiv.'; }
else throw new Error(data?.err||'fail');
}catch(e){
document.getElementById('pkMsg').textContent = 'Nu am reușit să adăugăm passkey: ' + (e.message||'eroare');
}
}


document.getElementById('btnAddPasskey')?.addEventListener('click', addPasskey);
</script>