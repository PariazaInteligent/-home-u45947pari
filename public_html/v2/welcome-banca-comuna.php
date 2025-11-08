<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>PARIAZA INTELIGENT — Welcome</title>
  <meta name="theme-color" content="#ffffff" />
  <style>
    :root{
      --ink:#0b0b0b;
      --muted:#475569; /* text gri închis pentru legal */
      --mint:#2dd4bf;  /* turcoaz / verde mentă principal */
      --mint-600:#14b8a6; /* accente / contur planetă */
      --petrol:#0f766e;   /* buton email */
      --sky:#67e8f9;      /* puncte confetti */
      --ring:#64748b;     /* culoare neutră pentru inele planete mici */
      --rose:#fecdd3;     /* obraji fantomiță */
      --purple:#a78bfa;   /* planetă mică mov */
      --yellow:#fde68a;   /* planetă mică galbenă */
      --focus:#06b6d4;    /* turcoaz linkuri */
      --radius-pill:9999px;
      --maxw: 430px;      /* telefon vertical */
    }

    /* Fundal alb cu "confetti" turcoaz discret */
    html,body{ height:100%; }
    body{
      margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
      color:var(--ink); background:#fff;
      background-image: radial-gradient(var(--sky) 0.8px, transparent 0.8px);
      background-size: 16px 16px; /* puncte mici răsfirate */
      -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
    }

    /* Layout pe înălțimea ecranului — 3 zone */
    .wrap{
      height:100dvh; max-width:var(--maxw); margin:0 auto; position:relative;
      display:grid; grid-template-rows: auto 1fr auto; padding:16px 18px 18px; box-sizing:border-box;
    }

    /* 1) Titlu & subtitlu sus */
    .brand{
      text-align:center; padding-top:8px; letter-spacing:0.3px;
    }
    .brand h1{ margin:0; font-size:28px; line-height:1.05; font-weight:800; letter-spacing:0.6px; }
    .brand h1 span{ display:block; }
    .brand h2{ margin:8px 0 0; font-size:16px; font-weight:800; letter-spacing:0.4px; }

    /* 2) Ilustrația centrală */
    .scene{
      position:relative; display:flex; align-items:center; justify-content:center;
      /* rezervăm spațiu generos; planeta ocupă jumătatea de jos */
      min-height: 360px;  /* se adaptează pe telefoane mici */
    }
    .scene svg{ width:100%; max-width:var(--maxw); height:auto; display:block; }

    /* 3) Zona CTA jos — stă "pe" planetă (ușor suprapusă) */
    .cta{
      position:relative; margin-top:-90px; /* împinge în sus peste calota planetei */
      z-index:2; display:flex; flex-direction:column; gap:10px;
    }

    .btn{ appearance:none; border:0; cursor:pointer; width:100%;
      display:flex; align-items:center; justify-content:center; gap:12px;
      padding:14px 18px; border-radius:var(--radius-pill);
      font-size:14px; font-weight:800; letter-spacing:0.3px;
      transition: transform .06s ease, filter .2s ease; text-decoration:none; color:var(--ink);
    }
    .btn:active{ transform: translateY(1px) scale(.995); }
    .btn:focus-visible{ outline:2px solid var(--focus); outline-offset:2px; }

    .btn-google{ background: #9ff1e7; } /* turcoaz deschis */
    .btn-email{ background: var(--petrol); color: #f1f5f9; }

    .btn .icon{ width:24px; height:24px; border-radius:50%; background:#fff; display:grid; place-items:center; flex:0 0 24px; }
    .btn-email .icon{ background:#0b3e3a; } /* cerc mai închis sub plic */

    .legal{ margin-top:6px; font-size:11px; line-height:1.4; color:var(--muted); text-align:center; }
    .legal a{ color:var(--focus); font-weight:700; text-decoration:none; }
    .legal a:hover{ text-decoration:underline; }

    .lang{ margin-top:10px; display:flex; justify-content:center; }
    .lang select{
      border:1.5px solid #e2e8f0; background:#fff; color:#0f172a; border-radius:14px;
      padding:8px 12px; font-size:13px; font-weight:700; letter-spacing:0.2px;
    }

    /* Utilitare mici */
    .visually-hidden{ position:absolute !important; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

    /* Siguranță pentru ecrane foarte scurte (iPhone SE) */
    @media (max-height: 640px){
      .scene{ min-height:300px; }
      .cta{ margin-top:-70px; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <!-- 1) TITLU + SUBTITLU -->
    <header class="brand">
      <h1 id="t-title" data-i18n="title"><span>PARIAZA INTELIGENT</span></h1>
      <h2 id="t-sub" data-i18n="subtitle">BANCA COMUNĂ DE INVESTIȚII</h2>
    </header>

    <!-- 2) ILUSTRAȚIE CENTRALĂ: planetă turcoaz + fantomiță kawaii + plante + antenă + planete mici -->
    <section class="scene" aria-label="Ilustrație spațiu prietenos">
      <svg viewBox="0 0 430 420" role="img" aria-labelledby="svgTitle svgDesc" xmlns="http://www.w3.org/2000/svg">
        <title id="svgTitle">Planetă turcoaz cu fantomiță drăguță</title>
        <desc id="svgDesc">O planetă turcoaz tăiată de marginea de jos, cu fantomiță albă zâmbitoare, plante stilizate și un turn cu antenă. Pe cer plutesc planete mici colorate.</desc>

        <!-- Cer alb (transparență, păstrăm fundalul din body) -->
        <rect x="0" y="0" width="430" height="420" fill="transparent"/>

        <!-- Planete mici plutitoare -->
        <g opacity="0.95">
          <!-- mică verde cu inel -->
          <g transform="translate(44,54)">
            <circle cx="0" cy="0" r="12" fill="#7eeadf" stroke="#0ea5a5" stroke-width="1"/>
            <ellipse cx="0" cy="0" rx="18" ry="6" fill="none" stroke="var(--ring)" stroke-width="2"/>
          </g>
          <!-- mică mov -->
          <g transform="translate(360,90)">
            <circle cx="0" cy="0" r="10" fill="var(--purple)"/>
          </g>
          <!-- mică galbenă cu inel -->
          <g transform="translate(300,32)">
            <circle cx="0" cy="0" r="9" fill="var(--yellow)"/>
            <ellipse cx="0" cy="0" rx="14" ry="5" fill="none" stroke="var(--ring)" stroke-width="2"/>
          </g>
        </g>

        <!-- PLANETA (calotă) -->
        <g transform="translate(215,360)">
          <!-- disc mare: doar partea superioară e vizibilă în viewBox -->
          <circle cx="0" cy="120" r="180" fill="var(--mint)" stroke="var(--mint-600)" stroke-width="3"/>
          
          <!-- pete/relief stil simplu -->
          <ellipse cx="-80" cy="88" rx="34" ry="12" fill="#26cdb9"/>
          <ellipse cx="40" cy="102" rx="28" ry="10" fill="#26cdb9"/>
          <ellipse cx="90" cy="78" rx="20" ry="8" fill="#26cdb9"/>

          <!-- plante / stalagmite geometrice -->
          <g stroke="#0ea5a5" stroke-width="2" fill="#1ecfb8">
            <path d="M-120,120 v-38 q10-10 20,0 v38 z"/>
            <path d="M-95,120 v-24 q8-8 16,0 v24 z"/>
            <path d="M-60,120 v-30 q10-12 20,0 v30 z"/>
            <path d="M20,120 v-34 q9-11 18,0 v34 z"/>
            <path d="M48,120 v-22 q7-9 14,0 v22 z"/>
            <path d="M75,120 v-40 q11-12 22,0 v40 z"/>
          </g>

          <!-- turn / antenă tehnologică -->
          <g transform="translate(120,40)">
            <rect x="-3" y="0" width="6" height="48" rx="3" fill="#0ea5a5"/>
            <circle cx="0" cy="-8" r="10" fill="#1c8fa0" />
            <circle cx="0" cy="-8" r="5" fill="#e2f7f9" />
            <!-- brațe subțiri -->
            <path d="M0,18 L16,6" stroke="#0ea5a5" stroke-width="2" stroke-linecap="round"/>
            <path d="M0,26 L-16,16" stroke="#0ea5a5" stroke-width="2" stroke-linecap="round"/>
          </g>

          <!-- fantomiță kawaii -->
          <g transform="translate(0,30)">
            <!-- corp -->
            <path d="M -35 60 q 0 -40 35 -40 q 35 0 35 40 q 0 30 -70 30 q -10 -4 -20 0 q 0 -16 20 -30 z"
                  fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
            <!-- margine ondulată de jos (picături) -->
            <path d="M-35,90 q8,6 16,0 q8,-6 16,0 q8,6 16,0 q8,-6 16,0" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
            <!-- ochi -->
            <circle cx="-12" cy="62" r="5" fill="#0b0b0b"/>
            <circle cx="12" cy="62" r="5" fill="#0b0b0b"/>
            <!-- obraji -->
            <ellipse cx="-22" cy="72" rx="8" ry="4" fill="var(--rose)" opacity="0.7"/>
            <ellipse cx="22" cy="72" rx="8" ry="4" fill="var(--rose)" opacity="0.7"/>
            <!-- zâmbet fin -->
            <path d="M -10 76 q 10 6 20 0" stroke="#0b0b0b" stroke-width="2" fill="none" stroke-linecap="round"/>
          </g>
        </g>
      </svg>
    </section>

    <!-- 3) CTA + legal + selector limbă -->
    <section class="cta" aria-label="Autentificare">
      <a class="btn btn-google" href="/api/auth/google/start" data-provider="google" id="btnGoogle" data-i18n="btnGoogle">
        <span class="icon" aria-hidden="true">
          <!-- Google G multicolor (SVG simplificat) -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M21.35 12.2c0-.7-.06-1.37-.17-2H12v3.79h5.27a4.5 4.5 0 01-1.95 2.96v2.46h3.16c1.85-1.7 2.87-4.2 2.87-7.01z" fill="#4285F4"/>
            <path d="M12 22c2.6 0 4.78-.86 6.37-2.33l-3.16-2.46c-.88.59-2  .94-3.21.94-2.47 0-4.56-1.67-5.31-3.92H3.4v2.47A10 10 0 0012 22z" fill="#34A853"/>
            <path d="M6.69 14.23A6 6 0 016.38 12c0-.77.14-1.52.31-2.23V7.3H3.4A10 10 0 002 12c0 1.61.38 3.13 1.4 4.7l3.29-2.47z" fill="#FBBC05"/>
            <path d="M12 5.5c1.42 0 2.7.49 3.7 1.44l2.78-2.79C16.76 2.8 14.6 2 12 2A10 10 0 002 7.3l3.29 2.47C6.04 7.52 8.13 5.5 12 5.5z" fill="#EA4335"/>
          </svg>
        </span>
        <span class="txt">CONTINUĂ CU GOOGLE</span>
      </a>

      <a class="btn btn-email" href="/v1/login.html" id="btnEmail" data-i18n="btnEmail">
        <span class="icon" aria-hidden="true">
          <!-- plic într-un cerc mic -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="#134e4a"/>
            <path d="M7 9h10v6H7z" fill="#e2f7f9"/>
            <path d="M7 9l5 4 5-4" stroke="#134e4a" stroke-width="1.5" fill="none"/>
          </svg>
        </span>
        <span class="txt">CONTINUĂ CU EMAIL</span>
      </a>

      <p class="legal" id="legalText">
        Odată ce te conectezi, îți exprimi acordul cu privire la…
        <a href="/v1/terms.html" data-i18n="linkTerms">Condițiile noastre</a>
        și
        <a href="/v1/privacy.html" data-i18n="linkPrivacy">Politica de confidențialitate</a>.
      </p>

      <div class="lang" aria-label="Selector limbă">
        <label for="langSel" class="visually-hidden">Limbă</label>
        <select id="langSel" aria-describedby="legalText">
          <option value="ro" selected>Română</option>
          <option value="en">English</option>
          <option value="it">Italiano</option>
        </select>
      </div>
    </section>
  </main>

  <script>
    // Mini i18n — doar pentru textele de pe ecran (RO/EN/IT)
    const L = {
      ro: {
        title: 'PARIAZA INTELIGENT',
        subtitle: 'BANCA COMUNĂ DE INVESTIȚII',
        btnGoogle: 'CONTINUĂ CU GOOGLE',
        btnEmail: 'CONTINUĂ CU EMAIL',
        legal: 'Odată ce te conectezi, îți exprimi acordul cu privire la…',
        linkTerms: 'Condițiile noastre',
        linkPrivacy: 'Politica de confidențialitate'
      },
      en: {
        title: 'PARIAZA INTELIGENT',
        subtitle: 'COMMUNITY INVESTMENT BANK',
        btnGoogle: 'CONTINUE WITH GOOGLE',
        btnEmail: 'CONTINUE WITH EMAIL',
        legal: 'By signing in, you agree to our…',
        linkTerms: 'Terms & Conditions',
        linkPrivacy: 'Privacy Policy'
      },
      it: {
        title: 'PARIAZA INTELIGENT',
        subtitle: 'BANCA COMUNE DI INVESTIMENTO',
        btnGoogle: 'CONTINUA CON GOOGLE',
        btnEmail: 'CONTINUA CON EMAIL',
        legal: 'Accedendo, dichiari di accettare…',
        linkTerms: 'Termini e Condizioni',
        linkPrivacy: 'Informativa sulla Privacy'
      }
    };

    const elTitle = document.getElementById('t-title');
    const elSub   = document.getElementById('t-sub');
    const elBtnG  = document.getElementById('btnGoogle');
    const elBtnE  = document.getElementById('btnEmail');
    const elLegal = document.getElementById('legalText');
    const sel     = document.getElementById('langSel');

    function applyLang(lang){
      const t = L[lang] || L.ro;
      elTitle.textContent = t.title;
      elSub.textContent   = t.subtitle;
      elBtnG.querySelector('.txt').textContent = t.btnGoogle;
      elBtnE.querySelector('.txt').textContent = t.btnEmail;

      // reconstruiți parțial textul legal ca să păstrăm linkurile
      elLegal.childNodes[0].nodeValue = t.legal + ' ';
      elLegal.querySelector('[data-i18n="linkTerms"]').textContent   = t.linkTerms;
      elLegal.querySelector('[data-i18n="linkPrivacy"]').textContent = t.linkPrivacy;
      document.documentElement.lang = lang;
    }

    sel.addEventListener('change', (e)=> applyLang(e.target.value));

    // respectă setarea din URL ?lang=it | en | ro
    (function init(){
      const params = new URLSearchParams(location.search);
      const lng = params.get('lang');
      if (lng && L[lng]) { sel.value = lng; }
      applyLang(sel.value);
    })();

    // (opțional) exemple pentru integrarea autentificărilor
    document.getElementById('btnGoogle').addEventListener('click', (e)=>{
      // lăsăm linkul să meargă la /api/auth/google/start
      // dacă vrei să previi dublu click:
      e.currentTarget.style.filter='brightness(.95)';
    });
  </script>
</body>
</html>
