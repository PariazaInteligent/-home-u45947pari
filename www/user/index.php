<?php
// /user/index.php — User Dashboard (CRUD + password reset + revoke tokens)
declare(strict_types=1);
session_start();
if (empty($_SESSION['user'])) { header('Location: /v1/login.html'); exit; }
$me = $_SESSION['user'];
$role = strtoupper($me['role'] ?? 'USER');
if ($role === 'ADMIN') { header('Location: /admin/'); exit; }

require __DIR__ . '/../api/db.php';

function safe($v){ return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function time_ago($ts){
  $t = is_numeric($ts) ? (int)$ts : strtotime($ts ?: '');
  if (!$t) return '-';
  $d = time() - $t;
  if ($d < 60) return $d . 's';
  if ($d < 3600) return floor($d/60) . 'm';
  if ($d < 86400) return floor($d/3600) . 'h';
  return floor($d/86400) . 'z';
}

// CSRF
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
$CSRF = $_SESSION['csrf'];
$flash = ['ok'=>null,'msg'=>''];

// Preia user fresh din DB
$st = $pdo->prepare("SELECT id,email,role,is_active,created_at,updated_at,password_hash FROM users WHERE id=:id LIMIT 1");
$st->execute([':id'=>$me['id']]);
$user = $st->fetch(PDO::FETCH_ASSOC);
if (!$user) { session_destroy(); header('Location: /v1/login.html'); exit; }

// Actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $act = $_POST['action'] ?? '';
  $tok = $_POST['csrf'] ?? '';
  if (!hash_equals($CSRF, $tok)) { $flash = ['ok'=>false,'msg'=>'Sesiune invalidă. Reîncarcă pagina.']; }
  else switch ($act) {
    case 'update_email':
      $new = trim($_POST['email_new'] ?? '');
      if (!filter_var($new, FILTER_VALIDATE_EMAIL)) { $flash = ['ok'=>false,'msg'=>'Email invalid.']; break; }
      // Unicitate
      $q = $pdo->prepare("SELECT id FROM users WHERE email=:e AND id<>:id LIMIT 1");
      $q->execute([':e'=>$new, ':id'=>$user['id']]);
      if ($q->fetch()) { $flash = ['ok'=>false,'msg'=>'Email deja folosit.']; break; }
      $up = $pdo->prepare("UPDATE users SET email=:e, updated_at=NOW() WHERE id=:id");
      $up->execute([':e'=>$new, ':id'=>$user['id']]);
      $_SESSION['user']['email'] = $new;
      $user['email'] = $new;
      $flash = ['ok'=>true,'msg'=>'Email actualizat cu succes.'];
      break;

    case 'change_password':
      $cur = (string)($_POST['password_current'] ?? '');
      $p1  = (string)($_POST['password_new'] ?? '');
      $p2  = (string)($_POST['password_new2'] ?? '');
      if ($p1 !== $p2) { $flash = ['ok'=>false,'msg'=>'Parolele noi nu coincid.']; break; }
      if (strlen($p1) < 8) { $flash = ['ok'=>false,'msg'=>'Parola nouă trebuie să aibă minim 8 caractere.']; break; }
      // Acceptă hash sau (teoretic) vechi plaintext (migrat deja la login)
      $hash = (string)$user['password_hash'];
      $valid = ($hash && str_starts_with($hash,'$')) ? password_verify($cur,$hash) : hash_equals($hash,$cur);
      if (!$valid) { $flash = ['ok'=>false,'msg'=>'Parola curentă este greșită.']; break; }
      $newHash = password_hash($p1, PASSWORD_DEFAULT);
      $up = $pdo->prepare("UPDATE users SET password_hash=:h, updated_at=NOW() WHERE id=:id");
      $up->execute([':h'=>$newHash, ':id'=>$user['id']]);
      $flash = ['ok'=>true,'msg'=>'Parola a fost schimbată.'];
      break;

    case 'revoke_all':
      $del = $pdo->prepare("DELETE FROM remember_tokens WHERE user_id=:uid");
      $del->execute([':uid'=>$user['id']]);
      // Sterge cookie local dacă există
      foreach (['remember_selector','remember_validator'] as $c) {
        setcookie($c, '', time()-3600, '/', '', !empty($_SERVER['HTTPS']), true);
      }
      $flash = ['ok'=>true,'msg'=>'Toate sesiunile „Ține-mă minte” au fost revocate.'];
      break;

    case 'revoke_one':
      $id = (int)($_POST['token_id'] ?? 0);
      $del = $pdo->prepare("DELETE FROM remember_tokens WHERE id=:id AND user_id=:uid");
      $del->execute([':id'=>$id, ':uid'=>$user['id']]);
      $flash = ['ok'=>true,'msg'=>'Sesiunea selectată a fost revocată.'];
      break;
  }
}

// Reîncarcă lista de token-uri
$tokens = [];
try {
  $q = $pdo->prepare("SELECT id, selector, user_agent, ip, created_at, expires_at FROM remember_tokens WHERE user_id=:uid ORDER BY created_at DESC LIMIT 30");
  $q->execute([':uid'=>$user['id']]);
  $tokens = $q->fetchAll(PDO::FETCH_ASSOC);
} catch(Throwable $e){}

?><!DOCTYPE html>
<html lang="ro" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Contul meu — Pariază Inteligent</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <style>
    html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    .enigma-grid { position: fixed; inset: 0; overflow: hidden; pointer-events: none;
      background:
        radial-gradient(1400px 700px at 80% -10%, rgba(56,189,248,.25), transparent 60%),
        radial-gradient(1200px 600px at 10% 110%, rgba(20,184,166,.18), transparent 55%),
        linear-gradient(rgba(2,6,23,.9), rgba(2,6,23,.9)); }
    .grid-lines::before, .grid-lines::after { content:""; position:absolute; inset:-200% -200%;
      background-image:
        linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,.06) 1px, transparent 1px);
      background-size: 60px 60px, 60px 60px; transform: translate3d(0,0,0); animation: drift 30s linear infinite; }
    .grid-lines::after { filter: blur(1px); opacity:.6; animation-duration: 60s; }
    @keyframes drift { to { transform: translate3d(60px,60px,0); } }
    .glow { box-shadow: 0 10px 30px rgba(34,211,238,.25), inset 0 0 0 1px rgba(255,255,255,.06); }
    .card-hover { transition: transform .25s ease, box-shadow .25s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 15px 45px rgba(0,0,0,.35); }
    .nice-scroll::-webkit-scrollbar{ width:8px;} .nice-scroll::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.15); border-radius:8px;}
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100">
  <div class="enigma-grid grid-lines"></div>

  <header class="relative z-10">
    <div class="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
      <a href="/" class="flex items-center gap-3">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-extrabold glow">PI</span>
        <div>
          <div class="font-semibold">Pariază Inteligent</div>
          <div class="text-xs text-slate-400 -mt-0.5">Banca Comună — Contul meu</div>
        </div>
      </a>
      <nav class="flex items-center gap-3 text-sm">
        <a href="/user/audit.php" class="hover:underline text-slate-300">Audit</a>
        <a href="/logout.php" class="text-rose-300 hover:underline">Deconectare</a>
      </nav>
    </div>
  </header>

  <main class="relative z-10 max-w-7xl mx-auto px-4 pb-12">
    <!-- Hero / profil -->
    <section class="mt-2">
      <div class="rounded-3xl p-0.5 bg-gradient-to-br from-blue-600/40 via-cyan-500/30 to-teal-400/40 glow">
        <div class="rounded-3xl bg-slate-900/80 backdrop-blur p-6 md:p-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex items-center gap-4">
              <span class="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center text-slate-900 font-extrabold glow">U</span>
              <div>
                <h1 class="text-2xl md:text-3xl font-extrabold leading-tight">Contul meu</h1>
                <p class="text-sm text-slate-400">Autentificat ca <span class="font-semibold"><?=safe($user['email'])?></span></p>
              </div>
            </div>
            <?php if ($flash['msg']!==''): ?>
              <div class="rounded-xl px-4 py-2 border <?= $flash['ok'] ? 'border-emerald-400/30 text-emerald-200' : 'border-rose-400/30 text-rose-200' ?> bg-white/5">
                <?=safe($flash['msg'])?>
              </div>
            <?php endif; ?>
          </div>
        </div>
      </div>
    </section>

    <!-- Grid -->
    <section class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Update email -->
      <div class="lg:col-span-1 rounded-3xl p-0.5 bg-gradient-to-br from-blue-600/30 via-cyan-500/25 to-teal-400/30 glow card-hover">
        <form method="post" class="rounded-3xl bg-slate-900/80 backdrop-blur p-6">
          <input type="hidden" name="csrf" value="<?=safe($CSRF)?>">
          <input type="hidden" name="action" value="update_email">
          <h2 class="text-lg font-semibold mb-1">Actualizează emailul</h2>
          <p class="text-xs text-slate-400 mb-4">Email curent: <span class="font-mono"><?=safe($user['email'])?></span></p>
          <label class="text-sm text-slate-300">Email nou</label>
          <input name="email_new" type="email" required class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-cyan-400/60" placeholder="nume@domeniu.com">
          <button class="mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-white text-slate-900 font-semibold border border-white/20 hover:opacity-95">
            <i class="fa-regular fa-envelope"></i><span>Salvează</span>
          </button>
        </form>
      </div>

      <!-- Change password -->
      <div class="lg:col-span-1 rounded-3xl p-0.5 bg-gradient-to-br from-blue-600/30 via-cyan-500/25 to-teal-400/30 glow card-hover">
        <form method="post" class="rounded-3xl bg-slate-900/80 backdrop-blur p-6">
          <input type="hidden" name="csrf" value="<?=safe($CSRF)?>">
          <input type="hidden" name="action" value="change_password">
          <h2 class="text-lg font-semibold mb-1">Schimbă parola</h2>
          <p class="text-xs text-slate-400 mb-4">Siguranța contului tău înainte de toate.</p>
          <label class="text-sm text-slate-300">Parola curentă</label>
          <input name="password_current" type="password" required class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label class="text-sm text-slate-300">Parola nouă</label>
              <input name="password_new" type="password" minlength="8" required class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            </div>
            <div>
              <label class="text-sm text-slate-300">Confirmare parolă</label>
              <input name="password_new2" type="password" minlength="8" required class="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            </div>
          </div>
          <button class="mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-white text-slate-900 font-semibold border border-white/20 hover:opacity-95">
            <i class="fa-solid fa-key"></i><span>Actualizează</span>
          </button>
        </form>
      </div>

      <!-- Sessions / Remember tokens -->
      <div class="lg:col-span-1 rounded-3xl p-0.5 bg-gradient-to-br from-blue-600/30 via-cyan-500/25 to-teal-400/30 glow card-hover">
        <div class="rounded-3xl bg-slate-900/80 backdrop-blur p-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold">Sesiuni „Ține-mă minte”</h2>
            <form method="post" onsubmit="return confirm('Sigur vrei să revoci toate sesiunile?');">
              <input type="hidden" name="csrf" value="<?=safe($CSRF)?>">
              <input type="hidden" name="action" value="revoke_all">
              <button class="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-white/10 hover:border-white/20 text-sm">
                <i class="fa-solid fa-ban"></i><span>Revocă tot</span>
              </button>
            </form>
          </div>
          <div class="space-y-3 max-h-[360px] overflow-auto nice-scroll">
            <?php if ($tokens): foreach ($tokens as $t): 
              $expired = (strtotime($t['expires_at']) <= time());
            ?>
              <div class="rounded-xl border border-white/10 p-4 bg-white/5">
                <div class="text-sm font-medium"><?=safe($t['ip'] ?: '—')?> <span class="text-slate-400">•</span> <span class="font-mono"><?=safe(substr($t['selector'],0,10))?>…</span></div>
                <div class="text-xs text-slate-400 mt-1">UA: <?=safe(substr($t['user_agent'] ?: '—', 0, 120))?></div>
                <div class="text-xs mt-1">Creat: <span title="<?=safe($t['created_at'])?>"><?=safe(time_ago($t['created_at']))?></span> • Expiră: <span title="<?=safe($t['expires_at'])?>"><?= $expired ? 'expirat' : 'valid' ?></span></div>
                <form method="post" class="mt-2">
                  <input type="hidden" name="csrf" value="<?=safe($CSRF)?>">
                  <input type="hidden" name="action" value="revoke_one">
                  <input type="hidden" name="token_id" value="<?= (int)$t['id'] ?>">
                  <button class="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 border border-white/10 hover:border-white/20 text-xs">
                    <i class="fa-solid fa-xmark"></i><span>Revocă</span>
                  </button>
                </form>
              </div>
            <?php endforeach; else: ?>
              <div class="text-slate-400 text-sm">Nu există sesiuni salvate.</div>
            <?php endif; ?>
          </div>
        </div>
      </div>
    </section>
  </main>
</body>
</html>
