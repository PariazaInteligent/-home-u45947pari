<?php 
// /admin/index.php — Panou Admin + Flux Retrageri (aprobare / respingere / payout simulată)
//
// UPDATE-URI ÎN ACEASTĂ VERSIUNE
// - Pentru fiecare cerere PENDING: afișăm Numele titularului + IBAN (vizibile pentru admin) + butoane 1-click „Copiază nume/IBAN”.
// - Secțiune nouă „Istoricul retragerilor” cu TOATE retragerile Approved/Rejected (ultimele 500), cu copy la nume/IBAN și detalii payout.
// - Mic utilitar JS pentru copiere + feedback vizual „Copiat!”.
//
// IMPORTANT
// - Butoanele "Aprobă" / "Respinge" trimit POST în aceeași pagină, cu CSRF.
// - "Aprobă":
//      * încearcă să trimită banii (sendBankTransfer())
//      * dacă payout-ul reușește:
//          - withdrawal_requests.status='approved', processed_at=NOW(),
//            payout_status='sent', payout_reference='...'
//          - ledger_tx => WITHDRAWAL / APPROVED (nu modifică din nou soldul, doar marchează evenimentul finalizat)
//      * dacă payout-ul eșuează:
//          - withdrawal_requests rămâne pending, payout_status='failed', payout_error='...'
//          - NU dăm drumul la bani, NU aprobăm
// - "Respinge":
//      * withdrawal_requests.status='rejected', processed_at=NOW()
//      * ledger_tx => WITHDRAWAL_REQUEST / REJECTED cu + (amount+fee), eliberând fondurile blocate
//
// Presupuneri de schemă (trebuie să existe deja):
//
//  users: payout_name, payout_iban, payout_bic, payout_currency
//  withdrawal_requests: payout_provider, payout_reference, payout_status, payout_error, processed_at
//  ledger_tx: vezi discuțiile anterioare
//
// Atenție: sendBankTransfer() este un stub care întoarce succes "simulat".
// În producție, acolo trebuie integrat adevăratul provider bancar / Wise / Revolut Business etc.
//

session_start();
if (empty($_SESSION['user'])) { header('Location: /v1/login.html'); exit; }
$me   = $_SESSION['user'];
$role = strtoupper($me['role'] ?? 'USER');
if ($role !== 'ADMIN') { header('Location: /user/'); exit; }

// DB
require __DIR__ . '/../api/db.php';

// CSRF bootstrap
if (empty($_SESSION['csrf_token'])) {
  $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
}
$csrf_token = $_SESSION['csrf_token'];

// Helpers
function safe($v){ return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function n($v){ return number_format((float)$v, 0, ',', '.'); }
function time_ago($ts){
  $t = is_numeric($ts) ? (int)$ts : strtotime($ts ?: '');
  if (!$t) return '-';
  $d = time() - $t;
  if ($d < 60)   return $d . 's';
  if ($d < 3600) return floor($d/60).'m';
  if ($d < 86400)return floor($d/3600).'h';
  return floor($d/86400).'z';
}
function eur_from_cents($c){
  $c = (int)$c;
  $val = $c / 100.0;
  // format 1.234,56 €
  return number_format($val, 2, ',', '.') . ' €';
}
function mask_iban($iban){
  $iban = trim((string)$iban);
  if ($iban === '') return '—';
  $len = strlen($iban);
  if ($len <= 8) return $iban;
  return substr($iban,0,4) . '****' . substr($iban,-4);
}

// Stub payout function (în producție înlocuiești cu integrarea reală Revolut/Wise/etc.)
function sendBankTransfer($benefName, $iban, $bic, $amount_eur, $currency='EUR'){
  // validări minime
  if (!$benefName || !$iban || $amount_eur <= 0) {
    return [false, null, "date payout incomplete"];
  }

  // Aici, în producție:
  // - construiești payload
  // - faci cURL către provider-ul tău de plăți
  // - verifici răspunsul
  //
  // Pentru demo: simulăm că plata a mers și întoarcem un id unic
  $fakeRef = 'PI-' . bin2hex(random_bytes(4));
  return [true, $fakeRef, null];
}

// ---------------------------------------------------------
// POST actions: approve / reject retragere
// ---------------------------------------------------------
$flashMsg = null;
$flashErr = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  try {
    // securitate bazică
    if (empty($_POST['csrf']) || !hash_equals($_SESSION['csrf_token'], $_POST['csrf'] ?? '')) {
      throw new RuntimeException('CSRF invalid');
    }

    $action     = $_POST['action']     ?? '';
    $request_id = (int)($_POST['request_id'] ?? 0);
    if ($request_id <= 0) {
      throw new RuntimeException('ID cerere lipsă/invalid');
    }

    if ($action === 'approve') {
      // 1. citim cererea + info payout user
      $st = $pdo->prepare("
  SELECT wr.*,
         u.email,
         COALESCE(pp.holder_name, u.payout_name)   AS payout_name,
         COALESCE(pp.iban,        u.payout_iban)   AS payout_iban,
         u.payout_bic                                  AS payout_bic,
         COALESCE(pp.currency, u.payout_currency, 'EUR') AS payout_currency
  FROM withdrawal_requests wr
  JOIN users u ON u.id = wr.user_id           -- aici păstrăm JOIN: pentru approve e critic să existe userul
  LEFT JOIN payout_profiles pp ON pp.user_id = wr.user_id
  WHERE wr.id = ?
  LIMIT 1
");



      $st->execute([$request_id]);
      $wr = $st->fetch(PDO::FETCH_ASSOC);

      if (!$wr) {
        throw new RuntimeException('Cererea nu există');
      }
      if ($wr['status'] !== 'pending') {
        throw new RuntimeException('Cererea nu mai este în status PENDING');
      }

      // suma netă care trebuie să ajungă la utilizator
      $amount_user_eur = ((int)$wr['amount_cents']) / 100.0;
      $currency        = $wr['payout_currency'] ?: 'EUR';

      // 2. încercăm payout real (deocamdată simulare)
      list($ok, $providerRef, $errMsg) = sendBankTransfer(
        $wr['payout_name'],
        $wr['payout_iban'],
        $wr['payout_bic'],
        $amount_user_eur,
        $currency
      );

      if (!$ok) {
        // marcăm încercarea eșuată, dar nu aprobăm cererea
        $st2 = $pdo->prepare("\n          UPDATE withdrawal_requests\n          SET payout_status='failed',\n              payout_error=?\n          WHERE id=? LIMIT 1\n        ");
        $st2->execute([$errMsg, $request_id]);

        throw new RuntimeException("Eroare payout: ".$errMsg);
      }

      // 3. payout acceptat de provider -> actualizăm DB atomic
      $pdo->beginTransaction();
      try {
        // a) marcăm cererea ca aprobată și plătită
        $st3 = $pdo->prepare("\n          UPDATE withdrawal_requests\n          SET status='approved',\n              processed_at=NOW(),\n              payout_provider='bank-api',\n              payout_reference=?,\n              payout_status='sent',\n              payout_error=NULL\n          WHERE id=? LIMIT 1\n        ");
        $st3->execute([$providerRef, $request_id]);

        // b) ledger: marcăm evenimentul WITHDRAWAL finalizat
        // notă: amount_cents = 0 ca să nu mai modificăm soldul (a fost deja blocat la cerere)
        $st4 = $pdo->prepare("\n          INSERT INTO ledger_tx\n            (user_id, kind, status, amount_cents, method, meta)\n          VALUES\n            (:uid, 'WITHDRAWAL', 'APPROVED', 0, :method,\n             JSON_OBJECT('request_id', :rid, 'payout_reference', :pref))\n        ");
        $st4->execute([
          ':uid'    => $wr['user_id'],
          ':method' => $wr['method'] ?? 'bank-transfer',
          ':rid'    => $request_id,
          ':pref'   => $providerRef,
        ]);

        $pdo->commit();
        $flashMsg = "Retragere aprobată & payout inițiat (#{$providerRef}).";
        $flashErr = false;
      } catch (Throwable $txe) {
        $pdo->rollBack();
        throw $txe;
      }

    } elseif ($action === 'reject') {
      // respingem cererea => eliberăm banii blocați
      $st = $pdo->prepare("SELECT * FROM withdrawal_requests WHERE id=? LIMIT 1");
      $st->execute([$request_id]);
      $wr = $st->fetch(PDO::FETCH_ASSOC);

      if (!$wr) {
        throw new RuntimeException('Cererea nu există');
      }
      if ($wr['status'] !== 'pending') {
        throw new RuntimeException('Cererea nu mai este în status PENDING');
      }

      $user_id         = (int)$wr['user_id'];
      $blocked_cents   = (int)$wr['amount_cents'] + (int)$wr['fee_cents'];
      $method          = $wr['method'] ?? 'bank-transfer';

      $pdo->beginTransaction();
      try {
        // 1. marcăm retragerea ca respinsă
        $st1 = $pdo->prepare("\n          UPDATE withdrawal_requests\n          SET status='rejected',\n              processed_at=NOW(),\n              payout_status=NULL,\n              payout_provider=NULL,\n              payout_reference=NULL,\n              payout_error=NULL\n          WHERE id=? LIMIT 1\n        ");
        $st1->execute([$request_id]);

        // 2. ledger_tx: punem banii blocați înapoi (pozitiv)
        $st2 = $pdo->prepare("\n          INSERT INTO ledger_tx\n            (user_id, kind, status, amount_cents, method, meta)\n          VALUES\n            (:uid, 'WITHDRAWAL_REQUEST', 'REJECTED', :amt, :method,\n             JSON_OBJECT('request_id', :rid))\n        ");
        $st2->execute([
          ':uid'    => $user_id,
          ':amt'    => $blocked_cents,
          ':method' => $method,
          ':rid'    => $request_id,
        ]);

        $pdo->commit();
        $flashMsg = "Cererea #{$request_id} a fost respinsă. Fondurile au fost eliberate.";
        $flashErr = false;
      } catch (Throwable $txe) {
        $pdo->rollBack();
        throw $txe;
      }

    } else {
      throw new RuntimeException('Acțiune necunoscută');
    }

  } catch (Throwable $e) {
    $flashMsg = "Eroare: ".$e->getMessage();
    $flashErr = true;
  }
}

// ---------------------------------------------------------
// Metrics + date pentru UI
// ---------------------------------------------------------
$kpi = [
  'total_users'          => 0,
  'active_users'         => 0,
  'admins'               => 0,
  'tokens_active'        => 0,
  'tokens_expiring_72h'  => 0,
];

$latest_users  = [];
$latest_tokens = [];
$pending_wd    = []; // cereri de retragere pending
$history_wd    = []; // cereri procesate (approved/rejected)

try {
  $kpi['total_users'] = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
  $kpi['active_users'] = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE is_active=1")->fetchColumn();
  $kpi['admins'] = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE UPPER(role)='ADMIN'")->fetchColumn();
  $kpi['tokens_active'] = (int)$pdo->query("SELECT COUNT(*) FROM remember_tokens WHERE expires_at > NOW()")
                                 ->fetchColumn();
  $kpi['tokens_expiring_72h'] = (int)$pdo->query("\n    SELECT COUNT(*) FROM remember_tokens\n    WHERE expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 72 HOUR)\n  ")->fetchColumn();

  $q1 = $pdo->query("\n    SELECT id,email,role,is_active,created_at\n    FROM users\n    ORDER BY created_at DESC, id DESC\n    LIMIT 8\n  ");
  $latest_users = $q1->fetchAll(PDO::FETCH_ASSOC);

  $q2 = $pdo->query("\n    SELECT rt.id, rt.selector, rt.expires_at, rt.created_at, u.email\n    FROM remember_tokens rt\n    JOIN users u ON u.id=rt.user_id\n    ORDER BY rt.created_at DESC\n    LIMIT 8\n  ");
  $latest_tokens = $q2->fetchAll(PDO::FETCH_ASSOC);

  // pending withdrawals
  $q3 = $pdo->query("
  SELECT wr.*,
         u.email,
         COALESCE(pp.holder_name, u.payout_name) AS payout_name,
         COALESCE(pp.iban,        u.payout_iban) AS payout_iban,
         u.payout_bic AS payout_bic
  FROM withdrawal_requests wr
  LEFT JOIN users u ON u.id = wr.user_id            -- LEFT JOIN ca să apară chiar dacă userul lipsește
  LEFT JOIN payout_profiles pp ON pp.user_id = wr.user_id
  WHERE wr.status = 'pending'
  ORDER BY wr.created_at ASC
");



  $pending_wd = $q3->fetchAll(PDO::FETCH_ASSOC);

  // history: approved + rejected (ultimele 500)
  $q4 = $pdo->query("
  SELECT wr.*,
         u.email,
         COALESCE(pp.holder_name, u.payout_name) AS payout_name,
         COALESCE(pp.iban,        u.payout_iban) AS payout_iban,
         u.payout_bic AS payout_bic
  FROM withdrawal_requests wr
  LEFT JOIN users u ON u.id = wr.user_id            -- LEFT JOIN pentru istoricul complet
  LEFT JOIN payout_profiles pp ON pp.user_id = wr.user_id
  WHERE wr.status IN ('approved','rejected')
  ORDER BY wr.processed_at DESC, wr.id DESC
  LIMIT 500
");



  $history_wd = $q4->fetchAll(PDO::FETCH_ASSOC);

} catch (Throwable $e) {
  // dacă explodează, lăsăm arrays goale
}

$phpv = PHP_VERSION;
$dbn  = $pdo->query('SELECT DATABASE()')->fetchColumn();
$pending_count = count($pending_wd);
$history_count = count($history_wd);
?>
<!DOCTYPE html>
<html lang="ro" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin — Pariază Inteligent</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <style>
    html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    .enigma-grid {
      position: fixed; inset: 0; overflow: hidden; pointer-events: none;
      background:
        radial-gradient(1400px 700px at 80% -10%, rgba(56,189,248,.25), transparent 60%),
        radial-gradient(1200px 600px at 10% 110%, rgba(20,184,166,.18), transparent 55%),
        linear-gradient(rgba(2,6,23,.9), rgba(2,6,23,.9));
    }
    .grid-lines::before,
    .grid-lines::after {
      content:""; position:absolute; inset:-200% -200%;
      background-image:
        linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,.06) 1px, transparent 1px);
      background-size: 60px 60px, 60px 60px;
      transform: translate3d(0,0,0);
      animation: drift 30s linear infinite;
    }
    .grid-lines::after { filter: blur(1px); opacity:.6; animation-duration:60s; }
    @keyframes drift { to { transform: translate3d(60px,60px,0); } }
    .particle {
      position:absolute; width:3px; height:3px; border-radius:9999px;
      background: rgba(255,255,255,.45);
      filter: drop-shadow(0 0 6px rgba(56,189,248,.65));
      animation: float 12s ease-in-out infinite;
    }
    @keyframes float {
      0%,100% { transform: translateY(0) translateX(0);} 
      50%     { transform: translateY(-25px) translateX(10px);} 
    }
    .glow {
      box-shadow: 0 10px 30px rgba(34,211,238,.25),
                  inset 0 0 0 1px rgba(255,255,255,.06);
    }
    .card-hover { transition: transform .25s ease, box-shadow .25s ease; }
    .card-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 45px rgba(0,0,0,.35);
    }
    .nice-scroll::-webkit-scrollbar{ width:8px;} 
    .nice-scroll::-webkit-scrollbar-thumb{ 
      background:rgba(255,255,255,.15); border-radius:8px;
    }
    .copy-badge{ font-size:10px; padding:2px 6px; border-radius:9999px; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.06); }
    .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100">
  <!-- Decorative BG -->
  <div class="enigma-grid grid-lines">
    <span class="particle" style="top:10%;left:15%;animation-delay:.2s"></span>
    <span class="particle" style="top:30%;left:70%;animation-delay:1.2s"></span>
    <span class="particle" style="top:65%;left:25%;animation-delay:.6s"></span>
    <span class="particle" style="top:80%;left:60%;animation-delay:2s"></span>
    <span class="particle" style="top:45%;left:43%;animation-delay:.9s"></span>
  </div>

  <?php if ($flashMsg !== null): ?>
    <div class="fixed top-4 right-4 z-[999]">
      <div class="px-3 py-2 rounded-xl text-sm border
        <?= $flashErr
            ? 'border-rose-400/40 bg-rose-900/40 text-rose-100'
            : 'border-emerald-400/40 bg-emerald-900/30 text-emerald-100'
        ?>">
        <?= safe($flashMsg) ?>
      </div>
    </div>
  <?php endif; ?>

  <!-- Topbar -->
  <header class="relative z-10">
    <div class="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
      <a href="/" class="flex items-center gap-3">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-extrabold glow">PI</span>
        <div>
          <div class="font-semibold">Pariază Inteligent</div>
          <div class="text-xs text-slate-400 -mt-0.5">Banca Comună — Admin</div>
        </div>
      </a>
      <nav class="flex items-center gap-3 text-sm">
        <a href="/user/" class="hover:underline text-slate-300">User</a>
        <a href="/logout.php" class="text-rose-300 hover:underline">Deconectare</a>
      </nav>
    </div>
  </header>

  <!-- Hero header -->
  <section class="relative z-10">
    <div class="max-w-7xl mx-auto px-4">
      <div class="rounded-3xl p-0.5 bg-gradient-to-br from-blue-600/40 via-cyan-500/30 to-teal-400/40 glow">
        <div class="rounded-3xl bg-slate-900/80 backdrop-blur p-6 md:p-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex items-center gap-4">
              <span class="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center text-slate-900 font-extrabold glow">PI</span>
              <div>
                <h1 class="text-2xl md:text-3xl font-extrabold leading-tight">
                  Panou de control — Admin
                </h1>
                <p class="text-sm text-slate-400">
                  Salut, <span class="font-semibold"><?=safe($me['email'])?></span>
                  • DB: <span class="font-mono"><?=safe($dbn)?></span>
                  • PHP <?=safe($phpv)?>
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <a href="?export=users"
                 class="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-white text-slate-900 font-semibold border border-white/20 hover:opacity-95">
                <i class="fa-regular fa-file-lines"></i>
                <span>Export utilizatori</span>
              </a>
              <a href="/v1/login.html"
                 class="inline-flex items-center gap-2 rounded-2xl px-4 py-2 border border-white/10 hover:border-white/20">
                <i class="fa-solid fa-right-to-bracket"></i>
                <span>Pagina login</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- KPI cards -->
  <section class="relative z-10 mt-6">
    <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <?php
        $kpi_cards = [
          ['label'=>'Utilizatori','icon'=>'fa-users','value'=>$kpi['total_users']],
          ['label'=>'Activi','icon'=>'fa-user-check','value'=>$kpi['active_users']],
          ['label'=>'Admini','icon'=>'fa-user-shield','value'=>$kpi['admins']],
          ['label'=>'Remember active','icon'=>'fa-cookie-bite','value'=>$kpi['tokens_active']],
          ['label'=>'Expiră < 72h','icon'=>'fa-hourglass-half','value'=>$kpi['tokens_expiring_72h']],
        ];
        foreach ($kpi_cards as $c):
      ?>
        <div class="rounded-2xl p-0.5 bg-gradient-to-br from-blue-600/30 via-cyan-500/25 to-teal-400/30 glow card-hover">
          <div class="rounded-2xl bg-slate-900/80 backdrop-blur p-5">
            <div class="text-slate-400 text-xs mb-1"><?=safe($c['label'])?></div>
            <div class="flex items-center justify-between">
              <div class="text-2xl font-extrabold"
                   data-kpi="num"
                   data-target="<?= (int)$c['value']?>">0</div>
              <i class="fa-solid <?=safe($c['icon'])?> text-xl text-slate-300"></i>
            </div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </section>

  <!-- Pending withdrawals management -->
  <section class="relative z-10 mt-6">
    <div class="max-w-7xl mx-auto px-4">
      <div class="rounded-3xl p-0.5 bg-gradient-to-br from-blue-600/30 via-cyan-500/20 to-teal-400/20 glow">
        <div class="rounded-3xl bg-slate-900/80 backdrop-blur p-6">
          <div class="flex flex-wrap items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-100 flex items-center gap-2">
              Cereri de retragere în așteptare
              <span class="text-[10px] leading-none px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                <?= $pending_count ?> pending
              </span>
            </h2>
            <div class="text-[11px] text-slate-500 leading-snug text-right max-w-[320px]">
              <div><strong>Aprobă</strong> = bani pleacă din bancă.</div>
              <div><strong>Respinge</strong> = cererea devine "respinsă", iar suma + taxa revin în soldul utilizatorului.</div>
            </div>
          </div>

          <?php if ($pending_count === 0): ?>
            <div class="text-sm text-slate-400">
              Nu există cereri pending ✅
            </div>
          <?php else: ?>
            <div class="overflow-x-auto nice-scroll">
              <table class="min-w-full text-sm">
                <thead class="text-slate-400 text-[11px] uppercase tracking-wide">
                  <tr>
                    <th class="text-left py-2 pr-4">User</th>
                    <th class="text-left py-2 pr-4">Sumă</th>
                    <th class="text-left py-2 pr-4">Taxă</th>
                    <th class="text-left py-2 pr-4">Total blocat</th>
                    <th class="text-left py-2 pr-4">Creat</th>
                    <th class="text-left py-2">Acțiuni</th>
                  </tr>
                </thead>
                <tbody class="align-top">
                <?php foreach ($pending_wd as $wd):
                  $amount_eur        = eur_from_cents((int)$wd['amount_cents']); // net către user
                  $fee_eur           = eur_from_cents((int)$wd['fee_cents']);
                  $total_blocked_eur = eur_from_cents((int)$wd['amount_cents'] + (int)$wd['fee_cents']);
                  $fee_rate_pct      = number_format(((float)$wd['fee_rate']*100.0), 2, ',', '.') . '%';
                  $amount_raw   = number_format(((int)$wd['amount_cents'])/100, 2, '.', ''); // ex: 10.00
  // (opțional) dacă vrei și în cenți:
  // $amount_cents_raw = (int)$wd['amount_cents']; // ex: 1000
                  $fullIban          = trim((string)$wd['payout_iban']);
                  $benefName         = trim((string)$wd['payout_name']);
                ?>
                  <tr class="border-t border-white/10 text-slate-200 align-top">
                    <td class="py-3 pr-4">
                      <div class="font-medium break-all">
  <?= safe($wd['email'] ?? ('user#'.$wd['user_id'])) ?>
</div>

                      <div class="text-[11px] text-slate-400 leading-relaxed">
                        ID user <?= (int)$wd['user_id'] ?><br/>
                        Metodă: <?= safe($wd['method'] ?: 'bank-transfer') ?>
                      </div>
                      <div class="mt-1 text-[12px] space-y-1">
  <div>
    <span class="text-slate-400">Titular:</span>
    <span class="font-medium">
      <?= ($wd['payout_name'] ?? '') !== '' ? safe($wd['payout_name']) : '—' ?>
    </span>
    <?php if (($wd['payout_name'] ?? '') !== ''): ?>
      <button type="button" class="ml-2 copy-badge" data-copy="<?=safe($wd['payout_name'])?>" title="Copiază nume">
        <i class="fa-regular fa-copy text-[10px]"></i> Copiază nume
      </button>
    <?php endif; ?>
  </div>
  <div class="mono break-all">
    <span class="text-slate-400">IBAN:</span>
    <span class="font-medium">
      <?= ($wd['payout_iban'] ?? '') !== '' ? safe($wd['payout_iban']) : '—' ?>
    </span>
    <?php if (($wd['payout_iban'] ?? '') !== ''): ?>
      <button type="button" class="ml-2 copy-badge" data-copy="<?=safe($wd['payout_iban'])?>" title="Copiază IBAN">
        <i class="fa-regular fa-copy text-[10px]"></i> Copiază IBAN
      </button>
    <?php endif; ?>
  </div>
</div>

                    </td>

                    <td class="py-3 pr-4 whitespace-nowrap">
  <div class="flex items-center gap-2">
    <span><?= $amount_eur ?></span>
    <button type="button"
            class="copy-badge"
            data-copy="<?= safe($amount_raw) ?>"
            title="Copiază sumă (EUR)">
      <i class="fa-regular fa-copy text-[10px]"></i> Copiază
    </button>
    <!-- (opțional) buton și pentru cenți:
    <button type="button" class="copy-badge" data-copy="<?= (int)$wd['amount_cents'] ?>" title="Copiază în cenți">
      c
    </button>
    -->
  </div>
  <div class="text-[11px] text-slate-400 leading-relaxed">
    fee_mode: <?= safe($wd['fee_mode']) ?>
  </div>
</td>


                    <td class="py-3 pr-4 whitespace-nowrap">
                      <div><?= $fee_eur ?></div>
                      <div class="text-[11px] text-slate-400 leading-relaxed">
                        <?= $fee_rate_pct ?>
                      </div>
                    </td>

                    <td class="py-3 pr-4 whitespace-nowrap">
                      <div><?= $total_blocked_eur ?></div>
                      <div class="text-[11px] text-slate-400 leading-relaxed">
                        blocat
                      </div>
                    </td>

                    <td class="py-3 pr-4 whitespace-nowrap">
                      <div class="text-slate-200 font-medium"><?= safe(time_ago($wd['created_at'])) ?></div>
                      <div class="text-[11px] text-slate-500 leading-relaxed"><?= safe($wd['created_at']) ?></div>
                    </td>

                    <td class="py-3 min-w-[140px]">
                      <div class="flex flex-col gap-2 text-[12px]">
                        <!-- Aprobă -->
                        <form method="POST" class="inline-block">
                          <input type="hidden" name="csrf" value="<?=safe($csrf_token)?>"/>
                          <input type="hidden" name="action" value="approve"/>
                          <input type="hidden" name="request_id" value="<?= (int)$wd['id'] ?>"/>
                          <button class="rounded-lg w-full px-3 py-1 bg-emerald-600/20 border border-emerald-500/50 text-emerald-200 flex items-center justify-center gap-1 hover:bg-emerald-600/30">
                            <i class="fa-solid fa-check text-[11px]"></i>
                            <span>Aprobă</span>
                          </button>
                        </form>

                        <!-- Respinge -->
                        <form method="POST" class="inline-block">
                          <input type="hidden" name="csrf" value="<?=safe($csrf_token)?>"/>
                          <input type="hidden" name="action" value="reject"/>
                          <input type="hidden" name="request_id" value="<?= (int)$wd['id'] ?>"/>
                          <button class="rounded-lg w-full px-3 py-1 bg-rose-600/20 border border-rose-500/50 text-rose-200 flex items-center justify-center gap-1 hover:bg-rose-600/30">
                            <i class="fa-solid fa-xmark text-[11px]"></i>
                            <span>Respinge</span>
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                <?php endforeach; ?>
                </tbody>
              </table>
            </div>

            <div class="text-[11px] text-slate-500 leading-relaxed mt-4">
              <strong>Important:</strong><br/>
              • Aprobare = marchează retragerea ca efectuată (banii ies din bancă).<br/>
              • Respingere = marchează cererea ca respinsă și pune banii (sumă + taxă) la loc în soldul utilizatorului.<br/>
              • Dacă e aprobată, intră în "Istoricul Retragerilor" la utilizator.<br/>
              • Dacă e respinsă/anulată, dispare din "Statutul Cererilor Tale".<br/>
              • /api/wallet/summary.php recalculează soldul live după fiecare acțiune.
            </div>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </section>

  <!-- Istoric retrageri (Admin) -->
  <section class="relative z-10 mt-6">
    <div class="max-w-7xl mx-auto px-4">
      <div class="rounded-3xl p-0.5 bg-gradient-to-br from-blue-600/30 via-cyan-500/25 to-teal-400/30 glow">
        <div class="rounded-3xl bg-slate-900/80 backdrop-blur p-6">
          <div class="flex flex-wrap items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-100 flex items-center gap-2">
              Istoricul retragerilor (Approved / Rejected)
              <span class="text-[10px] leading-none px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                <?= $history_count ?> înregistrări
              </span>
            </h2>
            <div class="relative">
              <input id="filterHistory" type="text" placeholder="Filtrează: email / IBAN / nume / status"
                     class="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/60 w-72"/>
              <i class="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            </div>
          </div>

          <?php if ($history_count === 0): ?>
            <div class="text-sm text-slate-400">Nu există încă retrageri procesate.</div>
          <?php else: ?>
            <div class="overflow-x-auto nice-scroll">
              <table class="min-w-full text-sm" id="historyTable">
                <thead class="text-slate-400 text-[11px] uppercase tracking-wide">
                  <tr>
                    <th class="text-left py-2 pr-4">User</th>
                    <th class="text-left py-2 pr-4">Titular & IBAN</th>
                    <th class="text-left py-2 pr-4">Sumă</th>
                    <th class="text-left py-2 pr-4">Taxă</th>
                    <th class="text-left py-2 pr-4">Status</th>
                    <th class="text-left py-2 pr-4">Payout</th>
                    <th class="text-left py-2">Procesat</th>
                  </tr>
                </thead>
                <tbody class="align-top">
                <?php foreach ($history_wd as $row):
                  $amount_eur        = eur_from_cents((int)$row['amount_cents']);
                  $fee_eur           = eur_from_cents((int)$row['fee_cents']);
                  $status            = strtolower($row['status']);
                  $pclass            = $status==='approved' ? 'text-emerald-300' : 'text-rose-300';
                  $payout_ref        = trim((string)$row['payout_reference']);
                  $payout_status     = trim((string)$row['payout_status']);
                  $payout_error      = trim((string)$row['payout_error']);
                  $benefName         = trim((string)$row['payout_name']);
                  $fullIban          = trim((string)$row['payout_iban']);
                ?>
                  <tr class="border-t border-white/10 text-slate-200 align-top">
                    <td class="py-3 pr-4">
                      <div class="font-medium break-all">
  <?= safe($row['email'] ?? ('user#'.$row['user_id'])) ?>
</div>

                      <div class="text-[11px] text-slate-400 leading-relaxed">
                        ID user <?= (int)$row['user_id'] ?><br/>
                        Metodă: <?= safe($row['method'] ?: 'bank-transfer') ?>
                      </div>
                    </td>
                    <td class="py-3 pr-4">
                      <div>
  <span class="text-slate-400">Titular:</span>
  <span class="font-medium">
    <?= ($wd['payout_name'] ?? '') !== '' ? safe($wd['payout_name']) : '—' ?>
  </span>
  <?php if (($wd['payout_name'] ?? '') !== ''): ?>
    <button type="button" class="ml-2 copy-badge" data-copy="<?=safe($wd['payout_name'])?>" title="Copiază nume">
      <i class="fa-regular fa-copy text-[10px]"></i> Copiază nume
    </button>
  <?php endif; ?>
</div>

<!-- IBAN -->
<div class="mono break-all">
  <span class="text-slate-400">IBAN:</span>
  <span class="font-medium">
    <?= ($wd['payout_iban'] ?? '') !== '' ? safe($wd['payout_iban']) : '—' ?>
  </span>
  <?php if (($wd['payout_iban'] ?? '') !== ''): ?>
    <button type="button" class="ml-2 copy-badge" data-copy="<?=safe($wd['payout_iban'])?>" title="Copiază IBAN">
      <i class="fa-regular fa-copy text-[10px]"></i> Copiază IBAN
    </button>
  <?php endif; ?>
</div>

                    </td>
                    <td class="py-3 pr-4 whitespace-nowrap"><?= $amount_eur ?></td>
                    <td class="py-3 pr-4 whitespace-nowrap"><?= $fee_eur ?></td>
                    <td class="py-3 pr-4 whitespace-nowrap">
                      <span class="<?= $pclass ?> font-semibold uppercase text-[12px]"><?= safe($row['status']) ?></span>
                    </td>
                    <td class="py-3 pr-4 min-w-[200px]">
                      <?php if ($status==='approved'): ?>
                        <div class="text-[12px]">
                          Ref: <span class="mono font-medium"><?= $payout_ref !== '' ? safe($payout_ref) : '—' ?></span>
                        </div>
                        <div class="text-[11px] text-slate-400">
                          Status: <?= $payout_status !== '' ? safe($payout_status) : '—' ?>
                        </div>
                      <?php else: ?>
                        <div class="text-[12px]">—</div>
                        <?php if ($payout_error !== ''): ?>
                          <div class="text-[11px] text-rose-300">Eroare: <?= safe($payout_error) ?></div>
                        <?php endif; ?>
                      <?php endif; ?>
                    </td>
                    <td class="py-3 whitespace-nowrap">
                      <div class="text-slate-200 font-medium"><?= $row['processed_at'] ? safe(time_ago($row['processed_at'])) : '—' ?></div>
                      <div class="text-[11px] text-slate-500 leading-relaxed"><?= $row['processed_at'] ? safe($row['processed_at']) : '' ?></div>
                    </td>
                  </tr>
                <?php endforeach; ?>
                </tbody>
              </table>
            </div>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </section>

  <!-- Main Grid: users & auth activity -->
  <section class="relative z-10 mt-6 mb-10">
    <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Latest Users -->
      <div class="lg:col-span-2 rounded-3xl p-0.5 bg-gradient-to-br from-blue-600/30 via-cyan-500/25 to-teal-400/30 glow">
        <div class="rounded-3xl bg-slate-900/80 backdrop-blur p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Utilizatori recenți</h2>
            <div class="relative">
              <input id="filterUsers"
                     type="text"
                     placeholder="Caută email/rol..."
                     class="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"/>
              <i class="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            </div>
          </div>
          <div class="overflow-auto nice-scroll">
            <table class="min-w-full text-sm">
              <thead class="text-slate-400">
                <tr>
                  <th class="text-left py-2 pr-4">Email</th>
                  <th class="text-left py-2 pr-4">Rol</th>
                  <th class="text-left py-2 pr-4">Status</th>
                  <th class="text-left py-2">Creat</th>
                </tr>
              </thead>
              <tbody id="usersTBody">
              <?php if ($latest_users): foreach ($latest_users as $u): ?>
                <tr class="border-t border-white/10">
                  <td class="py-2 pr-4 font-medium break-all"><?=safe($u['email'])?></td>
                  <td class="py-2 pr-4">
                    <span class="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs">
                      <?=safe(strtoupper($u['role']))?>
                    </span>
                  </td>
                  <td class="py-2 pr-4">
                    <?php if ((int)$u['is_active']===1): ?>
                      <span class="text-emerald-300">Activ</span>
                    <?php else: ?>
                      <span class="text-rose-300">Inactiv</span>
                    <?php endif; ?>
                  </td>
                  <td class="py-2 text-slate-300" title="<?=safe($u['created_at'])?>">
                    <?=safe(time_ago($u['created_at']))?>
                  </td>
                </tr>
              <?php endforeach; else: ?>
                <tr>
                  <td class="py-4 text-slate-400" colspan="4">
                    Nu există utilizatori înregistrați.
                  </td>
                </tr>
              <?php endif; ?>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Live Activity (Remember tokens as auth signals) -->
      <div class="rounded-3xl p-0.5 bg-gradient-to-br from-blue-600/30 via-cyan-500/25 to-teal-400/30 glow">
        <div class="rounded-3xl bg-slate-900/80 backdrop-blur p-6">
          <h2 class="text-lg font-semibold mb-4">Activitate autentificare</h2>
          <div class="space-y-3 max-h-[420px] overflow-auto nice-scroll">
            <?php if ($latest_tokens): foreach ($latest_tokens as $t): ?>
              <div class="rounded-xl border border-white/10 p-4 bg-white/5">
                <div class="text-sm font-medium break-all"><?=safe($t['email'])?></div>
                <div class="text-xs text-slate-400">
                  Token:
                  <span class="font-mono"><?=safe(substr($t['selector'],0,10))?>…</span>
                </div>
                <div class="text-xs mt-1 leading-relaxed">
                  Creat:
                  <span title="<?=safe($t['created_at'])?>">
                    <?=safe(time_ago($t['created_at']))?>
                  </span>
                  • Expiră:
                  <span title="<?=safe($t['expires_at'])?>">
                    <?=safe(time_ago($t['expires_at']))?> în urmă
                  </span>
                </div>
              </div>
            <?php endforeach; else: ?>
              <div class="text-slate-400 text-sm">Nicio activitate recentă.</div>
            <?php endif; ?>
          </div>
        </div>
      </div>
    </div>
  </section>

  <footer class="relative z-10 py-8">
    <div class="max-w-7xl mx-auto px-4 text-xs text-slate-500 text-center">
      © <span id="year"></span> Pariază Inteligent — Admin
    </div>
  </footer>

  <script>
    document.getElementById('year').textContent = new Date().getFullYear();

    // KPI count-up animation
    document.querySelectorAll('[data-kpi="num"]').forEach(el=>{
      const target = parseInt(el.getAttribute('data-target')||'0',10) || 0;
      const dur = 900;
      const start = performance.now();
      function tick(t){
        const p = Math.min(1, (t-start)/dur);
        const val = Math.floor(target * (0.2 + 0.8*Math.pow(p, 0.75)));
        el.textContent = new Intl.NumberFormat('ro-RO').format(val);
        if (p < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = new Intl.NumberFormat('ro-RO').format(target);
        }
      }
      requestAnimationFrame(tick);
    });

    // Filter utilizatori recenți
    const filter = document.getElementById('filterUsers');
    const userRows   = Array.from(document.querySelectorAll('#usersTBody tr'));
    filter?.addEventListener('input', ()=>{
      const q = (filter.value||'').toLowerCase();
      userRows.forEach(r=>{
        const txt = r.textContent.toLowerCase();
        r.style.display = txt.includes(q) ? '' : 'none';
      });
    });

    // Copiere 1-click (nume/IBAN) cu feedback vizual
    function attachCopyHandlers(){
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = btn.getAttribute('data-copy') || '';
      try {
        await navigator.clipboard.writeText(val);
        const old = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check text-[10px]"></i> Copiat!';
        btn.classList.add('border-emerald-400/60','text-emerald-200');
        setTimeout(()=>{ btn.innerHTML = old; btn.classList.remove('border-emerald-400/60','text-emerald-200'); }, 1200);
      } catch (e) {
        const ta = document.createElement('textarea'); ta.value = val;
        document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch(_) {}
        document.body.removeChild(ta);
      }
    });
  });
}
attachCopyHandlers();

    // Filtru istoric
    const histFilter = document.getElementById('filterHistory');
    const histRows = Array.from(document.querySelectorAll('#historyTable tbody tr'));
    histFilter?.addEventListener('input', ()=>{
      const q = (histFilter.value||'').toLowerCase();
      histRows.forEach(r=>{
        const txt = r.textContent.toLowerCase();
        r.style.display = txt.includes(q) ? '' : 'none';
      });
    });
  </script>
</body>
</html>
