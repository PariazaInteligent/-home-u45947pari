<?php
// /user/audit.php — Security audit (devices/sessions)
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

// CSV export
if (isset($_GET['export']) && $_GET['export']==='csv') {
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename=audit_sessions_'.date('Ymd_His').'.csv');
  $out=fopen('php://output','w');
  fputcsv($out,['id','selector','ip','user_agent','created_at','expires_at','status']);
  $q=$pdo->prepare("SELECT id,selector,ip,user_agent,created_at,expires_at FROM remember_tokens WHERE user_id=:uid ORDER BY created_at DESC LIMIT 200");
  $q->execute([':uid'=>$me['id']]);
  while($r=$q->fetch(PDO::FETCH_ASSOC)){
    $expired = (strtotime($r['expires_at']) <= time()) ? 'EXPIRED' : 'ACTIVE';
    fputcsv($out, [$r['id'],$r['selector'],$r['ip'],$r['user_agent'],$r['created_at'],$r['expires_at'],$expired]);
  }
  fclose($out); exit;
}

// CSRF
if (empty($_SESSION['csrf_user_audit'])) $_SESSION['csrf_user_audit'] = bin2hex(random_bytes(16));
$CSRF = $_SESSION['csrf_user_audit'];
$flash = ['ok'=>null,'msg'=>''];

if ($_SERVER['REQUEST_METHOD']==='POST') {
  $tok = $_POST['csrf'] ?? '';
  if (!hash_equals($CSRF,$tok)) { $flash=['ok'=>false,'msg'=>'Sesiune invalidă. Reîncarcă pagina.']; }
  else {
    if (($_POST['action'] ?? '') === 'revoke_all') {
      $del = $pdo->prepare("DELETE FROM remember_tokens WHERE user_id=:uid");
      $del->execute([':uid'=>$me['id']]);
      foreach (['remember_selector','remember_validator'] as $c) {
        setcookie($c, '', time()-3600, '/', '', !empty($_SERVER['HTTPS']), true);
      }
      $flash=['ok'=>true,'msg'=>'Toate sesiunile au fost revocate.'];
    } elseif (($_POST['action'] ?? '') === 'revoke_one') {
      $id = (int)($_POST['token_id'] ?? 0);
      $del = $pdo->prepare("DELETE FROM remember_tokens WHERE id=:id AND user_id=:uid");
      $del->execute([':id'=>$id, ':uid'=>$me['id']]);
      $flash=['ok'=>true,'msg'=>'Sesiunea selectată a fost revocată.'];
    }
  }
}

// Fetch
$tokens=[];
$q=$pdo->prepare("SELECT id, selector, ip, user_agent, created_at, expires_at FROM remember_tokens WHERE user_id=:uid ORDER BY created_at DESC LIMIT 50");
$q->execute([':uid'=>$me['id']]);
$tokens=$q->fetchAll(PDO::FETCH_ASSOC);

?><!DOCTYPE html>
<html lang="ro" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Audit securitate — Pariază Inteligent</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <style>
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
    @keyframes drift { to { transform: translate3d(60px,60px,0); } }
    .glow { box-shadow: 0 10px 30px rgba(34,211,238,.25), inset 0 0 0 1px rgba(255,255,255,.06); }
    .nice-scroll::-webkit-scrollbar{ width:8px;} .nice-scroll::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.15); border-radius:8px;}
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100">
  <div class="enigma-grid grid-lines"></div>
  <header class="relative z-10">
    <div class="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
      <a href="/user/" class="flex items-center gap-3">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 text-slate-900 font-extrabold glow">PI</span>
        <div>
          <div class="font-semibold">Audit securitate</div>
          <div class="text-xs text-slate-400 -mt-0.5">Banca Comună — Dispozitive & sesiuni</div>
        </div>
      </a>
      <nav class="flex items-center gap-3 text-sm">
        <a href="/user/" class="hover:underline text-slate-300">Înapoi la cont</a>
        <a href="?export=csv" class="inline-flex items-center gap-2 rounded-2xl px-3 py-2 bg-white text-slate-900 font-semibold border border-white/20 hover:opacity-95">
          <i class="fa-regular fa-file-lines"></i><span>Export CSV</span>
        </a>
      </nav>
    </div>
  </header>

  <main class="relative z-10 max-w-7xl mx-auto px-4 pb-12">
    <?php if ($flash['msg']!==''): ?>
      <div class="rounded-xl px-4 py-3 border <?= $flash['ok'] ? 'border-emerald-400/30 text-emerald-200' : 'border-rose-400/30 text-rose-200' ?> bg-white/5 mb-4">
        <?=safe($flash['msg'])?>
      </div>
    <?php endif; ?>

    <div class="rounded-3xl p-0.5 bg-gradient-to-br from-blue-600/40 via-cyan-500/30 to-teal-400/40 glow">
      <div class="rounded-3xl bg-slate-900/80 backdrop-blur p-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-bold">Dispozitive & sesiuni „Ține-mă minte”</h1>
          <form method="post" onsubmit="return confirm('Sigur vrei să revoci toate sesiunile?');">
            <input type="hidden" name="csrf" value="<?=safe($CSRF)?>">
            <input type="hidden" name="action" value="revoke_all">
            <button class="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-white/10 hover:border-white/20 text-sm">
              <i class="fa-solid fa-ban"></i><span>Revocă tot</span>
            </button>
          </form>
        </div>

        <div class="space-y-3 max-h-[600px] overflow-auto nice-scroll">
          <?php if ($tokens): foreach ($tokens as $t):
            $expired = (strtotime($t['expires_at']) <= time());
          ?>
            <div class="rounded-xl border border-white/10 p-4 bg-white/5">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm font-medium"><?=safe($t['ip'] ?: '—')?> <span class="text-slate-400">•</span> <span class="font-mono"><?=safe(substr($t['selector'],0,10))?>…</span></div>
                  <div class="text-xs text-slate-400 mt-1">UA: <?=safe(substr($t['user_agent'] ?: '—', 0, 160))?></div>
                  <div class="text-xs mt-1">Creat: <span title="<?=safe($t['created_at'])?>"><?=safe(time_ago($t['created_at']))?></span> • Expiră: <span title="<?=safe($t['expires_at'])?>"><?= $expired ? 'expirat' : 'valid' ?></span></div>
                </div>
                <form method="post">
                  <input type="hidden" name="csrf" value="<?=safe($CSRF)?>">
                  <input type="hidden" name="action" value="revoke_one">
                  <input type="hidden" name="token_id" value="<?= (int)$t['id'] ?>">
                  <button class="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 border border-white/10 hover:border-white/20 text-xs">
                    <i class="fa-solid fa-xmark"></i><span>Revocă</span>
                  </button>
                </form>
              </div>
            </div>
          <?php endforeach; else: ?>
            <div class="text-slate-400 text-sm">Nu există înregistrări.</div>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </main>
</body>
</html>
