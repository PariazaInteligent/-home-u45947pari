<?php require __DIR__ . '/../api/stripe/config.php'; ?>
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Investiție — Plata prin Stripe</title>
  <style>
    :root{color-scheme:dark;}
    body{margin:20px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; background:#0b1220; color:#e5ecff;}
    .card{max-width:560px;background:#0f172a;border:1px solid #1f2a44;border-radius:14px;padding:16px}
    .row{display:flex;gap:12px;align-items:center;margin:10px 0}
    input[type="number"]{background:#0b1220;border:1px solid #24314f;border-radius:10px;color:#e5ecff;padding:10px 12px;min-width:140px}
    .muted{color:#9fb3d9;font-size:13px}
    .kvs{display:grid;grid-template-columns:1fr auto;gap:8px;font-size:15px}
    .kvs div:nth-child(2n){font-variant-numeric:tabular-nums}
    .total{font-weight:700;font-size:18px}
    button{background:linear-gradient(90deg,#2563eb,#06b6d4,#14b8a6);color:#0b1220;
      border:0;border-radius:12px;padding:12px 16px;font-weight:700;cursor:pointer}
    button[disabled]{opacity:.55;cursor:not-allowed}
    #err{color:#ff6b6b;white-space:pre-wrap;margin-top:10px;font-size:14px}
  </style>
</head>
<body>
  <div class="card">
    <h2 style="margin:0 0 8px 0">Investiție nouă</h2>
    <div class="muted">Introdu <strong>NETUL dorit</strong> (cât vrei să ajungă efectiv în bancă). Taxa Stripe este afișată separat, iar la plată vei achita <strong>totalul brut</strong>.</div>

    <div class="row">
      <label for="amount" style="min-width:130px">Net dorit (€)</label>
      <input id="amount" type="number" step="0.01" min="0.50" value="5.00" inputmode="decimal">
    </div>

    <div class="kvs" style="margin:12px 0 6px">
      <div>Taxă procesare (estimativ)</div><div id="fee">—</div>
      <div class="total">Total de plată</div><div class="total" id="gross">—</div>
    </div>

    <div class="muted">Formula utilizată: <code>fee = p % + fix</code> • Parametrii curenți: <span id="params">p=1.5%, fix=0.25€</span></div>

    <div class="row" style="justify-content:space-between;margin-top:16px">
      <button id="go">Continuă către plată</button>
      <div id="err"></div>
    </div>
  </div>

  <script>
    // === Parametri taxă Stripe (estimare UI) ===
    // Exemplele tale corespund bine cu 1.5% + 0.25 EUR
    const FEE_PCT = 0.015;      // 1.5%
    const FEE_FIXED = 0.25;     // €0.25
    const CURRENCY = 'eur';

    const fmt = (v)=> new Intl.NumberFormat('ro-RO',{style:'currency',currency:'EUR',minimumFractionDigits:2}).format(v);
    const $amount = document.getElementById('amount');
    const $fee    = document.getElementById('fee');
    const $gross  = document.getElementById('gross');
    const $err    = document.getElementById('err');
    const $go     = document.getElementById('go');

    // Calculează BRUT pentru a obține NET (net + fee)
    function computeGrossFromNet(net){
      // net = gross - (FEE_FIXED + FEE_PCT * gross)
      // => gross * (1 - FEE_PCT) = net + FEE_FIXED
      // => gross = (net + FEE_FIXED) / (1 - FEE_PCT)
      return (net + FEE_FIXED) / (1 - FEE_PCT);
    }

    function refreshUI(){
      $err.textContent = '';
      let net = parseFloat(($amount.value||'').replace(',','.'));
      if (!isFinite(net)) net = 0;
      if (net < parseFloat($amount.min)) net = parseFloat($amount.min);
      // brut necesar
      let gross = computeGrossFromNet(net);
      // taxă (diferența dintre brut și net)
      let fee = gross - net;

      // rotunjiri UI
      gross = Math.round(gross*100)/100;
      fee   = Math.max(0, Math.round(fee*100)/100);

      $fee.textContent   = fmt(fee);
      $gross.textContent = fmt(gross);
      // text buton
      $go.textContent = `Continuă către plată (${fmt(gross)})`;
      // setează pe dataset ca să nu refacem calcule la submit
      $go.dataset.net   = net.toFixed(2);
      $go.dataset.gross = gross.toFixed(2);
      $go.dataset.fee   = fee.toFixed(2);
    }

    $amount.addEventListener('input', refreshUI);
    $amount.addEventListener('change', refreshUI);
    window.addEventListener('DOMContentLoaded', refreshUI);

    // Enter = click
    $amount.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); $go.click(); }});

    $go.addEventListener('click', async ()=>{
      $err.textContent = '';
      let gross = parseFloat($go.dataset.gross || '0');
      let net   = parseFloat($go.dataset.net   || '0');
      let fee   = parseFloat($go.dataset.fee   || '0');
      if (!isFinite(gross) || gross <= 0){ $err.textContent = 'Te rugăm să introduci o sumă validă.'; return; }

      // Protecții minime
      if (gross < 0.50){ $err.textContent = 'Suma minimă de plată este 0,50 EUR.'; return; }

      $go.disabled = true;
      $go.textContent = 'Se inițiază plata…';

      try{
        const res = await fetch('/api/stripe/create_checkout_session.php', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            // Trimitem BRUTUL către server (Checkout va debita această sumă)
            amount_eur: gross,
            currency: CURRENCY,
            // Informații adiționale (serverul poate să le ignore sau să le valideze)
            desired_net_eur: net,
            fee_estimate_eur: fee,
            ui_fee_model: { pct: FEE_PCT, fixed: FEE_FIXED }
          })
        });

        // Încearcă să parsezi JSON (dacă nu e JSON, aruncă o eroare generică)
        let j = {};
        try { j = await res.json(); } catch(_) {}

        if (!res.ok || !j.ok) {
          throw new Error(j.message || j.error || `Eroare (${res.status})`);
        }
        if (j.url) {
          window.location = j.url;
        } else {
          throw new Error('Răspuns invalid de la server.');
        }
      } catch (e){
        console.error(e);
        $err.textContent = 'A apărut o eroare, te rog încearcă din nou.';
        $go.disabled = false;
        refreshUI();
      }
    });
  </script>
</body>
</html>
