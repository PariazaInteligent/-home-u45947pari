<?php
// /v1/dashboard-investitor.php
session_start();

// NU cache pentru pagini protejate
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

// CSRF token pentru Chat Comunitate
if (empty($_SESSION['csrf_token_chat'])) {
  $_SESSION['csrf_token_chat'] = bin2hex(random_bytes(32));
}
$csrfChat = $_SESSION['csrf_token_chat'];

$me = $_SESSION['user'] ?? null;
$role = strtoupper($me['role'] ?? 'GUEST');

// redirect dacă nu e logat
if ($role === 'GUEST') {
  header('Location: /v1/login.html');
  exit;
}
// dacă e admin, trimite-l pe dashboardul de admin
if ($role === 'ADMIN') {
  header('Location: /v1/dashboard-admin.html');
  exit;
}

// helperi
function e($s)
{
  return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

// Nume din sesiune, fallback DB 1x apoi cache în sesiune
$name = trim($me['name'] ?? '');
if ($name === '') {
  require __DIR__ . '/../api/db.php'; // $pdo
  $email = $me['email'] ?? '';
  if ($email !== '') {
    $stmt = $pdo->prepare('SELECT COALESCE(NULLIF(TRIM(name), "")) AS display_name FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $dbName = (string) $stmt->fetchColumn();
    if ($dbName !== '') {
      $name = $dbName;
      $_SESSION['user']['name'] = $dbName;
    }
  }
}
if ($name === '')
  $name = 'Investitor';

$uid = (int) ($me['id'] ?? 0);
?>
<!DOCTYPE html>
<html lang="ro">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Panoul Meu — Vanguard Syndicate</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="/v1/css-general.css" />
  <link rel="stylesheet" href="/v1/gemini-format.css" />
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="/v1/gemini-format.js"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            orbitron: ['Orbitron', 'sans-serif'],
            rajdhani: ['Rajdhani', 'sans-serif'],
          },
          colors: {
            'void': '#030305',
            'neon-blue': '#00f3ff',
            'neon-purple': '#bc13fe',
            'glass-border': 'rgba(255, 255, 255, 0.08)',
            'glass-bg': 'rgba(10, 10, 15, 0.6)',
          },
          animation: {
            'spin-slow': 'spin 10s linear infinite',
            'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'float': 'float 6s ease-in-out infinite',
          },
          keyframes: {
            float: {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-20px)' },
            }
          }
        },
      },
    }
  </script>
</head>

<body class="bg-void text-white font-rajdhani min-h-screen pb-24" data-role="<?= e($role) ?>"
  data-user-id="<?= e((string) $uid) ?>" data-user-name="<?= e($name) ?>" data-csrf-chat="<?= e($csrfChat) ?>">

  <!-- Gate client-side (fallback) -->
  <script>
      (function gate() {
        const role = (document.body.dataset.role || 'GUEST').toUpperCase();
        if (role === 'ADMIN') window.location.replace('/v1/dashboard-admin.html');
        if (role !== 'USER') window.location.replace('/v1/login.html');
      })();
  </script>

  <div class="max-w-7xl mx-auto px-4">

    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-6 mb-8 py-6 border-b border-white/10">
      <div>
        <h1 class="text-3xl font-orbitron font-bold text-white mb-1">
          <span id="greeting">Salut</span>, <span class="text-neon-blue"><?= e($name) ?></span>!
        </h1>
        <p class="text-gray-400 text-sm">Panoul tău personal de investiții și analiză.</p>
      </div>
      <div class="flex items-center gap-3">
        <label class="text-xs text-gray-500 uppercase font-bold">Perioadă:</label>
        <select id="dateRange"
          class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neon-blue">
          <option value="today">Astăzi</option>
          <option value="all" selected>Tot Istoricul</option>
        </select>
      </div>
    </div>

    <!-- Top Grid -->
    <div id="widgets" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

      <!-- Summary Card -->
      <div
        class="bg-glass-bg border border-glass-border p-5 rounded-xl relative group hover:border-neon-blue/50 transition-colors"
        data-widget-id="summary">
        <div class="flex justify-between items-start mb-4">
          <h3 class="font-orbitron text-sm text-gray-300">REZUMAT FINANCIAR</h3>
          <i class="fa-solid fa-wallet text-neon-blue/50 group-hover:text-neon-blue drag-handle cursor-grab"></i>
        </div>
        <div class="space-y-3">
          <div class="p-3 rounded bg-white/5 border border-white/5">
            <div class="text-xs text-gray-500 uppercase">Investit</div>
            <div id="sumInvested" class="text-lg font-bold text-white">—</div>
          </div>
          <div class="p-3 rounded bg-white/5 border border-white/5">
            <div class="text-xs text-gray-500 uppercase">Profit Total</div>
            <div id="sumProfit" class="text-lg font-bold text-green-400">—</div>
          </div>
          <div class="p-3 rounded bg-white/5 border border-white/5">
            <div class="text-xs text-gray-500 uppercase">Sold Curent</div>
            <div id="sumBalance" class="text-2xl font-bold text-white">—</div>
          </div>
          <!-- Growth Strategy Indicator -->
          <div id="growthTrigger"
            class="p-3 rounded bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors group/growth">
            <div class="flex justify-between items-center">
              <div class="text-xs text-gray-500 uppercase group-hover/growth:text-neon-blue transition-colors">Creștere
                (strategie) <i class="fa-solid fa-circle-info ml-1"></i></div>
              <div id="sumGrowthVal" class="text-sm font-bold text-neon-blue">—</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Goals Widget -->
      <div class="bg-glass-bg border border-glass-border p-5 rounded-xl" data-widget-id="goals">
        <div class="flex justify-between items-start mb-4">
          <h3 class="font-orbitron text-sm text-gray-300">OBIECTIVE</h3>
          <i class="fa-solid fa-grip-lines drag-handle text-slate-400 cursor-grab"></i>
        </div>
        <div class="space-y-6">
          <div>
            <div class="flex justify-between text-xs mb-1 text-gray-400">
              <span>Profit Trimestrial</span>
              <span id="goalQuarterPct">—</span>
            </div>
            <div class="h-2 bg-white/10 rounded-full overflow-hidden">
              <div id="goalQuarterBar"
                class="h-full w-0 bg-gradient-to-r from-neon-blue to-green-400 transition-all duration-1000"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1 text-gray-400">
              <span>Sold Țintă</span>
              <span id="goalBalancePct">—</span>
            </div>
            <div class="h-2 bg-white/10 rounded-full overflow-hidden">
              <div id="goalBalanceBar"
                class="h-full w-0 bg-gradient-to-r from-neon-purple to-pink-500 transition-all duration-1000"></div>
            </div>
          </div>
          <div class="p-3 bg-black/20 rounded border border-white/5 text-xs text-gray-400 text-center">
            Setează obiective în <a href="/v1/profil.html#goals" class="text-neon-blue hover:underline">Profil</a>.
          </div>
        </div>
      </div>

      <!-- Projections Widget (Simulator) -->
      <div class="bg-glass-bg border border-glass-border p-5 rounded-xl" data-widget-id="proj">
        <div class="flex justify-between items-start mb-4">
          <h3 class="font-orbitron text-sm text-gray-300">SIMULATOR RANDAMENT</h3>
          <i class="fa-solid fa-grip-lines drag-handle text-slate-400 cursor-grab"></i>
        </div>
        <form id="projForm" class="space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] text-gray-500 block mb-1">SUMĂ (€)</label>
              <input id="projAmount" type="number" value="500"
                class="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-neon-blue outline-none" />
            </div>
            <div>
              <label class="text-[10px] text-gray-500 block mb-1">DURATĂ (Zile)</label>
              <select id="projDays"
                class="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-neon-blue outline-none">
                <option value="7">7 Zile</option>
                <option value="30" selected>30 Zile</option>
                <option value="90">90 Zile</option>
              </select>
            </div>
          </div>
          <div>
            <label class="text-[10px] text-gray-500 block mb-1">SCENARIU</label>
            <select id="projScenario"
              class="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-neon-blue outline-none">
              <option value="0.002">Conservator (0.2%/zi)</option>
              <option value="0.0035" selected>Moderat (0.35%/zi)</option>
              <option value="0.005">Optimist (0.5%/zi)</option>
            </select>
          </div>
          <div class="pt-3 mt-2 border-t border-white/10">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Estimat Final:</span>
              <span id="projFinal" class="font-bold text-neon-blue">—</span>
            </div>
            <div class="flex justify-between text-xs mt-1">
              <span class="text-gray-500">Profit:</span>
              <span id="projProfit" class="font-bold text-green-400">—</span>
            </div>
          </div>
        </form>
      </div>

      <!-- Quick Actions -->
      <div class="bg-glass-bg border border-glass-border p-5 rounded-xl flex flex-col justify-between"
        data-widget-id="actions">
        <div class="flex justify-between items-start mb-4">
          <h3 class="font-orbitron text-sm text-gray-300">ACȚIUNI RAPIDE</h3>
          <i class="fa-solid fa-grip-lines drag-handle text-slate-400 cursor-grab"></i>
        </div>
        <div class="space-y-2">
          <a href="/v1/investitii.php"
            class="block w-full py-3 bg-gradient-to-r from-neon-blue to-teal-400 text-black font-bold font-orbitron rounded hover:opacity-90 transition-opacity text-sm text-center">
            <i class="fa-solid fa-circle-plus mr-2"></i> INVESTEȘTE
          </a>
          <a href="/v1/retrageri.php"
            class="block w-full py-3 border border-white/10 hover:bg-white/5 text-white font-bold font-orbitron rounded transition-colors text-sm text-center">
            <i class="fa-solid fa-wallet mr-2"></i> RETRAGE
          </a>
        </div>
        <div class="mt-4 p-3 bg-black/40 rounded-xl border border-white/10 flex items-center gap-3">
          <div class="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-neon-blue">
            <i class="fa-solid fa-stopwatch"></i>
          </div>
          <div>
            <div class="text-[10px] text-gray-500">Timp Mediu Procesare</div>
            <div id="procTimeVal" class="text-sm font-bold text-white">—</div>
          </div>
        </div>
      </div>

    </div>

    <!-- Middle Section: Charts & Chat -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

      <!-- Charts Column -->
      <div class="xl:col-span-2 space-y-6">
        <!-- Profit Chart -->
        <div class="bg-glass-bg border border-glass-border p-6 rounded-xl" data-widget-id="profitChart">
          <h3 class="font-orbitron text-sm text-gray-300 mb-4">EVOLUȚIE PROFIT CUMULAT</h3>
          <div class="h-48 w-full relative">
            <canvas id="chartProfit" class="w-full h-full"></canvas>
            <div id="chartProfitEmpty"
              class="hidden absolute inset-0 flex items-center justify-center text-sm text-slate-400">Nu există date.
            </div>
          </div>
        </div>
        <!-- Fund Chart -->
        <div class="bg-glass-bg border border-glass-border p-6 rounded-xl" data-widget-id="fundChart">
          <h3 class="font-orbitron text-sm text-gray-300 mb-4">CREȘTERE FOND PERSONAL</h3>
          <div class="h-48 w-full relative">
            <canvas id="chartFund" class="w-full h-full"></canvas>
            <div id="chartFundEmpty"
              class="hidden absolute inset-0 flex items-center justify-center text-sm text-slate-400">Nu există date.
            </div>
          </div>
        </div>
      </div>

      <style>
        /* chat comunitate – bule vanguard 2125 */

        /* linia de baza pentru fiecare mesaj */
        [data-widget-id="chat"] .msg {
          display: flex;
          padding: 6px 0;
          font-size: 12px;
        }

        [data-widget-id="chat"] .msg.mine {
          justify-content: flex-end;
        }

        [data-widget-id="chat"] .msg.theirs {
          justify-content: flex-start;
        }

        /* bula in sine */
        [data-widget-id="chat"] .msg .bubble {
          position: relative;
          max-width: 80%;
          padding: 8px 10px 9px;
          border-radius: 18px;
          background: linear-gradient(135deg, #050816, #020617);
          border: 1px solid rgba(148, 163, 184, 0.35);
          color: #e5e7eb;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
        }


        /* mesajele tale – dreapta, neon albastru */
        [data-widget-id="chat"] .msg.mine .bubble {
          margin-left: 2rem;
          margin-right: 4px;
          background: #020617;
          border-radius: 18px;
          border-bottom-right-radius: 6px;
          border: 1px solid rgba(148, 163, 184, 0.5);
          color: #e5e7eb;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.55);
          padding-left: 14px;
          box-shadow:
            inset 3px 0 0 rgba(56, 189, 248, 0.9),
            0 8px 20px rgba(0, 0, 0, 0.55);
        }


        /* mesajele celorlalti – stanga, sticlos */
        [data-widget-id="chat"] .msg.theirs .bubble {
          margin-right: 2rem;
          margin-left: 4px;
          background: linear-gradient(135deg, #0b1120, #020617);
          border-color: rgba(31, 41, 55, 0.9);
          border-bottom-left-radius: 6px;
        }


        /* zona de meta (nume, timp, status) */
        [data-widget-id="chat"] .msg .meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
          font-size: 10px;
          opacity: 0.85;
        }

        [data-widget-id="chat"] .msg .meta .user {
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        [data-widget-id="chat"] .msg.mine .meta .user {
          color: #0ea5e9;
        }

        [data-widget-id="chat"] .msg .meta .time {
          margin-left: auto;
          font-variant-numeric: tabular-nums;
          opacity: 0.7;
        }

        /* chip pentru „te-a mentionat / ti-a raspuns” */
        [data-widget-id="chat"] .msg .meta .mention-chip {
          margin-left: 6px;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.6);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* statusuri mici: editat / sters / se trimite */
        [data-widget-id="chat"] .msg .meta .edited,
        [data-widget-id="chat"] .msg .meta .deleted,
        [data-widget-id="chat"] .msg .meta .pending {
          margin-left: 6px;
          font-size: 9px;
          opacity: 0.65;
        }

        /* corpul mesajului */
        [data-widget-id="chat"] .msg .body {
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 13px;
          line-height: 1.45;
        }

        /* cardul de reply din varf de bula */
        [data-widget-id="chat"] .msg .reply-ref {
          display: block;
          margin-bottom: 6px;
          padding: 5px 7px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(148, 163, 184, 0.45);
          text-align: left;
          cursor: pointer;
          font-size: 11px;
        }

        [data-widget-id="chat"] .msg .reply-ref .reply-head {
          font-weight: 600;
          font-size: 10px;
          opacity: 0.85;
        }

        [data-widget-id="chat"] .msg .reply-ref .reply-preview {
          font-size: 10px;
          opacity: 0.7;
        }

        [data-widget-id="chat"] .msg.mine .reply-ref {
          background: rgba(15, 23, 42, 0.35);
        }

        /* bara de reactii */
        [data-widget-id="chat"] .msg .react-bar {
          margin-top: 6px;
          display: flex;
          gap: 4px;
          font-size: 12px;
          opacity: 0.9;
        }

        [data-widget-id="chat"] .msg .react-btn {
          border: none;
          background: transparent;
          padding: 0 2px;
          cursor: pointer;
          transform-origin: center;
          opacity: 0.7;
          transition: transform 0.12s ease, opacity 0.12s ease;
        }

        [data-widget-id="chat"] .msg .react-btn:hover {
          transform: translateY(-1px) scale(1.1);
          opacity: 1;
        }

        [data-widget-id="chat"] .msg .react-btn.reacted {
          background: rgba(250, 204, 21, 0.25);
          border-radius: 4px;
          opacity: 1;
        }

        /* fine-tuning pe ecrane mari – bule ceva mai inguste */
        @media (min-width: 1280px) {
          [data-widget-id="chat"] .msg .bubble {
            max-width: 70%;
          }
        }

        [data-widget-id="chat"] .msg.msg-compact .meta {
          display: flex !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* override: meta + reply rămân mereu vizibile, chiar dacă apare msg-compact */
        [data-widget-id="chat"] .msg.msg-compact .bubble .meta {
          display: flex !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        [data-widget-id="chat"] .msg.msg-compact .bubble .user,
        [data-widget-id="chat"] .msg.msg-compact .bubble .time {
          display: inline !important;
        }

        [data-widget-id="chat"] .msg.msg-compact .bubble .reply-msg-btn {
          display: inline-flex !important;
          opacity: 0.9 !important;
        }

        /* la mesajele consecutive de la același user (msg-join-top),
     ascundem numele, rămâne doar la primul din lanț */
        [data-widget-id="chat"] .msg.msg-join-top .meta .user {
          display: none;
        }

        /* separator zi – centrat, cu „capsulă” futuristă */
        [data-widget-id="chat"] .chat-sep {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 18px 0;
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        [data-widget-id="chat"] .chat-sep::before,
        [data-widget-id="chat"] .chat-sep::after {
          content: "";
          flex: 1;
          height: 1px;
          background: linear-gradient(to right,
              transparent,
              rgba(148, 163, 184, 0.45));
        }

        [data-widget-id="chat"] .chat-sep::after {
          background: linear-gradient(to left,
              transparent,
              rgba(148, 163, 184, 0.45));
        }

        [data-widget-id="chat"] .chat-sep>span {
          position: relative;
          padding: 4px 12px;
          margin: 0 10px;
          border-radius: 999px;
          background: radial-gradient(circle at top,
              rgba(15, 23, 42, 0.95),
              rgba(2, 6, 23, 0.98));
          border: 1px solid rgba(148, 163, 184, 0.45);
          box-shadow:
            0 0 18px rgba(56, 189, 248, 0.25),
            0 8px 20px rgba(0, 0, 0, 0.6);
          text-shadow: 0 0 6px rgba(15, 23, 42, 1);
          white-space: nowrap;
        }

        /* presence bar – avatar chips futuriste */
        [data-widget-id="chat"] #chatPresenceBar {
          background: radial-gradient(circle at top, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.98));
          border-bottom: 1px solid rgba(148, 163, 184, 0.35);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
        }

        [data-widget-id="chat"] .presence-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: radial-gradient(circle at top left,
              rgba(56, 189, 248, 0.18),
              rgba(15, 23, 42, 0.96));
          border: 1px solid rgba(56, 189, 248, 0.55);
          box-shadow:
            0 0 12px rgba(56, 189, 248, 0.35),
            0 6px 16px rgba(0, 0, 0, 0.7);
          font-size: 11px;
          color: #e5e7eb;
          backdrop-filter: blur(10px);
          white-space: nowrap;
        }

        [data-widget-id="chat"] .presence-avatar {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          background: linear-gradient(135deg, #020617, #38bdf8);
          box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
        }

        [data-widget-id="chat"] .presence-meta {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        [data-widget-id="chat"] .presence-name {
          font-weight: 500;
        }

        [data-widget-id="chat"] .presence-status {
          font-size: 9px;
          color: #6ee7b7;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.85;
        }

        [data-widget-id="chat"] .presence-pill.presence-more {
          background: rgba(15, 23, 42, 0.9);
          border-style: dashed;
          border-color: rgba(148, 163, 184, 0.7);
          box-shadow: none;
        }

        [data-widget-id="chat"] .presence-more-label {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #9ca3af;
        }

        @media (max-width: 640px) {
          [data-widget-id="chat"] .presence-name {
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        /* ===== Responsive Chat Card Layout ===== */
        /* Fix: constrain chat card height on smaller screens to prevent
           infinite vertical growth. The message feed (#chatFeed) handles
           internal scrolling via flex-1 + overflow-y:auto. */

        /* Base: For all screens, ensure the chat card has proper flex layout */
        [data-widget-id="chat"] {
          display: flex;
          flex-direction: column;
          min-height: 400px;
        }

        /* Medium screens (tablets, half-width desktop) */
        @media (max-width: 1199px) and (min-width: 768px) {
          [data-widget-id="chat"] {
            height: 550px;
            max-height: 65vh;
          }
        }

        /* Small screens (mobile, narrow windows) */
        @media (max-width: 767px) {
          [data-widget-id="chat"] {
            height: auto;
            min-height: 350px;
            max-height: 70vh;
          }

          /* Slightly smaller padding on mobile */
          [data-widget-id="chat"] #chatFeed {
            padding: 0.75rem;
          }

          /* Compact input area on mobile */
          [data-widget-id="chat"] .p-4.border-t {
            padding: 0.75rem;
          }
        }

        /* Extra small screens (very narrow) */
        @media (max-width: 480px) {
          [data-widget-id="chat"] {
            max-height: 60vh;
            min-height: 300px;
          }
        }

        /* Ensure the feed area remains scrollable and takes available space */
        #chatFeed {
          flex: 1 1 0%;
          overflow-y: auto;
          min-height: 0;
          /* Important for flex child to shrink properly */
        }

        /* ========== Badge „mesaje noi" ========== */
        #chatNewMsgsBadge {
          animation: newmsg-badge-pulse 2s ease-in-out infinite;
          box-shadow: 0 4px 15px rgba(0, 243, 255, 0.5);
        }

        @keyframes newmsg-badge-pulse {

          0%,
          100% {
            transform: translateX(-50%) scale(1);
          }

          50% {
            transform: translateX(-50%) scale(1.05);
          }
        }

        #chatNewMsgsBadge:hover {
          animation: none;
          transform: translateX(-50%) scale(1.08);
        }

        /* ========== Separator „mesaje noi" ========== */
        .chat-unread-sep {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 14px 0;
          font-size: 10px;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .chat-unread-sep::before,
        .chat-unread-sep::after {
          content: "";
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(56, 189, 248, 0.6));
        }

        .chat-unread-sep::after {
          background: linear-gradient(to left, transparent, rgba(56, 189, 248, 0.6));
        }

        .chat-unread-sep>span {
          padding: 3px 12px;
          margin: 0 10px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.4);
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
        }

        /* highlight pentru mesajul la care ajungi din notificare */
        [data-widget-id="chat"] .msg.msg-highlight .bubble {
          box-shadow:
            0 0 0 1px rgba(56, 189, 248, 0.9),
            0 0 25px rgba(56, 189, 248, 0.75),
            0 18px 40px rgba(0, 0, 0, 0.9);
          transform: translateY(-1px);
          transition: box-shadow 0.25s ease, transform 0.25s ease;
        }

        /* dropdown @mention */
        [data-widget-id="chat"] .mention-suggest {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 6px;
          min-width: 190px;
          max-height: 220px;
          overflow-y: auto;
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.7);
          background: radial-gradient(circle at top, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.9);
          z-index: 30;
          font-size: 12px;
        }

        [data-widget-id="chat"] .mention-suggest.hidden {
          display: none;
        }

        [data-widget-id="chat"] .mention-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #e5e7eb;
          cursor: pointer;
        }

        [data-widget-id="chat"] .mention-item-btn:hover,
        [data-widget-id="chat"] .mention-item-btn.is-active {
          background: linear-gradient(90deg,
              rgba(56, 189, 248, 0.18),
              rgba(15, 23, 42, 0.96));
        }

        [data-widget-id="chat"] .mention-item-avatar {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: linear-gradient(135deg, #020617, #38bdf8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }

        [data-widget-id="chat"] .mention-item-name {
          font-weight: 500;
        }

        [data-widget-id="chat"] .mention-item-meta {
          font-size: 10px;
          color: #9ca3af;
        }

        /* inbox mențiuni – carduri frumoase */
        .mention-item {
          width: 100%;
          padding: 0;
          margin: 0 0 0.5rem;
          border: 0;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }

        .mention-card {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 0.9rem;
          border-radius: 0.9rem;
          background: radial-gradient(circle at 0 0, rgba(34, 211, 238, 0.18), rgba(15, 23, 42, 0.96));
          border: 1px solid rgba(148, 163, 184, 0.35);
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 1);
          transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }

        .mention-item:hover .mention-card,
        .mention-item:focus-visible .mention-card {
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.55);
          background: radial-gradient(circle at 0 0, rgba(168, 85, 247, 0.32), rgba(15, 23, 42, 1));
        }

        .mention-avatar {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 600;
          color: #e5f4ff;
          background: conic-gradient(from 180deg, #38bdf8, #a855f7, #22c55e, #38bdf8);
        }

        .mention-main {
          flex: 1;
          min-width: 0;
        }

        .mention-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.78rem;
          margin-bottom: 0.15rem;
        }

        .mention-user {
          font-weight: 500;
        }

        .mention-time {
          opacity: 0.7;
        }

        .mention-meta {
          margin-bottom: 0.25rem;
        }

        .mention-kind {
          display: inline-flex;
          align-items: center;
          padding: 0.1rem 0.5rem;
          border-radius: 999px;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge-reply {
          background: rgba(34, 211, 238, 0.18);
          color: #e0faff;
        }

        .badge-mention {
          background: rgba(168, 85, 247, 0.18);
          color: #f5e9ff;
        }

        .mention-body {
          font-size: 0.78rem;
          line-height: 1.35;
          color: #e5e7eb;
          max-height: 3em;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mention-empty {
          font-size: 0.8rem;
          color: #9ca3af;
          padding: 0.5rem 0;
        }
      </style>



      <!-- Community Chat -->
      <div class="bg-glass-bg border border-glass-border rounded-xl flex flex-col relative overflow-hidden
         lg:h-[600px] lg:max-h-[600px]" data-widget-id="chat">

        <div class="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <div class="flex items-center gap-3">
            <h3 class="font-orbitron text-sm text-white flex items-center gap-2">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              CHAT COMUNITATE
            </h3>
            <div class="flex gap-1 text-[10px]">
              <button id="tabAll" class="px-2 py-1 rounded bg-white/10 text-white hidden">toate</button>
              <button id="tabMent" class="px-2 py-1 rounded hover:bg-white/10 text-gray-400 hidden">mențiuni</button>
            </div>
          </div>
          <div class="flex gap-2">
            <button id="mentionBell" class="relative text-gray-400 hover:text-white">
              <i class="fa-solid fa-bell"></i>
              <span id="mentionDot" class="hidden absolute -top-1 -right-1 w-2 h-2 bg-neon-blue rounded-full"></span>
            </button>
            <span class="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400" id="chatLive" title="Live">LIVE</span>
          </div>
        </div>

        <!-- bara prezență -->
        <div id="chatPresenceBar"
          class="px-4 py-1 text-[11px] text-gray-400 flex flex-wrap gap-1 border-b border-white/5">
        </div>

        <!-- Feed -->
        <div id="chatFeed" class="flex-1 overflow-y-auto nice-scroll p-4 space-y-4 bg-black/20 relative"></div>

        <!-- Badge „mesaje noi" – apare când vin mesaje și userul nu e la bottom -->
        <button id="chatNewMsgsBadge" type="button" class="hidden absolute left-1/2 -translate-x-1/2 bottom-28 
                 px-4 py-2 rounded-full bg-neon-blue text-black font-bold text-xs 
                 shadow-lg hover:opacity-90 transition-all z-10
                 flex items-center gap-2 cursor-pointer">
          <i class="fa-solid fa-arrow-down"></i>
          <span>mesaje noi</span>
        </button>

        <!-- Toasts container inside chat or fixed? Original was fixed. Let's keep fixed for better visibility -->
        <div id="mentionToast" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"></div>

        <!-- Inbox mențiuni (overlay complet) -->
        <div id="mentionsOverlay" class="hidden absolute inset-0 bg-slate-900/95 z-20 p-4 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold">Răspunsuri &amp; mențiuni</div>
              <div class="text-xs text-gray-400">
                Mesaje care te vizează direct sau îți răspund ție.
              </div>
            </div>
            <button id="btnMentionsReadAll" type="button"
              class="text-xs px-2 py-1 rounded border border-white/10 hover:bg-white/10">
              marchează citit
            </button>
          </div>

          <div id="mentionInbox" class="flex-1 overflow-y-auto space-y-2 text-xs nice-scroll">
          </div>
        </div>

        <!-- bara typing -->
        <div id="chatTypingBar" class="px-4 py-1 text-[11px] text-gray-500">
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-white/10 bg-black/40 relative">
          <!-- Reply Context -->
          <div id="replyContext"
            class="hidden mb-2 p-2 rounded bg-white/5 border-l-2 border-neon-blue text-xs flex justify-between items-center">
            <div>
              <span class="text-gray-400">Răspunzi lui <strong id="replyUser" class="text-white">...</strong></span>
              <div id="replyPreview" class="text-gray-500 truncate max-w-[200px]"></div>
            </div>
            <button id="replyCancel" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <form id="chatForm" class="relative">
            <!-- File upload hidden -->
            <input id="chatFile" type="file" class="hidden" multiple />
            <div id="attachList" class="hidden mb-2 flex flex-wrap gap-2"></div>

            <div class="relative">
              <!-- dropdown pentru autocomplete @mention -->
              <div id="mentionSuggest" class="mention-suggest hidden"></div>
              <textarea id="chatInput" rows="1" maxlength="1000" placeholder="Scrie un mesaj..."
                class="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-neon-blue outline-none resize-none overflow-hidden"></textarea>
              <div class="absolute right-2 top-2 flex items-center gap-1">
                <label for="chatFile" id="attachHint"
                  class="p-1.5 text-gray-500 hover:text-white transition-colors cursor-pointer"><i
                    class="fa-solid fa-paperclip"></i></label>
                <button id="chatSend" type="submit"
                  class="p-1.5 bg-neon-blue text-black rounded-lg hover:opacity-90 transition-opacity"><i
                    class="fa-solid fa-paper-plane text-xs"></i></button>
              </div>
            </div>
            <div class="text-[10px] text-gray-600 mt-2 flex justify-between">
              <span>Respectă regulile comunității.</span>
              <span id="charCountVal">0/1000</span>
            </div>
          </form>
        </div>
      </div>

    </div>

    <!-- Lumen AI Insight - Bottom Wide -->
    <div class="bg-glass-bg border border-glass-border p-6 rounded-xl mb-8" data-widget-id="lumen">
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-blue to-neon-purple flex items-center justify-center animate-pulse-fast">
            <i class="fa-solid fa-robot text-white"></i>
          </div>
          <div>
            <h3 class="font-orbitron text-lg text-white">LUMEN AI INSIGHT</h3>
            <span class="text-xs text-gray-500 font-mono">Analiză Portofoliu Live</span>
          </div>
        </div>
        <button id="btnLumen"
          class="px-4 py-2 border border-neon-purple/50 text-neon-purple rounded text-xs font-bold hover:bg-neon-purple hover:text-white transition-all">
          GENEREAZĂ INSIGHT
        </button>
      </div>

      <!-- Lumen Stats Grid -->
      <div id="lumenStats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 hidden">
        <div class="p-3 bg-white/5 rounded border border-white/5">
          <div class="text-[10px] text-gray-500 uppercase">Randament Azi</div>
          <div id="lumenTodayYield" class="text-sm font-bold text-white">—</div>
        </div>
        <div class="p-3 bg-white/5 rounded border border-white/5">
          <div class="text-[10px] text-gray-500 uppercase">Sold Curent</div>
          <div id="lumenBalance" class="text-sm font-bold text-white">—</div>
        </div>
        <div class="p-3 bg-white/5 rounded border border-white/5">
          <div class="text-[10px] text-gray-500 uppercase">Randament Total</div>
          <div id="lumenTotalYield" class="text-sm font-bold text-neon-blue">—</div>
        </div>
        <div class="p-3 bg-white/5 rounded border border-white/5">
          <div class="text-[10px] text-gray-500 uppercase">Procesare Medie</div>
          <div id="lumenProcTime" class="text-sm font-bold text-white">—</div>
        </div>
      </div>

      <div id="lumenOut"
        class="p-4 bg-white/5 rounded-xl border-l-4 border-neon-blue text-sm text-gray-300 leading-relaxed min-h-[60px]">
        <p class="text-slate-500 italic">Apasă pe buton pentru a genera o analiză detaliată.</p>
      </div>

      <div class="mt-3 flex flex-wrap gap-4 text-[10px] text-gray-500 border-t border-white/5 pt-3">
        <div><span class="text-gray-400">Taxă dinamică est.:</span> <span id="lumenTax"
            class="text-neon-purple">—</span></div>
        <div><span class="text-gray-400">Investitori activi:</span> <span id="lumenInvestors"
            class="text-white">—</span></div>
      </div>

      <div id="lumenErr" class="hidden mt-2 text-xs text-rose-400">Eroare la generare.</div>
    </div>

    <!-- Recent Transactions Widget -->
    <div class="bg-glass-bg border border-glass-border p-5 rounded-xl mb-8" data-widget-id="recentTx">
      <div class="flex justify-between items-start mb-4">
        <h3 class="font-orbitron text-sm text-gray-300">TRANZACȚII RECENTE</h3>
        <i class="fa-solid fa-grip-lines drag-handle text-slate-400 cursor-grab"></i>
      </div>
      <div id="recentTxList" class="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
        <div class="text-center text-slate-500 text-xs py-4">Se încarcă...</div>
      </div>
    </div>

    <!-- Gemini Advanced -->
    <div class="bg-glass-bg border border-glass-border p-6 rounded-xl" data-widget-id="gemini">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-orbitron text-sm text-gray-300">ANALIZĂ AVANSATĂ GEMINI</h2>
        <i class="fa-solid fa-grip-lines drag-handle text-slate-400 cursor-grab"></i>
      </div>
      <div class="text-sm text-slate-400 mb-2">Pune o întrebare în limbaj natural.</div>
      <textarea id="geminiQ" rows="2"
        class="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-neon-blue outline-none"
        placeholder="Ex: Cum ar fi evoluat profitul astăzi dacă dublam suma investită?"></textarea>
      <div class="mt-2 flex gap-3">
        <button id="btnGemini"
          class="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-gradient-to-r from-neon-blue to-teal-400 text-black font-bold text-xs"><i
            class="fa-solid fa-robot"></i> ANALIZEAZĂ</button>
        <span id="geminiErr" class="hidden text-xs text-rose-300 self-center">Eroare.</span>
      </div>
      <div id="geminiOut" class="mt-3 text-sm text-slate-300"></div>
    </div>

  </div>

  <!-- Footer -->
  <footer class="py-8 border-t border-white/5 mt-12">
    <div
      class="max-w-7xl mx-auto px-4 text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>© <span id="year"></span> Vanguard Syndicate. Toate drepturile rezervate.</div>
      <div class="flex items-center gap-4">
        <a class="hover:text-white" href="/v1/acasa.html">Acasă</a>
        <a class="hover:text-white" href="/v1/profil.html">Profil</a>
        <a class="hover:text-white" href="/logout.php">Deconectare</a>
      </div>
    </div>
  </footer>

  <!-- Growth Modal -->
  <div id="growthModal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <div
      class="bg-void border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
      <button id="closeGrowthModal" class="absolute top-4 right-4 text-gray-400 hover:text-white"><i
          class="fa-solid fa-xmark"></i></button>
      <h3 class="font-orbitron text-lg text-white mb-2">Nomenclator „Creștere”</h3>
      <p class="text-sm text-gray-400 mb-6">Randament (strategie) arată performanța fără a penaliza retragerile
        aprobate. Pentru transparență, mai jos vezi descompunerea:</p>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="p-3 rounded bg-white/5 border border-white/10">
          <div class="text-[10px] text-gray-500 uppercase">Perioadă selectată</div>
          <div id="gmPeriod" class="text-sm font-bold text-white">toate</div>
        </div>
        <div class="p-3 rounded bg-white/5 border border-white/10">
          <div class="text-[10px] text-gray-500 uppercase">Randament (strategie)</div>
          <div id="gmYield" class="text-sm font-bold text-neon-blue">0.00%</div>
        </div>
        <div class="p-3 rounded bg-white/5 border border-white/10">
          <div class="text-[10px] text-gray-500 uppercase">Profit brut (înainte de retrageri)</div>
          <div id="gmProfit" class="text-sm font-bold text-white">0.00 EUR</div>
        </div>
        <div class="p-3 rounded bg-white/5 border border-white/10">
          <div class="text-[10px] text-gray-500 uppercase">Retrageri & taxe (estimate)</div>
          <div id="gmWithdraw" class="text-sm font-bold text-white">0.00 EUR</div>
        </div>
        <div class="p-3 rounded bg-white/5 border border-white/10">
          <div class="text-[10px] text-gray-500 uppercase">Profit rămas (după retrageri)</div>
          <div id="gmRemProfit" class="text-sm font-bold text-white">0.00 EUR</div>
        </div>
        <div class="p-3 rounded bg-white/5 border border-white/10">
          <div class="text-[10px] text-gray-500 uppercase">Sold curent</div>
          <div id="gmBalance" class="text-sm font-bold text-white">0.00 EUR</div>
        </div>
      </div>

      <div class="space-y-2 text-xs text-gray-500">
        <p>• <strong>Randament (strategie)</strong> ≈ profitul generat de strategie raportat la sumele investite, fără a
          scădea retragerile aprobate.</p>
        <p>• <strong>Retrageri & taxe</strong> sunt tratate ca ieșiri de numerar; ele pot aduce Profitul curent la 0
          chiar dacă Randamentul rămâne pozitiv.</p>
      </div>

      <div class="mt-6 flex justify-end">
        <button id="btnCloseGrowth"
          class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm text-white transition-colors">Închis</button>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script>
    document.getElementById('year').textContent = new Date().getFullYear();

    // Greeting logic
    (function greeting() {
      const h = new Date().getHours();
      let t = 'Bună ziua'; if (h < 12) t = 'Bună dimineața'; if (h >= 18) t = 'Bună seara';
      const g = document.getElementById('greeting');
      if (g) g.textContent = t;
    })();

    // Helper formatting
    const NF_EUR = new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR' });
    function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }

    // --- OLD JS LOGIC ADAPTED ---

    // KPI helper
    function kpi(event, detail) {
      const payload = { type: event, ts: Date.now(), ...detail };
      console.log('[KPI]', payload);
    }

    let dataAll = [];
    let recentTransactions = [];
    let summaryData = null;

    function toISO(d) { return d.toISOString().slice(0, 10); }

    async function loadHistory() {
      try {
        const res = await fetch('/api/user/history.php', { credentials: 'include' });
        if (!res.ok) throw new Error('http ' + res.status);
        const j = await res.json();
        if (!j || !j.ok || !Array.isArray(j.items)) throw new Error('format invalid');
        dataAll = j.items.map(row => {
          const dateStr = row.date || row.day;
          if (!dateStr) return null;
          const d = new Date(dateStr + 'T00:00:00');
          if (Number.isNaN(d.getTime())) return null;
          return {
            date: d,
            profitDelta: Number(row.profit_delta_eur ?? row.profit_eur ?? 0),
            profitCum: Number(row.profit_cum_eur ?? 0),
            deposit: Number(row.deposit_eur ?? 0),
            withdraw: Number(row.withdraw_eur ?? 0),
            balance: Number(row.balance_eur ?? row.bank_balance_eur ?? 0)
          };
        }).filter(Boolean).sort((a, b) => a.date - b.date);
      } catch (e) { console.error('[dashboard] history error', e); dataAll = []; }
    }

    let historyLoaded = false;
    async function ensureHistoryLoaded() { if (historyLoaded) return; await loadHistory(); historyLoaded = true; }

    function rangeToStart(range) {
      if (range === 'today') { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
      if (dataAll.length) { const d = new Date(dataAll[0].date); d.setHours(0, 0, 0, 0); return d; }
      const d = new Date(); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0); return d;
    }

    function computeStats(range) {
      const start = rangeToStart(range);
      const points = [];
      if (!dataAll.length) return { points };
      let lastCumProfit = 0;
      dataAll.forEach(r => {
        if (r.date >= start) {
          let cumProfit;
          if (typeof r.profitCum === 'number' && !Number.isNaN(r.profitCum) && r.profitCum !== 0) { cumProfit = r.profitCum; }
          else { cumProfit = lastCumProfit + (r.profitDelta || 0); }
          lastCumProfit = cumProfit;
          points.push({
            x: toISO(r.date),
            profit: cumProfit,
            balance: typeof r.balance === 'number' ? r.balance : null,
            deposit: r.deposit || 0,
            withdraw: r.withdraw || 0,
            profitDelta: r.profitDelta || 0
          });
        }
      });
      return { points };
    }

    async function applyGoals(balanceEUR, profitEUR) {
      try {
        const res = await fetch('/api/user/goals_get.php', { credentials: 'include' });
        let targetBal = 0, targetProf = 0;
        if (res.ok) {
          const g = await res.json();
          if (g && g.ok) {
            targetBal = (g.target_balance_cents || 0) / 100;
            targetProf = (g.target_profit_quarter_cents || 0) / 100;
          }
        }
        let qb = 0; if (targetBal > 0) qb = Math.max(0, Math.min(100, (balanceEUR / targetBal) * 100));
        setText('goalBalancePct', targetBal > 0 ? `${qb.toFixed(0)}%` : '—');
        const gbBar = document.getElementById('goalBalanceBar'); if (gbBar) gbBar.style.width = qb + '%';

        let qp = 0; if (targetProf > 0) qp = Math.max(0, Math.min(100, (profitEUR / targetProf) * 100));
        setText('goalQuarterPct', targetProf > 0 ? `${qp.toFixed(0)}%` : '—');
        const qpBar = document.getElementById('goalQuarterBar'); if (qpBar) qpBar.style.width = qp + '%';
      } catch (e) { }
    }

    async function fetchAndApplyRealSummary(range) {
      try {
        const resSum = await fetch(`/api/user/summary.php?range=${encodeURIComponent(range)}`, { credentials: 'include' });
        if (!resSum.ok) throw 0;
        const j = await resSum.json();
        if (!(j && j.ok)) throw 0;

        const rawInvestedC = Math.max(0, +j.invested_cents || 0);
        const rawProfitC = Math.max(0, +j.profit_cents || 0);
        let dispBalC = Math.max(0, +j.display_balance_cents || 0);

        try {
          const resWal = await fetch('/api/wallet/summary.php', { credentials: 'include' });
          if (resWal.ok) {
            const w = await resWal.json();
            const walletC = Math.round(((w?.balance_eur ?? 0) * 100));
            if (walletC >= 0) dispBalC = walletC;
          }
        } catch (_) { }

        // Reconciliere
        let adjInvestedC = rawInvestedC;
        let adjProfitC = rawProfitC;
        if (range === 'all' && dispBalC >= 0) {
          const delta = Math.max(0, (rawInvestedC + rawProfitC) - dispBalC);
          if (delta > 0) {
            const fromProfit = Math.min(rawProfitC, delta);
            adjProfitC = Math.max(0, rawProfitC - fromProfit);
            adjInvestedC = Math.max(0, rawInvestedC - (delta - fromProfit));
          }
        }

        const invested = adjInvestedC / 100;
        const profit = adjProfitC / 100;
        const balance = dispBalC / 100;

        summaryData = {
          range,
          investedEUR: invested,
          profitEUR: profit,
          balanceEUR: balance,
          roiPct: invested > 0 ? (profit / invested) * 100 : 0,
          raw: j
        };

        setText('sumInvested', NF_EUR.format(invested));
        setText('sumProfit', (profit >= 0 ? '+' : '') + NF_EUR.format(profit));
        setText('sumBalance', NF_EUR.format(balance));

        const sp = document.getElementById('sumProfit');
        if (sp) {
          sp.className = 'text-lg font-bold ' + (profit >= 0 ? 'text-green-400' : 'text-rose-400');
        }

        // Growth Strategy Calculation
        const withdrawalsWindow = Math.max(0, +j.withdrawals_window_cents || 0) / 100;
        const investedWindow = Math.max(0, +j.invested_cents || 0) / 100; // Invested in window
        const profitWindow = Math.max(0, +j.profit_cents || 0) / 100; // Profit in window

        const strategyYield = j.period_return_pct || 0;
        const remProfit = Math.max(0, profitWindow - withdrawalsWindow);

        // Update Growth UI
        setText('sumGrowthVal', strategyYield.toFixed(2) + '%');

        // Update Modal Data
        setText('gmPeriod', range === 'today' ? 'Astăzi' : 'Toată perioada');
        setText('gmYield', strategyYield.toFixed(2) + '%');
        setText('gmProfit', NF_EUR.format(profitWindow));
        setText('gmWithdraw', NF_EUR.format(withdrawalsWindow));
        setText('gmRemProfit', NF_EUR.format(remProfit));
        setText('gmBalance', NF_EUR.format(balance));

        await applyGoals(balance, profit);
      } catch (e) {
        setText('sumInvested', '—');
        setText('sumProfit', '—');
        setText('sumBalance', '—');
        setText('sumGrowthVal', '—');
      }
    }

    // Growth Modal Logic
    const growthModal = document.getElementById('growthModal');
    const openGrowth = () => growthModal.classList.remove('hidden');
    const closeGrowth = () => growthModal.classList.add('hidden');

    document.getElementById('growthTrigger')?.addEventListener('click', openGrowth);
    document.getElementById('closeGrowthModal')?.addEventListener('click', closeGrowth);
    document.getElementById('btnCloseGrowth')?.addEventListener('click', closeGrowth);

    let chartProfit, chartFund;
    function updateCharts(points) {
      const labels = points.map(p => p.x);
      const pdata = points.map(p => p.profit);
      const fdata = points.map(p => p.balance);

      const emptyP = document.getElementById('chartProfitEmpty');
      const emptyF = document.getElementById('chartFundEmpty');
      if (emptyP) emptyP.classList.toggle('hidden', labels.length > 0);
      if (emptyF) emptyF.classList.toggle('hidden', labels.length > 0);

      const ctxP = document.getElementById('chartProfit');
      const ctxF = document.getElementById('chartFund');
      if (!ctxP || !ctxF) return;

      // Gradient helper
      const createGrad = (ctx, color) => {
        const g = ctx.createLinearGradient(0, 0, 0, 400);
        g.addColorStop(0, color + '60');
        g.addColorStop(1, color + '00');
        return g;
      };

      if (!chartProfit) {
        chartProfit = new Chart(ctxP.getContext('2d'), {
          type: 'line',
          data: {
            labels, datasets: [{
              label: 'Profit',
              data: pdata,
              tension: .4,
              borderColor: '#00f3ff',
              backgroundColor: createGrad(ctxP.getContext('2d'), '#00f3ff'),
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
              y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#64748b', font: { size: 10 } } }
            }
          }
        });
      } else {
        chartProfit.data.labels = labels;
        chartProfit.data.datasets[0].data = pdata;
        chartProfit.update();
      }

      if (!chartFund) {
        chartFund = new Chart(ctxF.getContext('2d'), {
          type: 'line',
          data: {
            labels, datasets: [{
              label: 'Sold',
              data: fdata,
              tension: .4,
              borderColor: '#bc13fe',
              backgroundColor: createGrad(ctxF.getContext('2d'), '#bc13fe'),
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
              y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#64748b', font: { size: 10 } } }
            }
          }
        });
      } else {
        chartFund.data.labels = labels;
        chartFund.data.datasets[0].data = fdata;
        chartFund.update();
      }
    }

    async function loadRecentTransactions() {
      const list = document.getElementById('recentTxList');
      if (!list) return;
      try {
        const res = await fetch('/api/user/recent_transactions.php', { credentials: 'include' });
        if (!res.ok) throw new Error('http ' + res.status);
        const data = await res.json();
        recentTransactions = Array.isArray(data.items) ? data.items : [];

        list.innerHTML = '';
        if (!data.ok || !recentTransactions.length) {
          list.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Nu există tranzacții recente.</div>';
          return;
        }


        const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
        recentTransactions.forEach(t => {
          const isProfit = t.type === 'profit';
          const isLoss = t.type === 'pierdere';
          const isDeposit = t.type === 'deposit';
          const isWithdraw = t.type === 'withdraw';

          const badge = isDeposit
            ? '<span class="px-2 py-1 rounded text-[10px] font-semibold bg-green-500/10 text-green-300 border border-green-400/20">Depunere</span>'
            : isWithdraw
              ? '<span class="px-2 py-1 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-200 border border-amber-400/20">Retragere</span>'
              : isProfit
                ? '<span class="px-2 py-1 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-200 border border-cyan-400/20">Profit</span>'
                : '<span class="px-2 py-1 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-200 border border-rose-400/20">Pierdere</span>';

          const icon = isDeposit ? 'fa-circle-plus' : isWithdraw ? 'fa-wallet' : isProfit ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
          const signedAmount = (isWithdraw || isLoss) ? -Math.abs(Number(t.amount || 0)) : Math.abs(Number(t.amount || 0));
          const color = signedAmount >= 0 ? 'text-green-400' : 'text-rose-400';
          const signPrefix = signedAmount >= 0 ? '+' : '-';
          const dateObj = t.date ? new Date(t.date) : null;
          const dateStr = dateObj ? dateObj.toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
          const details = esc((t.details || '').trim());

          const div = document.createElement('div');
          div.className = 'flex justify-between items-center p-3 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors';
          div.innerHTML = `
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm ${color}">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                         <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                ${badge}
                                ${details ? `<span class="text-xs text-slate-400 truncate max-w-[220px]">${details}</span>` : ''}
                            </div>
                            <div class="text-[11px] text-gray-500">${dateStr}</div>
                        </div>
                    </div>
                    <div class="text-sm font-bold ${color}">${signPrefix}${NF_EUR.format(Math.abs(signedAmount))}</div>
                `;
          list.appendChild(div);
        });

      } catch (e) {
        list.innerHTML = '<div class="text-center text-rose-400 text-xs py-4">Eroare încărcare.</div>';
      }
    }

    async function lumenInsight() {
      const out = document.getElementById('lumenOut');
      const err = document.getElementById('lumenErr');
      const statsDiv = document.getElementById('lumenStats');

      if (!out) return;
      out.innerHTML = '<p class="animate-pulse">Analizez datele...</p>';
      if (err) err.classList.add('hidden');

      try {
        const res = await fetch('/api/ai/lumen_insight.php', { credentials: 'include' });
        if (!res.ok) throw new Error('err');
        const j = await res.json();
        if (!j.ok) throw new Error('err');

        // Update Stats
        if (statsDiv) statsDiv.classList.remove('hidden');
        setText('lumenTodayYield', j.today_yield_pct + '%');
        setText('lumenBalance', NF_EUR.format(j.current_balance_eur));
        setText('lumenTotalYield', j.total_yield_pct + '%');
        setText('lumenProcTime', '~' + j.avg_processing_days + ' zile');
        setText('lumenTax', j.dynamic_tax_est);
        setText('lumenInvestors', j.investors_count);

        // Update Text
        out.innerHTML = `
          <p class="mb-2"><strong class="text-white">Analiză:</strong> ${j.insight_text}</p>
        `;

        // Update processing time widget in Quick Actions too
        const procEl = document.getElementById('procTimeVal');
        if (procEl) procEl.textContent = '~' + j.avg_processing_days + ' Zile';

      } catch (e) {
        out.textContent = 'Nu am putut genera analiza momentan.';
        if (err) err.classList.remove('hidden');
      }
    }

    function calcProjections() {
      const amount = parseFloat(document.getElementById('projAmount').value || '0');
      const r = parseFloat(document.getElementById('projScenario').value);
      const n = parseInt(document.getElementById('projDays').value, 10);
      const final = +(amount * Math.pow(1 + r, n)).toFixed(2);
      const prof = +(final - amount).toFixed(2);
      setText('projFinal', NF_EUR.format(final));
      setText('projProfit', '+' + NF_EUR.format(prof));
    }

    async function refreshAll() {
      const range = document.getElementById('dateRange').value;
      setText('sumInvested', '...');
      setText('sumProfit', '...');
      setText('sumBalance', '...');

      await ensureHistoryLoaded();
      const s = computeStats(range);
      updateCharts(s.points);
      await fetchAndApplyRealSummary(range);
      calcProjections();
      await loadRecentTransactions();
    }

    document.getElementById('dateRange')?.addEventListener('change', refreshAll);
    document.getElementById('btnLumen')?.addEventListener('click', lumenInsight);
    document.getElementById('projForm')?.addEventListener('input', calcProjections);
    document.addEventListener('DOMContentLoaded', () => {
      refreshAll();
      lumenInsight();
      startPresencePing();
      startPresenceCounter();
    });


    // toast mic, folosit atât de chat cât și de alte părți, dacă e nevoie
    (function () {
      const host = document.getElementById('mentionToast');
      if (!host) return;

      if (window.__toastBootstrapped) return;
      window.__toastBootstrapped = true;


      const STATE = { max: 3, items: [] };

      window.showToast = function showToast(kind, text, opts) {
        kind = kind || 'info';
        if (!text) return;
        const ttl = (opts && opts.ttl) || (kind === 'error' ? 5000 : 3000);

        // limităm numărul de toast-uri simultane
        while (STATE.items.length >= STATE.max) {
          const old = STATE.items.shift();
          if (old && old.elem) old.elem.remove();
        }

        const card = document.createElement('div');
        card.className = 'toast-card';
        card.dataset.kind = kind;
        const icon = kind === 'error' ? '⚠️' : (kind === 'success' ? '✅' : 'ℹ️');
        card.innerHTML = '<div class="icon">' + icon + '</div><div class="text">' + text + '</div>';
        host.appendChild(card);
        STATE.items.push({ elem: card });

        setTimeout(() => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(8px)';
          setTimeout(() => {
            card.remove();
            STATE.items = STATE.items.filter(x => x.elem !== card);
          }, 220);
        }, ttl);
      };

      // helper pentru chat – alias mai scurt
      window.showChatToast = function (text, kind) {
        if (window.showToast) window.showToast(kind || 'info', text);
      };
    })();

    // Chat Comunitate: SSE + anti-spam + offline queue + mențiuni + reply + reacții
    (function () {
      // referințe principale
      const feed = document.getElementById('chatFeed');
      const form = document.getElementById('chatForm');
      let input = document.getElementById('chatInput');
      const sendBtn = document.getElementById('chatSend');
      const fileInput = document.getElementById('chatFile');
      const attachList = document.getElementById('attachList');
      const attachHint = document.getElementById('attachHint');
      const presBar = document.getElementById('chatPresenceBar');
      const typingBar = document.getElementById('chatTypingBar');
      const replyBox = document.getElementById('replyContext');
      const mentionBox = document.getElementById('mentionSuggest');
      let mentionOpen = false;
      let mentionItems = [];
      let mentionActive = 0;

      const replyUserEl = document.getElementById('replyUser');
      const replyPrevEl = document.getElementById('replyPreview');
      const replyCancel = document.getElementById('replyCancel');

      if (!feed || !form || !input) return;

      const csrfToken = document.body.dataset.csrfChat || '';
      const meName = (document.body.dataset.userName || 'Investitor').trim();
      const meId = parseInt(document.body.dataset.userId || '0', 10) || 0;

      // mici helperi
      const esc = s => (s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[m]));
      const NF_TIME = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' });
      const NF_DAY_SHORT = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short' });
      const EDIT_WINDOW_S = 120;
      const MAX_CHARS = 1000;
      const SEND_COOLDOWN = 3000; // 3s

      // index mesaje (pt reply / mențiuni / edit)
      const MSG_INDEX = new Map(); // id -> {id,user_id,user_name,body,ts}
      const MSG_ORDER = [];        // păstrăm ordinea pentru curățare

      // id-uri pentru deduplicare / lazy-load
      let lastId = +(sessionStorage.getItem('chat:lastId') || 0);
      let oldestIdLoaded = null;
      const SEEN = new Set();
      const PENDING = new Map(); // client_id -> {row,body,ts}
      let offlineWarned = false;
      let sse = null;
      let pollTimer = null;
      let loadingOlder = false;
      let noMoreOlder = false;
      const PAGE_LIMIT = 50;
      const POLL_MS = 4000;
      const MAX_DOM_MSG = 400;

      // coadă offline per user, salvată în localStorage
      const OFFLINE_KEY = `pi:chat:offlineQueue:${meId || 0}`;
      let OFFLINE_QUEUE = [];
      let chatHydrated = false; // dev: devine true după bootstrap, pentru sunete doar pe mesaje live

      // mențiuni / inbox
      let mentionUnreadCount = 0;

      let mentionNotifications = [];
      let VIEW_MENTIONS = false;
      let mentionRefreshTimer = null;

      // presence & typing
      let presState = [];
      let typingState = [];
      let typingClearT = null;
      const TYPING_COOLDOWN = 4000;
      let lastTypingSent = 0;

      // useri considerați "online" în ultimele câteva minute
      const ACTIVE_USERS = new Map();
      const ACTIVE_WINDOW_S = 180; // 3 minute
      function trackActiveFromMsg(m) {
        if (!m) return;
        const name = (m.user_name || '').trim();
        if (!name) return;
        const ts = m.ts || Math.floor(Date.now() / 1000);
        ACTIVE_USERS.set(name, ts);
      }

      function computePresenceFallback() {
        const now = Math.floor(Date.now() / 1000);
        const out = [];
        for (const [name, ts] of ACTIVE_USERS) {
          if (now - ts <= ACTIVE_WINDOW_S) {
            out.push({ user_name: name, ts });
          }
        }
        // măcar tu ești sigur online
        if (!out.some(u => u.user_name === meName)) {
          out.push({ user_name: meName, ts: now });
        }
        return out;
      }


      // reply target
      let replyTarget = null;

      // atașamente
      const ATTACHMENTS = [];

      // util scroll
      const atBottom = () => Math.abs(feed.scrollHeight - feed.scrollTop - feed.clientHeight) < 6;
      const scrollBottomNow = () => { feed.scrollTop = feed.scrollHeight; };
      const scrollBottomSmooth = () => feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });

      // ========== Mesaje noi (unread badge) ==========
      let hasUnreadBelow = false;           // există mesaje noi și userul nu e la bottom
      let unreadSeparatorInserted = false;  // separatorul „Mesaje noi" a fost inserat în această sesiune
      const newMsgsBadge = document.getElementById('chatNewMsgsBadge');

      function showNewMsgsBadge() {
        if (newMsgsBadge && !atBottom()) {
          newMsgsBadge.classList.remove('hidden');
          hasUnreadBelow = true;
        }
      }

      function hideNewMsgsBadge() {
        if (newMsgsBadge) {
          newMsgsBadge.classList.add('hidden');
        }
        hasUnreadBelow = false;
        unreadSeparatorInserted = false;
        // Elimină separatoarele „mesaje noi" vechi din DOM
        feed.querySelectorAll('.chat-unread-sep').forEach(el => el.remove());
      }

      function createUnreadSeparator() {
        if (unreadSeparatorInserted) return null;
        unreadSeparatorInserted = true;
        const sep = document.createElement('div');
        sep.className = 'chat-unread-sep';
        sep.innerHTML = '<span>mesaje noi</span>';
        return sep;
      }

      // random client id
      const genCID = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

      /* -------------------------- funcții de timp -------------------------- */
      function formatRelativeTime(tsSec) {
        if (!tsSec) return 'acum';
        const nowSec = Math.floor(Date.now() / 1000);
        let diff = nowSec - tsSec;
        const past = diff >= 0;
        diff = Math.abs(diff);

        if (diff < 10) return past ? 'acum' : 'în câteva secunde';
        if (diff < 60) return past ? 'acum câteva secunde' : 'în curând';

        const min = Math.round(diff / 60);
        if (min < 60) return past ? `acum ${min} min` : `în ${min} min`;

        const h = Math.round(min / 60);
        if (h < 24) return past ? `acum ${h} ore` : `în ${h} ore`;

        const d = Math.round(h / 24);
        if (d === 1 && past) return 'ieri';
        if (d < 7) return past ? `acum ${d} zile` : `în ${d} zile`;

        const dObj = new Date(tsSec * 1000);
        return NF_DAY_SHORT.format(dObj) + ', ' + NF_TIME.format(dObj);
      }

      function refreshRelativeTimes() {
        feed.querySelectorAll('.time[data-time][data-ts]').forEach(el => {
          const ts = parseInt(el.dataset.ts || '0', 10) || 0;
          el.textContent = formatRelativeTime(ts);
        });
      }


      function canEditNowTs(tsSec) {
        const nowSec = Math.floor(Date.now() / 1000);
        const diff = nowSec - tsSec;
        return diff >= 0 && diff <= EDIT_WINDOW_S;
      }

      function refreshEditControls() {
        const nowSec = Math.floor(Date.now() / 1000);
        feed.querySelectorAll('.msg[data-mine="1"]').forEach(row => {
          const tsSec = parseInt(row.dataset.ts || '0', 10) || 0;
          const diff = tsSec ? (nowSec - tsSec) : EDIT_WINDOW_S + 1;
          const editBtns = row.querySelectorAll('.edit-msg-btn, .delete-msg-btn');
          if (!editBtns.length) return;
          if (diff > EDIT_WINDOW_S || diff < 0) {
            editBtns.forEach(b => b.remove());
          }
        });
      }

      function tickTimeUI() {
        refreshRelativeTimes();
        refreshEditControls();
      }
      setInterval(tickTimeUI, 15000);

      /* -------------------------- normalizare mesaj (centralizat) -------------------------- */
      function normalizeMsg(raw) {
        if (!raw) return null;
        // Asigurăm structura de bază
        const m = {
          id: raw.id | 0,
          client_id: raw.client_id || raw.cid || null,
          user_id: raw.user_id || null,
          user_name: raw.user_name || '—',
          body: raw.body || raw.text || '',
          ts: raw.ts || Math.floor(Date.now() / 1000),
          edited: !!(raw.edited || raw.edited_at),
          edited_at: raw.edited_at | 0,
          deleted: !!(raw.deleted || raw.deleted_at),
          deleted_at: raw.deleted_at | 0,
          mentions: Array.isArray(raw.mentions) ? raw.mentions : [],
          reply_to: raw.reply_to || null,
          reply: raw.reply || null,

          // CRITIC: Păstrăm atașamentele și preview-ul
          attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
          link_preview: (raw.link_preview && typeof raw.link_preview === 'object') ? raw.link_preview : null
        };
        // fallback mentions if only names
        if (m.mentions.length === 0 && Array.isArray(raw.mention_names)) {
          m.mentions = raw.mention_names.map(n => ({ name: n }));
        }
        return m;
      }

      /* -------------------------- indexare mesaje -------------------------- */
      function indexMessage(m) {
        if (!m || !m.id) return;
        // Index doar datele necesare pentru reply lookup
        const entry = {
          id: m.id | 0,
          user_id: m.user_id || null,
          user_name: m.user_name || '',
          body: m.body || '',
          ts: m.ts || 0
        };
        if (!MSG_INDEX.has(entry.id)) MSG_ORDER.push(entry.id);
        MSG_INDEX.set(entry.id, entry);

        if (MSG_ORDER.length > 2000) {
          const drop = MSG_ORDER.shift();
          MSG_INDEX.delete(drop);
        }
      }

      function resolveReplyMeta(m) {
        const rid = m.reply_to || (m.reply && m.reply.id) || null;
        if (!rid) return null;

        const cached = MSG_INDEX.get(rid) || {};
        const fallback = m.reply || {};
        const user = cached.user_name || fallback.user_name || fallback.user || '';
        const uid = cached.user_id || fallback.user_id || null;
        const body = cached.body || fallback.body || '';

        return { id: rid, user_id: uid, user_name: user, body };
      }

      /* -------------------------- day seps -------------------------- */
      const NF_DAY = new Intl.DateTimeFormat('ro-RO', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      const dayKey = ts => {
        const d = new Date((ts || 0) * 1000);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      const dayLbl = ts => NF_DAY.format(new Date((ts || 0) * 1000));

      function daySepNode(ts) {
        const div = document.createElement('div');
        div.className = 'chat-sep';
        div.dataset.day = dayKey(ts);
        div.innerHTML = '<span>' + esc(dayLbl(ts)) + '</span>';
        return div;
      }

      function lastMsgRow() {
        for (let i = feed.children.length - 1; i >= 0; i--) {
          const el = feed.children[i];
          if (el.classList.contains('chat-sep')) continue;
          return el;
        }
        return null;
      }

      function ensureDaySepAppend(ts) {
        const need = dayKey(ts);
        let lastDay = null;

        for (let i = feed.children.length - 1; i >= 0; i--) {
          const el = feed.children[i];
          if (el.classList.contains('chat-sep')) {
            lastDay = el.dataset.day || null;
            break;
          }
          if (el.dataset && el.dataset.ts) {
            lastDay = dayKey(+el.dataset.ts || 0);
            break;
          }
        }

        if (need !== lastDay) feed.appendChild(daySepNode(ts));
      }

      /* -------------------------- reply -------------------------- */
      function renderReplyContext() {
        if (!replyBox) return;
        if (replyTarget && replyTarget.id) {
          replyBox.classList.remove('hidden');
          if (replyUserEl) replyUserEl.textContent = replyTarget.user || 'mesaj';
          if (replyPrevEl) replyPrevEl.textContent = replyTarget.body || '';
        } else {
          replyBox.classList.add('hidden');
        }
      }

      function setReplyTarget(meta) {
        if (!meta || !meta.id) return;
        replyTarget = {
          id: meta.id,
          user: meta.user || meta.user_name || '',
          body: (meta.body || '').trim()
        };
        renderReplyContext();
        input.focus();
      }

      function clearReplyTarget() {
        replyTarget = null;
        renderReplyContext();
      }

      replyCancel?.addEventListener('click', (e) => {
        e.preventDefault();
        clearReplyTarget();
      });

      function startReplyFromRow(row) {
        if (!row) return;
        const msgId = parseInt(row.dataset.msgId || '0', 10);
        if (!msgId) return;
        const meta = {
          id: msgId,
          user: row.dataset.user || '',
          body: (row.dataset.bodyRaw || row.querySelector('[data-body]')?.textContent || '').trim()
        };
        setReplyTarget(meta);
      }

      /* -------------------------- mențiuni -------------------------- */
      const norm = s => (s || '').normalize('NFKD').toLowerCase();

      function isMention(m) {
        if (Array.isArray(m.mentions) && m.mentions.length) {
          for (const it of m.mentions) {
            if (meId && ((it.user_id | 0) === meId)) return true;
            if (it.name && norm(it.name) === norm(meName)) return true;
          }
        }
        const rx = /(^|\s)@([^\s,.!?;:]+)/gim;
        let mm; const body = (m.body || '');
        while ((mm = rx.exec(body))) {
          const token = mm[2] || '';
          if (norm(token) === norm(meName)) return true;
        }
        return false;
      }

      function isReplyToMe(m) {
        const meta = resolveReplyMeta(m);
        if (!meta || !meId) return false;
        const targetId = meta.user_id || (MSG_INDEX.get(meta.id || 0)?.user_id) || null;
        return !!targetId && targetId === meId;
      }

      function updateMentionDot() {
        const dot = document.getElementById('mentionDot');
        if (!dot) return;
        if (mentionUnreadCount > 0) {
          dot.classList.remove('hidden');
          dot.setAttribute('aria-hidden', 'false');
        } else {
          dot.classList.add('hidden');
          dot.setAttribute('aria-hidden', 'true');
        }
      }


      function renderMentionInbox() {
        const host = document.getElementById('mentionInbox');
        if (!host) return;

        host.innerHTML = '';

        if (!mentionNotifications.length) {
          host.innerHTML = '<div class="mention-empty">nu ai notificări necitite.</div>';
          return;
        }

        mentionNotifications.forEach(n => {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'mention-item';

          const kindLabel = n.kind === 'reply' ? 'ți-a răspuns direct' : 'te-a menționat';
          const kindClass = n.kind === 'reply' ? 'badge-reply' : 'badge-mention';
          const tsRel = formatRelativeTime(n.ts || 0);
          const uname = n.user_name || '—';
          const initial = (uname.trim()[0] || '•').toUpperCase();

          row.innerHTML = `
      <div class="mention-card">
        <div class="mention-avatar">${esc(initial)}</div>
        <div class="mention-main">
          <div class="mention-header">
            <span class="mention-user">${esc(uname)}</span>
            <span class="mention-time">${esc(tsRel)}</span>
          </div>
          <div class="mention-meta">
            <span class="mention-kind ${kindClass}">${esc(kindLabel)}</span>
          </div>
          <div class="mention-body">${esc(n.body || '')}</div>
        </div>
      </div>
    `;

          row.addEventListener('click', () => {
            if (n.message_id) jumpToAround(n.message_id);
            if (n.notif_id) markMentionNotifications([n.notif_id]);
            setView(false); // închide overlay-ul după click
          });

          host.appendChild(row);
        });
      }


      async function markMentionNotifications(ids) {
        if (!ids || !ids.length) return;
        try {
          const r = await fetch('/api/chat/mentions_mark_read.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          });
          const j = await r.json();
          if (j && j.ok) {
            mentionUnreadCount = j.unread_count || 0;
            updateMentionDot();
            await loadMentionInbox(false);
          }
        } catch { }
      }

      async function markAllMentionsRead() {
        const ids = mentionNotifications.map(n => n.notif_id).filter(Boolean);
        if (!ids.length) return;
        await markMentionNotifications(ids);
      }

      async function loadMentionInbox(markRead) {
        try {
          const r = await fetch('/api/chat/mentions_unread.php', { credentials: 'include' });
          const j = await r.json();
          if (!j || !j.ok) return;

          // x -> y: înainte luai direct j.items
          // acum păstrezi doar mențiunile marcate ca „necitite”
          const allItems = Array.isArray(j.items) ? j.items : [];

          // aici poți ajusta condițiile în funcție de ce trimite backend-ul tău
          const unreadItems = allItems.filter(n =>
            !n.read_ts &&          // nu are timestamp de citire
            !n.read_at &&          // nu are câmp read_at
            !n.is_read &&          // nu este marcat explicit ca „citit”
            !n.read                // și nici flag simplu read
          );

          mentionNotifications = unreadItems;
          mentionUnreadCount = unreadItems.length;

          renderMentionInbox();
          updateMentionDot();

          // dacă deschizi overlay-ul în modul „markRead = true”,
          // marchezi doar ce e încă necitit
          if (markRead && mentionNotifications.length) {
            await markAllMentionsRead();
          }
        } catch { }
      }



      function scheduleMentionRefresh() {
        if (mentionRefreshTimer) clearTimeout(mentionRefreshTimer);
        mentionRefreshTimer = setTimeout(() => loadMentionInbox(false), 400);
      }

      function setView(mentionsMode) {
        VIEW_MENTIONS = !!mentionsMode;

        const chatCard = feed.closest('[data-widget-id="chat"]');
        if (chatCard) {
          chatCard.classList.toggle('view-mentions', VIEW_MENTIONS);
        }

        const overlay = document.getElementById('mentionsOverlay');
        if (overlay) {
          overlay.classList.toggle('hidden', !VIEW_MENTIONS);
        }

        document.getElementById('tabAll')?.classList.toggle('active', !VIEW_MENTIONS);
        document.getElementById('tabMent')?.classList.toggle('active', VIEW_MENTIONS);

        // important: doar încărcăm lista, nu o marcăm automat ca „citită”
        if (VIEW_MENTIONS) {
          loadMentionInbox(false);
        }
      }



      document.getElementById('tabAll')?.addEventListener('click', () => setView(false));
      document.getElementById('tabMent')?.addEventListener('click', () => setView(true));
      document.getElementById('btnMentionsReadAll')?.addEventListener('click', () => markAllMentionsRead());

      document.getElementById('mentionBell')?.addEventListener('click', () => {
        // dacă e deja deschis inbox-ul de mențiuni, îl închidem
        if (VIEW_MENTIONS) {
          setView(false);
          return;
        }
        // altfel îl deschidem; setView(true) va face loadMentionInbox(false)
        setView(true);
      });



      // escape închide rapid inbox-ul de mențiuni, dacă e deschis
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && VIEW_MENTIONS) {
          setView(false);
        }
      });

      // click în afara cardului de chat închide pagina de mențiuni
      document.addEventListener('click', (e) => {
        if (!VIEW_MENTIONS) return;

        const overlay = document.getElementById('mentionsOverlay');
        const chatCard = document.querySelector('[data-widget-id="chat"]');

        // dacă din orice motiv nu avem elementele, nu facem nimic
        if (!overlay || overlay.classList.contains('hidden') || !chatCard) return;

        // dacă click-ul NU este în interiorul cardului de chat, închidem mențiunile
        if (!chatCard.contains(e.target)) {
          setView(false);
        }
      });



      /* -------------------------- presence & typing -------------------------- */
      function renderPresence(list) {
        // dacă primim listă de la server, o folosim direct
        if (Array.isArray(list) && list.length) {
          presState = list;
        } else if (!presState || !presState.length) {
          // fallback doar dacă nu avem nimic
          presState = computePresenceFallback();
        }

        const liveEl = document.getElementById('chatLive');
        const total = presState.length || 0;

        if (liveEl) {
          liveEl.textContent = `${total} online`;
          liveEl.title = total === 1
            ? '1 utilizator online în chat'
            : `${total} utilizatori online în chat`;
        }

        if (!presBar) return;

        const maxVisible = 8;
        const who = (presState || []).slice(0, maxVisible);

        const pillsHtml = who.map(u => {
          const name = (u.user_name || '—').trim();
          const initial = name.charAt(0).toUpperCase() || '?';
          const rel = u.ts ? formatRelativeTime(u.ts) : 'acum';

          return `
            <div class="presence-pill"
                 title="${esc(name)} – activ ${esc(rel)}">
              <div class="presence-avatar">${esc(initial)}</div>
              <div class="presence-meta">
                <span class="presence-name">${esc(name)}</span>
                <span class="presence-status">online</span>
              </div>
            </div>`;
        }).join('');

        let extraHtml = '';
        if (total > maxVisible) {
          const extra = total - maxVisible;
          extraHtml = `
            <div class="presence-pill presence-more"
                 title="${extra} utilizatori în plus">
              <span class="presence-more-label">+${extra}</span>
            </div>`;
        }

        presBar.innerHTML = pillsHtml + extraHtml;
      }

      // expunem funcția către counter-ul de prezență
      window.__chatRenderPresence = renderPresence;





      function renderTyping(list) {
        typingState = Array.isArray(list) ? list : [];
        if (!typingBar) return;
        const names = typingState
          .map(u => u.user_name || '—')
          .filter(n => n !== meName);
        if (!names.length) {
          typingBar.textContent = '';
          return;
        }
        const txt = names.length === 1
          ? `${names[0]} tastează…`
          : names.length === 2
            ? `${names[0]} și ${names[1]} tastează…`
            : `${names[0]}, ${names[1]} și alții tastează…`;
        typingBar.textContent = txt;
        clearTimeout(typingClearT);
        typingClearT = setTimeout(() => { typingBar.textContent = ''; }, 6000);
      }

      async function sendTypingPing() {
        const now = Date.now();
        if (now - lastTypingSent < TYPING_COOLDOWN) return;
        lastTypingSent = now;
        try {
          await fetch('/api/chat/typing.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
            body: JSON.stringify({ csrf_token: csrfToken || '' })
          });
        } catch { }
      }

      /* -------------------------- menționare / randare text -------------------------- */
      function renderMentionsInBody(body, meta) {
        let html = esc(body || '');
        const me = meName;

        if (Array.isArray(meta) && meta.length) {
          const items = [...meta].sort((a, b) => (b.name || '').length - (a.name || '').length);
          for (const it of items) {
            if (!it || !it.name) continue;
            const name = it.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const rg = new RegExp(`(^|[^\\w])@(${name})(?=\\b)`, 'g');
            html = html.replace(rg, (_, $1, $2) =>
              `${$1}<span class="mention ${$2 === me ? 'mention-me' : ''}">@${$2}</span>`
            );
          }
        } else {
          html = html.replace(/(^|[^\w])@([A-Za-z0-9._-]{2,32})/g, (_, $1, $2) => {
            const cls = ($2 === me) ? ' mention-me' : '';
            return `${$1}<span class="mention${cls}">@${$2}</span>`;
          });
        }
        return html;
      }

      function renderAttachments(list) {
        // debug temporar
        console.log('renderAttachments list = ', list);
        if (!Array.isArray(list) || !list.length) return '';

        const parts = [];
        for (const att of list) {
          if (!att || !att.url) continue;
          const url = esc(att.url);
          const name = esc(att.name || 'fișier');
          const mime = esc(att.mime || '');
          const kind = att.kind || 'file';

          if (kind === 'image') {
            parts.push(`
              <div class="chat-attach chat-attach-image">
                <a href="${url}" target="_blank" rel="noopener">
                  <img src="${url}" alt="${name}" loading="lazy" />
                </a>
              </div>
            `);
          } else if (kind === 'video') {
            parts.push(`
              <div class="chat-attach chat-attach-video">
                <video controls src="${url}"></video>
              </div>
            `);
          } else if (kind === 'audio') {
            parts.push(`
              <div class="chat-attach chat-attach-audio">
                <audio controls src="${url}"></audio>
              </div>
            `);
          } else {
            parts.push(`
              <div class="chat-attach chat-attach-file">
                <a href="${url}" target="_blank" rel="noopener">📎 ${name}</a>
              </div>
            `);
          }
        }
        if (!parts.length) return '';
        // Container grid pentru atașamente
        return `<div class="attachments-grid">${parts.join('')}</div>`;
      }

      function renderLinkPreview(preview) {
        if (!preview || typeof preview !== 'object') return '';

        // 1. Embed Logic (YouTube / TikTok)
        // Verificăm structura embed: { type: 'youtube', src: '...' }
        if (preview.embed && preview.embed.src && preview.embed.type === 'youtube') {
          const e = preview.embed;
          const title = esc(preview.title || 'Video');

          return `
            <div class="chat-link-preview chat-link-preview-youtube">
              <div class="clp-player">
                <iframe 
                  src="${esc(e.src)}" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen
                ></iframe>
              </div>
              <div class="clp-meta">
                <div class="clp-title">${title}</div>
                <div class="clp-site">YouTube</div>
              </div>
            </div>
          `;
        }

        // 2. Standard Card Logic
        const url = esc(preview.url || '');
        if (!url) return '';

        const title = esc(preview.title || preview.url || 'Previzualizare link');
        const desc = preview.description
          ? `<div class="link-desc">${esc(preview.description)}</div>`
          : '';
        const site = preview.site_name || preview.provider || '';
        const siteHtml = site ? `<div class="link-site">${esc(site)}</div>` : '';
        const imgHtml = preview.image
          ? `<div class="link-img"><img src="${esc(preview.image)}" alt="" loading="lazy"/></div>`
          : '';

        return `
          <a href="${url}" target="_blank" rel="noopener" class="link-preview">
            <div class="link-body">
              ${imgHtml}
              <div class="link-text">
                <div class="link-title">${title}</div>
                ${desc}
                ${siteHtml}
              </div>
            </div>
          </a>
        `;
      }

      /* -------------------------- reacții simple -------------------------- */
      // Map pentru a tine evidenta reactiilor proprii: msgId -> Set(emoji)
      const myReactionsMap = new Map();

      async function toggleReaction(messageId, emoji) {
        const mySet = myReactionsMap.get(messageId) || new Set();
        const alreadyReacted = mySet.has(emoji);
        const endpoint = alreadyReacted ? '/api/chat/unreact.php' : '/api/chat/react.php';

        try {
          const r = await fetch(endpoint, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
            body: JSON.stringify({ message_id: messageId, emoji, csrf_token: csrfToken || '' })
          });
          const j = await r.json().catch(() => null);
          if (!r.ok || !j || !j.ok) throw new Error('failed');

          // Update local state
          if (alreadyReacted) {
            mySet.delete(emoji);
          } else {
            mySet.add(emoji);
          }
          myReactionsMap.set(messageId, mySet);

          // Refresh UI for this message
          await refreshReactBar(messageId);
        } catch {
          console.warn('[reactions] nu am putut aplica reacția pentru msg', messageId);
        }
      }

      async function refreshReactBar(messageId) {
        try {
          const r = await fetch(`/api/chat/reactions_bulk.php?ids=${messageId}`, { credentials: 'include' });
          const j = await r.json().catch(() => null);
          if (!j || !j.ok || !j.items || !j.items.length) return;

          const item = j.items.find(x => x.message_id === messageId);
          if (!item) return;

          const counts = item.counts || {};
          const row = feed.querySelector(`.msg[data-msg-id="${messageId}"]`);
          if (!row) return;

          const mySet = myReactionsMap.get(messageId) || new Set();
          const reactBar = row.querySelector('.react-bar');
          if (!reactBar) return;

          reactBar.querySelectorAll('.react-btn').forEach(btn => {
            const emo = btn.dataset.emoji;
            const cnt = counts[emo] || 0;
            const isMine = mySet.has(emo);

            // Update button text with count
            btn.textContent = cnt > 0 ? `${emo} ${cnt}` : emo;

            // Toggle reacted class
            btn.classList.toggle('reacted', isMine);
          });
        } catch {
          console.warn('[reactions] nu am putut actualiza react-bar pentru msg', messageId);
        }
      }

      // Încarcă reacțiile pentru toate mesajele vizibile (la init + după load older)
      async function loadReactionsForVisibleMessages() {
        const rows = feed.querySelectorAll('.msg[data-msg-id]');
        if (!rows.length) return;

        const ids = Array.from(rows).map(r => parseInt(r.dataset.msgId || '0', 10)).filter(id => id > 0);
        if (!ids.length) return;

        try {
          const r = await fetch(`/api/chat/reactions.php?ids=${ids.join(',')}`, { credentials: 'include' });
          const j = await r.json().catch(() => null);
          if (!j || !j.ok || !Array.isArray(j.items)) return;

          for (const item of j.items) {
            const msgId = item.message_id;
            const counts = item.counts || {};
            const mine = item.mine || [];

            // Update myReactionsMap
            myReactionsMap.set(msgId, new Set(mine));

            // Update UI
            const row = feed.querySelector(`.msg[data-msg-id="${msgId}"]`);
            if (!row) continue;

            const reactBar = row.querySelector('.react-bar');
            if (!reactBar) continue;

            reactBar.querySelectorAll('.react-btn').forEach(btn => {
              const emo = btn.dataset.emoji;
              const cnt = counts[emo] || 0;
              const isMine = mine.includes(emo);

              btn.textContent = cnt > 0 ? `${emo} ${cnt}` : emo;
              btn.classList.toggle('reacted', isMine);
            });
          }
        } catch {
          console.warn('[reactions] nu am putut încărca reacțiile inițiale');
        }
      }

      function attachReactHandlers(row) {
        row.querySelectorAll('.react-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const emoji = btn.dataset.emoji;
            const msgId = parseInt(row.dataset.msgId || '0', 10);
            if (!msgId || !emoji) return;
            toggleReaction(msgId, emoji);
          });
        });
      }

      /* -------------------------- randare mesaj -------------------------- */
      function buildRow(m, mine = false, pending = false) {
        const row = document.createElement('div');
        row.className = 'msg ' + (mine ? 'mine' : 'theirs');
        if (m.id) row.dataset.msgId = String(m.id | 0);

        const tsSec = m.ts || Math.floor(Date.now() / 1000);
        row.dataset.ts = String(tsSec);
        row.dataset.user = String(m.user_name || '');
        row.dataset.mine = mine ? '1' : '0';
        row.dataset.bodyRaw = m.body || '';
        // Track edited_at for sync detection
        row.dataset.editedAt = String(m.edited_at || 0);

        const isDeleted = !!m.deleted;
        const tsRel = formatRelativeTime(tsSec);
        const tsAbs = NF_TIME.format(new Date(tsSec * 1000));
        const replyToMe = !isDeleted && isReplyToMe(m);
        const mentioned = !isDeleted && (isMention(m) || replyToMe);
        const showUser = !mine; // nu afișăm numele pe mesajele mele
        const userHtml = showUser
          ? `<span class="user">${esc(m.user_name || '—')}</span>`
          : '';

        if (mentioned) row.classList.add('has-mention');

        const mentionLabel = replyToMe ? 'ți-a răspuns' : (isMention(m) ? 'te-a menționat' : '');

        const replyMeta = !isDeleted ? resolveReplyMeta(m) : null;
        let replyHTML = '';
        if (replyMeta && replyMeta.id) {
          row.dataset.replyId = String(replyMeta.id);
          const userLabel = replyMeta.user_name || 'mesaj';
          const preview = esc((replyMeta.body || '').slice(0, 220));
          replyHTML = `
            <button type="button" class="reply-ref" data-reply-jump="${replyMeta.id}">
              <div class="reply-head">către ${esc(userLabel)}</div>
              <div class="reply-preview">${preview || '—'}</div>
            </button>
          `;
        }

        const bodyHTML = isDeleted
          ? '<span class="deleted">mesaj șters</span>'
          : renderMentionsInBody(m.body || '', m.mentions || null);

        const attachHTML = !isDeleted ? renderAttachments(m.attachments || []) : '';
        const previewHTML = !isDeleted ? renderLinkPreview(m.link_preview || null) : '';

        const canEditNow = mine && !pending && !isDeleted && canEditNowTs(tsSec);
        const editedLabel = m.edited ? '<span class="edited">(editat)</span>' : '';
        const deletedLabel = isDeleted ? '<span class="deleted-flag">[mesaj șters]</span>' : '';

        let actionsHtml = '';
        if (!isDeleted) {
          actionsHtml += `
            <button type="button" class="reply-msg-btn" title="răspunde"><span>↩</span></button>
          `;
        }
        if (canEditNow) {
          actionsHtml += `
            <button type="button" class="edit-msg-btn" title="editează">✏</button>
            <button type="button" class="delete-msg-btn" title="șterge">🗑</button>
          `;
        }

        row.innerHTML = `
  <div class="bubble">
    ${replyHTML}
    <div class="meta" data-time data-ts="${tsSec}" title="${esc(tsAbs)}">
      ${userHtml}
      <span class="time">${esc(tsRel)}</span>
      ${editedLabel}
      ${deletedLabel}
      ${mentionLabel ? `<span class="mention-chip">${esc(mentionLabel)}</span>` : ''}
      ${pending ? '<span class="pending" data-status>se trimite…</span>' : ''}
      ${actionsHtml}
    </div>
    <div data-body class="body">${bodyHTML}</div>
    ${attachHTML}
    ${previewHTML}
    <div class="react-bar">

              <button type="button" class="react-btn" data-emoji="👍">👍</button>
              <button type="button" class="react-btn" data-emoji="❤️">❤️</button>
              <button type="button" class="react-btn" data-emoji="🔥">🔥</button>
            </div>
          </div>
        `;

        attachReactHandlers(row);

        // click pe reply
        row.querySelectorAll('.reply-msg-btn').forEach(b => {
          b.addEventListener('click', () => startReplyFromRow(row));
        });
        // click pe previzualizare reply (salt)
        row.querySelectorAll('[data-reply-jump]').forEach(b => {
          b.addEventListener('click', () => {
            const mid = parseInt(b.dataset.replyJump || '0', 10);
            if (mid) jumpToAround(mid);
          });
        });

        // edit / delete
        row.querySelectorAll('.edit-msg-btn').forEach(b => {
          b.addEventListener('click', () => startEditRow(row));
        });
        row.querySelectorAll('.delete-msg-btn').forEach(b => {
          b.addEventListener('click', () => deleteRow(row));
        });

        return row;
      }

      function canGroup(prevRow, m, mine) {
        if (!prevRow) return false;
        if (prevRow.classList.contains('chat-sep')) return false;
        const sameUser = (prevRow.dataset.user || '') === (m.user_name || '');
        const sameSide = (prevRow.dataset.mine || '0') === (mine ? '1' : '0');
        return sameUser && sameSide;
      }

      function joinWithPrev(prevRow, curRow) {
        prevRow.classList.add('msg-join-bottom');
        curRow.classList.add('msg-join-top');
      }




      function trimSeen() {
        if (SEEN.size <= 6000) return;
        let n = 0;
        for (const x of SEEN) {
          SEEN.delete(x);
          if (++n >= 1000) break;
        }
      }

      function trimDOMWindow(anchor) {
        const rows = Array.from(feed.querySelectorAll('.msg'));
        const total = rows.length;
        if (total <= MAX_DOM_MSG) return;
        const removeCount = total - MAX_DOM_MSG;

        if (anchor === 'top') {
          // tăiem din coadă (partea de jos)
          for (let i = total - 1, removed = 0; i >= 0 && removed < removeCount; i--) {
            const row = rows[i];
            const sep = row.previousElementSibling;
            row.remove();
            removed++;
            if (sep && sep.classList && sep.classList.contains('chat-sep') &&
              (!sep.nextElementSibling || !sep.nextElementSibling.classList.contains('msg'))) {
              sep.remove();
            }
          }
        } else {
          // tăiem din vârf (mesajele cele mai vechi)
          for (let i = 0, removed = 0; i < total && removed < removeCount; i++) {
            const row = rows[i];
            const sep = row.previousElementSibling;
            row.remove();
            removed++;
            if (sep && sep.classList && sep.classList.contains('chat-sep') &&
              (!sep.nextElementSibling || !sep.nextElementSibling.classList.contains('msg'))) {
              sep.remove();
            }
          }
        }

        Array.from(feed.querySelectorAll('.chat-sep')).forEach(sep => {
          const next = sep.nextElementSibling;
          if (!next || !next.classList.contains('msg')) sep.remove();
        });
      }

      /* -------------------------- pending / offline -------------------------- */
      function markPendingOffline(cid) {
        const p = PENDING.get(cid);
        if (!p?.row) return;
        const s = p.row.querySelector('[data-status]');
        if (s) {
          s.textContent = 'offline (în coadă)…';
          s.classList.add('offline');
        }
        p.row.classList.add('msg-pending-offline');
      }

      function markPendingSending(cid) {
        const p = PENDING.get(cid);
        if (!p?.row) return;
        const s = p.row.querySelector('[data-status]');
        if (s) {
          s.textContent = 'se trimite…';
          s.classList.remove('offline');
        }
        p.row.classList.add('msg-pending');
      }

      function notifyOfflineOnce() {
        if (offlineWarned) return;
        offlineWarned = true;
        showChatToast('nu ai conexiune la internet. mesajele rămân în coadă și se trimit automat când revine conexiunea.', 'info');
      }

      function loadOfflineQueue() {
        try {
          const raw = localStorage.getItem(OFFLINE_KEY);
          if (!raw) return;
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) OFFLINE_QUEUE = arr;
        } catch { }
      }

      function saveOfflineQueue() {
        try {
          if (!OFFLINE_QUEUE.length) {
            localStorage.removeItem(OFFLINE_KEY);
            return;
          }
          const slim = OFFLINE_QUEUE.slice(-50);
          localStorage.setItem(OFFLINE_KEY, JSON.stringify(slim));
        } catch { }
      }

      function queueOffline(payload) {
        if (!payload || !payload.cid) return;
        if (OFFLINE_QUEUE.some(x => x.cid === payload.cid)) return;

        OFFLINE_QUEUE.push({
          cid: payload.cid,
          text: payload.txt,
          ts: payload.ts,
          mentions: payload.mentionsPayload || [],
          mention_names: payload.mentionsNames || [],
          reply_to: payload.reply_to || null,
          reply_preview: payload.reply_preview || null,
          attachments: Array.isArray(payload.attachments) ? payload.attachments : []
        });

        saveOfflineQueue();
        markPendingOffline(payload.cid);
        notifyOfflineOnce();
      }

      /* -------------------------- pending UI + confirm -------------------------- */
      function renderPending(cid, text, tsSec, mentionNames, replyMeta, attachments) {
        const meta = {
          id: null,
          user_id: meId || null,
          user_name: meName || 'Tu',
          body: text,
          ts: tsSec,
          mentions: Array.isArray(mentionNames)
            ? mentionNames.map(n => ({ user_id: null, name: n }))
            : [],
          reply_to: replyMeta && replyMeta.id ? replyMeta.id : null,
          reply: replyMeta || null,
          attachments: attachments || []
        };

        // și pending-ul te marchează ca "online"
        trackActiveFromMsg(meta);
        renderPresence();

        const row = buildRow(meta, true, true);

        const wasBottom = atBottom();
        ensureDaySepAppend(tsSec);
        const prev = lastMsgRow();
        if (prev && canGroup(prev, meta, true)) joinWithPrev(prev, row);
        feed.appendChild(row);
        if (wasBottom) scrollBottomNow();
        PENDING.set(cid, { row, body: text, ts: tsSec });
        return row;
      }

      function confirmPending(cid, mServer) {
        const pending = PENDING.get(cid);
        PENDING.delete(cid);

        // Folosim normalizarea centralizată
        const meta = normalizeMsg(mServer || {});
        const id = meta.id;

        // marcam mesajul ca "văzut", ca să nu mai fie adăugat a doua oară
        if (id) {
          SEEN.add(id);
          trimSeen();
          lastId = Math.max(lastId, id);
          sessionStorage.setItem('chat:lastId', String(lastId));
          if (oldestIdLoaded === null || id < oldestIdLoaded) {
            oldestIdLoaded = id;
          }
        }

        // dacă dintr-un motiv nu mai avem rând pending, îl adăugăm normal
        if (!pending || !pending.row) {
          if (id) appendMsg(meta);
          return;
        }

        const row = pending.row;
        row.classList.remove('msg-pending', 'msg-pending-offline');
        row.dataset.msgId = String(id || '');
        row.dataset.ts = String(meta.ts);
        row.dataset.user = meta.user_name || meName;

        // indexare mesaje
        indexMessage(meta);

        // Reconstruim rândul cu datele finale (folosind meta normalizat care are attachments/preview)
        const bubble = buildRow(meta, true, false);
        row.innerHTML = bubble.innerHTML;
        // Reatașăm event listeners
        attachRowListeners(row);
      }

      async function flushOfflineQueue() {
        if (!OFFLINE_QUEUE.length || !navigator.onLine) return;
        offlineWarned = false;

        const items = [...OFFLINE_QUEUE];
        for (const item of items) {
          const { cid, text, ts, mentions, mention_names, reply_to, reply_preview, attachments } = item;
          // check valid
          if (!cid || (!text && (!attachments || !attachments.length))) continue;

          if (!PENDING.has(cid)) {
            renderPending(
              cid,
              text,
              ts || Math.floor(Date.now() / 1000),
              Array.isArray(mention_names) ? mention_names : [],
              reply_preview ? { body: reply_preview, id: reply_to } : (reply_to ? { id: reply_to } : null),
              Array.isArray(attachments) ? attachments : []
            );
          } else {
            markPendingSending(cid);
          }

          try {
            const r = await fetch('/api/chat/send.php', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
              body: JSON.stringify({
                text,
                client_id: cid,
                mentions: Array.isArray(mentions) ? mentions : [],
                mention_names: Array.isArray(mention_names) ? mention_names : [],
                attachments: Array.isArray(attachments) ? attachments : [],
                reply_to: reply_to || null,
                reply_preview: reply_preview || null,
                csrf_token: csrfToken || ''
              })
            });
            const j = await r.json().catch(() => null);

            if (r.ok && j && j.ok) {
              OFFLINE_QUEUE = OFFLINE_QUEUE.filter(x => x.cid !== cid);
              saveOfflineQueue();
              if (!sse || sse.readyState !== 1) {
                await pullLatest();
              }
            } else if (j && (j.error === 'csrf_invalid' || j.error === 'unauthorized')) {
              showChatToast('sesiunea a expirat. reîncarcă pagina pentru a trimite coada offline.', 'error');
              break;
            } else if (j && (j.error === 'rate_limited' || j.error === 'throttled')) {
              break;
            } else {
              continue;
            }
          } catch {
            break;
          }
        }
      }

      /* -------------------------- atașamente (upload) -------------------------- */
      function renderAttachList() {
        if (!attachList) return;
        attachList.innerHTML = '';
        if (!ATTACHMENTS.length) {
          attachList.classList.add('hidden');
          return;
        }
        attachList.classList.remove('hidden');
        ATTACHMENTS.forEach((att, idx) => {
          const card = document.createElement('div');
          card.className = 'attach-card';
          const icon = att.kind === 'image'
            ? '🖼️' : att.kind === 'video'
              ? '🎬' : att.kind === 'audio'
                ? '🎵' : '📎';
          card.innerHTML = `
            <span class="icon">${icon}</span>
            <span class="name">${esc(att.name || 'fișier')}</span>
            <button type="button" data-remove="${idx}">x</button>
          `;
          card.querySelector('[data-remove]')?.addEventListener('click', () => {
            ATTACHMENTS.splice(idx, 1);
            renderAttachList();
          });
          attachList.appendChild(card);
        });
      }

      function clearAttachments() {
        ATTACHMENTS.splice(0, ATTACHMENTS.length);
        renderAttachList();
      }

      async function uploadAttachment(file) {
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('csrf_token', csrfToken || '');
          attachHint?.classList.add('busy');
          const r = await fetch('/api/chat/upload.php', {
            method: 'POST',
            body: fd,
            credentials: 'include'
          });
          const j = await r.json().catch(() => null);
          if (j && j.ok && j.attachment) {
            if (ATTACHMENTS.length >= 5) {
              showChatToast('maxim 5 atașamente per mesaj.', 'info');
              return;
            }
            ATTACHMENTS.push(j.attachment);
            renderAttachList();
          } else {
            const msg = j?.hint || j?.error || 'eroare la încărcare.';
            showChatToast(msg, 'error');
          }
        } catch {
          showChatToast('nu am putut încărca fișierul. verifică conexiunea.', 'error');
        } finally {
          attachHint?.classList.remove('busy');
        }
      }

      fileInput?.addEventListener('change', async () => {
        const files = Array.from(fileInput.files || []);
        for (const f of files) {
          await uploadAttachment(f);
        }
        fileInput.value = '';
      });

      /* -------------------------- append / prepend mesaje -------------------------- */
      // Helper: actualizează un mesaj existent care a fost editat
      function updateEditedMessage(row, m) {
        if (!row || !m) return;

        // Actualizează textul
        const bodyEl = row.querySelector('[data-body]');
        if (bodyEl) {
          bodyEl.innerHTML = renderMentionsInBody(m.body || '', m.mentions || null);
        }

        // Actualizează data-edited-at și data-body-raw
        row.dataset.editedAt = String(m.edited_at || 0);
        row.dataset.bodyRaw = m.body || '';

        // Adaugă/actualizează indicatorul "(editat)" în meta
        const metaEl = row.querySelector('.meta');
        if (metaEl) {
          let editedSpan = metaEl.querySelector('.edited');
          if (m.edited || m.edited_at) {
            if (!editedSpan) {
              editedSpan = document.createElement('span');
              editedSpan.className = 'edited';
              // Inserăm după .time
              const timeEl = metaEl.querySelector('.time');
              if (timeEl && timeEl.nextSibling) {
                metaEl.insertBefore(editedSpan, timeEl.nextSibling);
              } else {
                metaEl.appendChild(editedSpan);
              }
            }
            editedSpan.textContent = '(editat)';
          }
        }
      }

      function applyDeletedMessage(row, m) {
        if (!row) return;

        // 1. Marchez dataset
        row.dataset.deleted = '1';
        row.dataset.deletedAt = String(m.deleted_at || Math.floor(Date.now() / 1000));

        // 2. Scot clase inutile, pun flag deleted
        row.classList.add('msg-deleted');
        // 3. Modific HTML body
        const bodyEl = row.querySelector('[data-body]');
        if (bodyEl) {
          bodyEl.innerHTML = '<span class="deleted">Acest mesaj a fost șters.</span>';
        }

        // 4. Ascund atașamente/preview
        const attachContainer = row.querySelector('.attachments-grid');
        if (attachContainer) attachContainer.remove();
        const linkPrev = row.querySelector('.link-preview');
        if (linkPrev) linkPrev.remove();

        // 5. Scot butoane de acțiuni (edit/delete/reply)
        const meta = row.querySelector('.meta');
        if (meta) {
          // scoatem butoanele existente
          meta.querySelectorAll('.edit-msg-btn, .delete-msg-btn, .reply-msg-btn, .react-btn').forEach(b => b.remove());

          // adăugăm label [mesaj șters] dacă nu e deja
          if (!meta.querySelector('.deleted-flag')) {
            const delSpan = document.createElement('span');
            delSpan.className = 'deleted-flag';
            delSpan.textContent = '[mesaj șters]';
            meta.appendChild(delSpan);
          }
        }

        // 6. Scot bara de reacții
        const reactBar = row.querySelector('.react-bar');
        if (reactBar) reactBar.remove();
      }

      /* -------------------------- actualizare rând existent -------------------------- */
      function updateRow(row, m) {
        if (!row || !m) return;

        // 1. Text body
        row.dataset.bodyRaw = m.body || '';
        const bodyEl = row.querySelector('[data-body]');
        if (bodyEl) {
          bodyEl.innerHTML = renderMentionsInBody(m.body || '', m.mentions || null);
        }

        // 2. Meta timestamps / edited
        row.dataset.editedAt = String(m.edited_at || 0);
        const metaEl = row.querySelector('.meta');
        if (metaEl) {
          let editedSpan = metaEl.querySelector('.edited');
          if (m.edited || m.edited_at) {
            if (!editedSpan) {
              const timeEl = metaEl.querySelector('.time');
              editedSpan = document.createElement('span');
              editedSpan.className = 'edited';
              if (timeEl && timeEl.nextSibling) metaEl.insertBefore(editedSpan, timeEl.nextSibling);
              else metaEl.appendChild(editedSpan);
            }
            editedSpan.textContent = '(editat)';
          }
        }

        // 3. Atașamente
        // Dacă aveam deja, le scoatem și punem din nou (poate s-au schimbat?)
        // Sau le punem doar dacă lipsesc.
        // Soluția robustă: rebuilding partial.
        let attachGrid = row.querySelector('.attachments-grid');
        if (m.attachments && m.attachments.length > 0) {
          const newHtml = renderAttachments(m.attachments);
          if (!attachGrid) {
            // Inserăm după body? Nu, în buildRow e la final.
            // Putem face append la .bubble
            const bubble = row.querySelector('.bubble');
            if (bubble) {
              // workaround insert html strings
              const tpl = document.createElement('template');
              tpl.innerHTML = newHtml;
              bubble.appendChild(tpl.content);
            }
          } else {
            // replace
            attachGrid.outerHTML = newHtml;
          }
        } else if (attachGrid) {
          // dacă mesajul nou zice explicit că nu are atașamente, le ștergem?
          // de obicei nu dispar. păstrăm logică conservatoare.
        }

        // 4. Link Preview
        let linkPrev = row.querySelector('.link-preview, .chat-link-preview');
        if (m.link_preview) {
          const newHtml = renderLinkPreview(m.link_preview);
          if (!linkPrev) {
            const bubble = row.querySelector('.bubble');
            if (bubble && newHtml) {
              const tpl = document.createElement('template');
              tpl.innerHTML = newHtml;
              bubble.appendChild(tpl.content);
            }
          } else {
            linkPrev.outerHTML = newHtml;
          }
        }
      }

      function appendMsg(raw) {
        // Normalizăm mesajul înainte de orice
        const m = normalizeMsg(raw);
        if (!m) return;

        const id = m.id;
        const cid = m.client_id;

        // confirmăm pending (client_id)
        if (cid && PENDING.has(cid)) {
          return confirmPending(cid, raw); // confirmPending va re-normaliza intern
        }

        // marchează userul ca activ și actualizează prezența
        trackActiveFromMsg(m);
        renderPresence();

        // verifică dacă mesajul există deja în DOM
        if (id && SEEN.has(id)) {
          // Mesaj existent - verifică dacă a fost editat SAU completat cu date (attachments/preview)
          const existingRow = feed.querySelector(`.msg[data-msg-id="${id}"]`);
          if (existingRow) {
            const currentEditedAt = parseInt(existingRow.dataset.editedAt || '0', 10);
            const newEditedAt = m.edited_at; // deja normalizat

            // Condiții update:
            // 1. Editat explicit
            // 2. Are atașamente în payload dar lipsesc în DOM
            // 3. Are link_preview în payload dar lipsește în DOM

            const missingAttachments = (m.attachments.length > 0 && !existingRow.querySelector('.attachments-grid'));
            const missingPreview = (m.link_preview && !existingRow.querySelector('.link-preview, .chat-link-preview'));
            const verifyEdit = (newEditedAt > currentEditedAt);

            if (verifyEdit || missingAttachments || missingPreview) {
              updateRow(existingRow, m);
            }
          }
          return;
        }

        if (id) {
          SEEN.add(id);
          trimSeen();
          lastId = Math.max(lastId, id);
          sessionStorage.setItem('chat:lastId', String(lastId));
          if (oldestIdLoaded === null || id < oldestIdLoaded) {
            oldestIdLoaded = id;
          }
        }

        const mine = (m.user_name === meName);
        const isLiveNow = chatHydrated && !mine;

        ensureDaySepAppend(m.ts);
        const row = buildRow(m, mine, false);

        const wasBottom = atBottom();
        const prev = lastMsgRow();
        if (prev && canGroup(prev, m, mine)) {
          joinWithPrev(prev, row);
        }
        feed.appendChild(row);

        const hasMention = row.classList.contains('has-mention');

        // mențiuni
        if (hasMention && !mine && !VIEW_MENTIONS) {
          scheduleMentionRefresh();
          if (isLiveNow && typeof playChatSound === 'function') {
            playChatSound('mention');
          }
        } else if (isLiveNow && typeof playChatSound === 'function') {
          playChatSound('incoming');
        }

        trimDOMWindow('bottom');
        // ========== Auto-scroll & badge „mesaje noi" ==========
        if (wasBottom) {
          scrollBottomNow();
        } else if (isLiveNow) {
          const sep = createUnreadSeparator();
          if (sep) feed.insertBefore(sep, row);
          showNewMsgsBadge();
        }
      }


      function prependMsgs(list) {
        if (!list || !list.length) return;
        let nextRow = feed.firstElementChild;
        let dayBelow = null;
        while (nextRow) {
          if (nextRow.classList.contains('chat-sep')) {
            dayBelow = nextRow.dataset.day || null;
            break;
          }
          if (nextRow.dataset && nextRow.dataset.ts) {
            dayBelow = dayKey(+nextRow.dataset.ts || 0);
            break;
          }
          nextRow = nextRow.nextElementSibling;
        }

        const prevH = feed.scrollHeight;
        const frag = document.createDocumentFragment();
        let prevRowLocal = null;
        let prevDayLocal = dayBelow;

        for (const m of list) {
          const thisDay = dayKey(m.ts || 0);
          if (thisDay !== prevDayLocal) {
            frag.appendChild(daySepNode(m.ts || 0));
            prevDayLocal = thisDay;
          }
          const mine = (m.user_name === meName);
          const row = buildRow(m, mine, false);
          if (prevRowLocal && canGroup(prevRowLocal, m, mine)) joinWithPrev(prevRowLocal, row);
          frag.appendChild(row);
          prevRowLocal = row;

          const id = m.id | 0;
          if (id) {
            SEEN.add(id);
            trimSeen();
            if (oldestIdLoaded === null || id < oldestIdLoaded) oldestIdLoaded = id;
            lastId = Math.max(lastId, id);
          }
        }

        feed.insertBefore(frag, feed.firstChild);
        const newH = feed.scrollHeight;
        feed.scrollTop += (newH - prevH);
        trimDOMWindow('top');
      }

      /* -------------------------- jump la mesaj (pt mențiuni / reply) -------------------------- */
      async function jumpToAround(messageId) {
        const row = feed.querySelector(`.msg[data-msg-id="${messageId}"]`);
        if (row) {
          row.classList.add('msg-highlight');
          row.scrollIntoView({ block: 'center', behavior: 'smooth' });
          setTimeout(() => row.classList.remove('msg-highlight'), 2000);
          return;
        }

        // dacă nu-l avem, cerem serverului un „context” în jurul lui
        try {
          const r = await fetch(`/api/chat/context.php?id=${encodeURIComponent(messageId)}`, { credentials: 'include' });
          const j = await r.json().catch(() => null);
          if (!j || !j.ok || !Array.isArray(j.items)) return;
          prependMsgs(j.items);
          const row2 = feed.querySelector(`.msg[data-msg-id="${messageId}"]`);
          if (row2) {
            row2.classList.add('msg-highlight');
            row2.scrollIntoView({ block: 'center', behavior: 'smooth' });
            setTimeout(() => row2.classList.remove('msg-highlight'), 2000);
          }
        } catch { }
      }

      async function startEditRow(row) {
        const msgId = parseInt(row.dataset.msgId || '0', 10);
        if (!msgId) return;
        const bodyEl = row.querySelector('[data-body]');
        const cur = bodyEl ? bodyEl.textContent || '' : '';
        const next = prompt('Editează mesajul:', cur);
        if (next == null || next.trim() === cur.trim()) return;

        try {
          const r = await fetch('/api/chat/edit.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
            body: JSON.stringify({ message_id: msgId, text: next.trim(), csrf_token: csrfToken || '' })
          });
          const j = await r.json().catch(() => null);
          if (!r.ok || !j || !j.ok) {
            // Show specific error from backend or fallback
            const errMsg = j?.error || 'mesajul nu a putut fi editat.';
            if (errMsg.includes('csrf') || errMsg.includes('session')) {
              showChatToast('sesiune expirată, reîncarcă pagina.', 'error');
            } else if (errMsg.includes('permission') || errMsg.includes('autorul')) {
              showChatToast('nu poți edita mesajul altui utilizator.', 'error');
            } else if (errMsg.includes('expirat') || errMsg.includes('timp')) {
              showChatToast('a expirat timpul în care poți edita acest mesaj.', 'error');
            } else {
              showChatToast(errMsg, 'error');
            }
            return;
          }
          // Update the message text in DOM without full reload
          if (bodyEl && j.text) {
            bodyEl.innerHTML = renderMentionsInBody(j.text, null);
            row.dataset.bodyRaw = j.text;
          }
          // Add (editat) label if not already present
          const metaEl = row.querySelector('.meta');
          if (metaEl && !metaEl.querySelector('.edited')) {
            const editedSpan = document.createElement('span');
            editedSpan.className = 'edited';
            editedSpan.textContent = '(editat)';
            metaEl.appendChild(editedSpan);
          }
        } catch (err) {
          console.error('[chat] edit error:', err);
          showChatToast('eroare la editare, încearcă din nou.', 'error');
        }
      }

      async function deleteRow(row) {
        const msgId = parseInt(row.dataset.msgId || '0', 10);
        if (!msgId) return;
        if (!confirm('sigur vrei să ștergi acest mesaj?')) return;
        try {
          // Optimist UI update
          applyDeletedMessage(row, { deleted_at: Math.floor(Date.now() / 1000) });

          const r = await fetch('/api/chat/delete.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken || '' },
            body: JSON.stringify({ message_id: msgId, csrf_token: csrfToken || '' })
          });
          const j = await r.json().catch(() => null);

          if (!r.ok || !j || !j.ok) {
            // Rollback or show error? 
            // Since it's deleted visually, we might check error.
            showChatToast('eroare la ștergere: ' + (j?.error || 'necunoscută'), 'error');
            // Reload messages to restore state?
            pullLatest();
          }
        } catch (e) {
          console.error(e);
          showChatToast('eroare rețea la ștergere', 'error');
        }
      }


      /* -------------------------- încărcare mesaje (pull/poll/SSE) -------------------------- */
      // Track timestamp flags
      let lastEditPollTs = 0;
      let lastDeletePollTs = 0;

      async function pullLatest() {
        try {
          let qs = lastId
            ? `?after=${encodeURIComponent(lastId)}&limit=${PAGE_LIMIT}`
            : `?limit=${PAGE_LIMIT}`;

          // Include timestamps for sync
          qs += `&edited_since=${encodeURIComponent(lastEditPollTs)}`;
          qs += `&deleted_since=${encodeURIComponent(lastDeletePollTs)}`;

          const r = await fetch('/api/chat/poll.php' + qs, { credentials: 'include' });
          const j = await r.json().catch(() => null);

          // acceptăm mai multe formate
          let items = [];
          if (Array.isArray(j)) {
            items = j;
          } else if (j && Array.isArray(j.items)) {
            items = j.items;
          } else if (j && Array.isArray(j.messages)) {
            items = j.messages;
          }

          // procesăm typing/presence
          if (j && Array.isArray(j.presence)) renderPresence(j.presence);
          if (j && Array.isArray(j.typing)) renderTyping(j.typing);

          // procesăm mesajele editate recent
          if (j && Array.isArray(j.edited_messages) && j.edited_messages.length) {
            j.edited_messages.forEach(m => {
              const id = m.id || m.msg_id;
              if (!id) return;
              const existingRow = feed.querySelector(`.msg[data-msg-id="${id}"]`);
              if (!existingRow) return;

              const currentEditedAt = parseInt(existingRow.dataset.editedAt || '0', 10);
              const incomingEditedAt = parseInt(m.edited_at || '0', 10);

              if (incomingEditedAt > currentEditedAt) {
                updateEditedMessage(existingRow, m);
                existingRow.dataset.editedAt = String(incomingEditedAt);
              }
            });
          }

          // procesăm mesajele șterse recent
          if (j && Array.isArray(j.deleted_messages) && j.deleted_messages.length) {
            j.deleted_messages.forEach(m => {
              const id = m.id || m.msg_id;
              if (!id) return;
              const existingRow = feed.querySelector(`.msg[data-msg-id="${id}"]`);
              if (existingRow && existingRow.dataset.deleted !== '1') {
                applyDeletedMessage(existingRow, m);
              }
            });
          }

          // Actualizăm timestamp-urile
          lastEditPollTs = Math.floor(Date.now() / 1000);
          lastDeletePollTs = Math.floor(Date.now() / 1000);

          if (!items.length) return;

          items.forEach(m => appendMsg(m));

          // Load reaction states
          loadReactionsForVisibleMessages();
        } catch { }
      }



      async function loadOlder() {
        if (loadingOlder || noMoreOlder) return;
        if (oldestIdLoaded == null || oldestIdLoaded <= 1) return;
        loadingOlder = true;

        try {
          const qs = `?before=${encodeURIComponent(oldestIdLoaded)}&limit=${PAGE_LIMIT}`;
          const r = await fetch('/api/chat/poll.php' + qs, { credentials: 'include' });
          const j = await r.json().catch(() => null);

          let items = [];
          if (Array.isArray(j)) {
            items = j;
          } else if (j && Array.isArray(j.items)) {
            items = j.items;
          } else if (j && Array.isArray(j.messages)) {
            items = j.messages;
          }

          if (!items.length) {
            noMoreOlder = true;
            return;
          }

          items.sort((a, b) => (a.id | 0) - (b.id | 0));
          prependMsgs(items);
          loadReactionsForVisibleMessages(); // load reaction counts after prepending messages
        } catch { } finally {
          loadingOlder = false;
        }
      }



      function startPolling() {
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = setInterval(pullLatest, POLL_MS);
      }

      function stopPolling() {
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      }

      function startSSE() {
        if (!window.EventSource) {
          startPolling();
          return;
        }
        if (sse) {
          sse.close();
          sse = null;
        }

        const url = '/api/chat/stream.php' + (lastId ? `?last_id=${encodeURIComponent(lastId)}` : '');
        sse = new EventSource(url, { withCredentials: true });

        sse.addEventListener('open', () => {
          // nu mai oprim polling-ul; SEEN + lastId se ocupă de duplicate
        });


        sse.addEventListener('error', () => {
          startPolling();
        });

        sse.addEventListener('message', ev => {
          if (!ev.data) return;
          let payload;
          try { payload = JSON.parse(ev.data); } catch { return; }
          if (!payload) return;

          if (payload.type === 'message') {
            appendMsg(payload.data);
          } else if (payload.type === 'batch' && Array.isArray(payload.items)) {
            payload.items.forEach(m => appendMsg(m));
          } else if (payload.type === 'presence') {
            renderPresence(payload.list || []);
          } else if (payload.type === 'typing') {
            renderTyping(payload.list || []);
          } else if (payload.type === 'mention_refresh') {
            scheduleMentionRefresh();
          }
        });
      }

      /* -------------------------- input: char counter + enter/shift+enter -------------------------- */
      let lastSendTs = 0;

      function updateCharCounter() {
        let len = (input.value || '').length;
        if (len > MAX_CHARS) {
          input.value = input.value.slice(0, MAX_CHARS);
          len = MAX_CHARS;
        }
        const cc = document.getElementById('charCountVal');
        if (cc) cc.textContent = len + '/' + MAX_CHARS;
      }


      input.addEventListener('input', () => {
        updateCharCounter();
        autoGrow();
        sendTypingPing();

        const ctx = detectMentionContext();
        if (ctx) {
          openMentionBox(ctx, ctx.token);
        } else {
          closeMentionBox();
        }
      });


      function autoGrow() {
        const stick = atBottom();
        const max = Math.min(Math.round(window.innerHeight * 0.32), 280);
        input.style.maxHeight = max + 'px';
        input.style.height = 'auto';
        const h = Math.min(input.scrollHeight, max);
        input.style.height = h + 'px';
        input.style.overflowY = (input.scrollHeight > max) ? 'auto' : 'hidden';
        if (stick) scrollBottomNow();
      }

      input.addEventListener('keydown', (e) => {
        if (mentionOpen) {
          if (e.key === 'ArrowDown' || e.key === 'Down') {
            e.preventDefault();
            if (mentionItems.length) {
              mentionActive = (mentionActive + 1) % mentionItems.length;
              syncMentionActive();
            }
            return;
          }
          if (e.key === 'ArrowUp' || e.key === 'Up') {
            e.preventDefault();
            if (mentionItems.length) {
              mentionActive = (mentionActive - 1 + mentionItems.length) % mentionItems.length;
              syncMentionActive();
            }
            return;
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            if (mentionItems.length) {
              applyMentionSelection(mentionItems[mentionActive] || mentionItems[0]);
            }
            return;
          }
          if (e.key === 'Escape') {
            closeMentionBox();
            return;
          }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitMessage();
        }
      });


      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitMessage();
      });

      /* -------------------------- detect mențiuni în text -------------------------- */
      function extractMentionNames(text) {
        if (!text) return [];
        const out = [];
        const re = /(^|\s)@([^\s,.!?;:]+)/gim;
        let m;
        while ((m = re.exec(text)) !== null) {
          const name = (m[2] || '').trim();
          if (name && !out.includes(name)) out.push(name);
        }
        return out;
      }

      // găsește contextul curent de @mention în textarea (ex: "@miha")
      function detectMentionContext() {
        if (!input) return null;
        const text = input.value || '';
        const pos = input.selectionStart ?? 0;
        if (!text || pos < 1) return null;

        let i = pos - 1;
        while (i >= 0 && !/\s/.test(text[i])) {
          i--;
        }
        const start = i + 1;
        if (text[start] !== '@') return null;

        const token = text.slice(start + 1, pos);
        if (token.includes('@')) return null;

        return { start, end: pos, token };
      }

      function closeMentionBox() {
        if (!mentionBox) return;
        mentionBox.classList.add('hidden');
        mentionBox.innerHTML = '';
        mentionOpen = false;
        mentionItems = [];
        mentionActive = 0;
      }

      function syncMentionActive() {
        if (!mentionBox) return;
        mentionBox.querySelectorAll('.mention-item-btn').forEach(btn => {
          const idx = parseInt(btn.dataset.idx || '0', 10) || 0;
          if (idx === mentionActive) btn.classList.add('is-active');
          else btn.classList.remove('is-active');
        });
      }

      function openMentionBox(ctx, token) {
        if (!mentionBox) return;

        // bază: lista de prezență (dacă e goală, folosim fallback-ul din mesaje)
        const base = (presState && presState.length ? presState : computePresenceFallback()) || [];

        let items = base
          .map(u => {
            const full = (u.user_name || '').trim();
            if (!full) return null;
            // token-ul folosit efectiv după @ este primul cuvânt (ca să bată cu regexul de mențiuni)
            const value = full.split(/\s+/)[0];
            return { full, value };
          })
          .filter(Boolean);

        // eliminăm duplicate după `value`
        const seen = new Set();
        items = items.filter(it => {
          if (seen.has(it.value.toLowerCase())) return false;
          seen.add(it.value.toLowerCase());
          return true;
        });

        const q = (token || '').toLowerCase();
        if (q) {
          items = items.filter(it =>
            it.full.toLowerCase().includes(q) ||
            it.value.toLowerCase().includes(q)
          );
        }

        if (!items.length) {
          closeMentionBox();
          return;
        }

        mentionItems = items;
        mentionActive = 0;

        mentionBox.innerHTML = items.map((it, idx) => {
          const initial = (it.full.charAt(0) || '?').toUpperCase();
          return `
      <button type="button"
              class="mention-item-btn ${idx === 0 ? 'is-active' : ''}"
              data-idx="${idx}">
        <div class="mention-item-avatar">${esc(initial)}</div>
        <div class="flex flex-col">
          <span class="mention-item-name">${esc(it.full)}</span>
          <span class="mention-item-meta">@${esc(it.value)} · enter pentru a selecta</span>
        </div>
      </button>
    `;
        }).join('');

        mentionBox.classList.remove('hidden');
        mentionOpen = true;

        mentionBox.querySelectorAll('.mention-item-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx || '0', 10) || 0;
            applyMentionSelection(mentionItems[idx]);
          });
        });
      }

      function applyMentionSelection(item) {
        if (!item || !input) {
          closeMentionBox();
          return;
        }
        const ctx = detectMentionContext();
        if (!ctx) {
          closeMentionBox();
          return;
        }

        const text = input.value || '';
        const before = text.slice(0, ctx.start);
        const after = text.slice(ctx.end);
        const token = item.value || item.full;
        const insert = '@' + token + ' ';

        const next = before + insert + after;
        const pos = before.length + insert.length;

        input.value = next;
        input.focus();
        input.setSelectionRange(pos, pos);

        updateCharCounter();
        autoGrow();
        closeMentionBox();
      }


      /* -------------------------- trimite mesaj -------------------------- */
      async function submitMessage() {
        const txt = (input.value || '').trim();
        const hasAtt = ATTACHMENTS.length > 0;

        if (!txt && !hasAtt) return;
        if (txt.length > MAX_CHARS) {
          showChatToast('mesajul depășește limita de caractere.', 'error');
          return;
        }

        const now = Date.now();
        if (now - lastSendTs < SEND_COOLDOWN) {
          showChatToast('scrii prea repede. ai limită de 3 secunde între mesaje.', 'info');
          return;
        }
        lastSendTs = now;

        const cid = genCID();
        const tsSec = Math.floor(Date.now() / 1000);
        const mentionNames = extractMentionNames(txt);
        const replyMeta = replyTarget ? { id: replyTarget.id, user_name: replyTarget.user, body: replyTarget.body } : null;

        // optimist
        const row = renderPending(cid, txt, tsSec, mentionNames, replyMeta, ATTACHMENTS.slice());

        // sunet instant când tu trimiți mesajul
        if (typeof playChatSound === 'function') {
          playChatSound('sent');
        }

        input.value = '';
        clearReplyTarget();
        clearAttachments();
        updateCharCounter();
        autoGrow();

        const payload = {
          cid,
          txt,
          ts: tsSec,
          mentionsPayload: [], // poți popula cu id-uri reale din autocomplete
          mentionsNames: mentionNames,
          reply_to: replyMeta ? replyMeta.id : null,
          reply_preview: replyMeta ? replyMeta.body : null,
          attachments: ATTACHMENTS.slice()
        };


        if (!navigator.onLine) {
          queueOffline(payload);
          return;
        }

        markPendingSending(cid);

        try {
          const r = await fetch('/api/chat/send.php', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken || ''
            },
            body: JSON.stringify({
              text: txt,
              client_id: cid,
              mentions: [],
              mention_names: mentionNames,
              attachments: ATTACHMENTS.slice(),
              reply_to: payload.reply_to,
              reply_preview: payload.reply_preview, // used for reply context, not link preview
              csrf_token: csrfToken || ''
            })
          });
          const j = await r.json().catch(() => null);

          if (r.ok && j && j.ok) {
            // confirmarea se face prin SSE / pullLatest
            if (!sse || sse.readyState !== 1) {
              await pullLatest();
            }
          } else if (j && (j.error === 'rate_limited' || j.error === 'throttled')) {
            showChatToast(j.message || 'scrii prea des. încearcă mai rar.', 'info');
          } else if (j && (j.error === 'csrf_invalid' || j.error === 'unauthorized')) {
            showChatToast('sesiunea a expirat. reîncarcă pagina.', 'error');
          } else {
            showChatToast('nu am putut trimite mesajul.', 'error');
          }
        } catch {
          // offline neprevăzut
          queueOffline(payload);
        }
      }

      /* -------------------------- scroll: lazy-load în sus + hide badge -------------------------- */
      feed.addEventListener('scroll', () => {
        // lazy-load mesaje vechi când scroll în sus
        if (feed.scrollTop < 60) {
          loadOlder();
        }
        // ascunde badge „mesaje noi" dacă userul a ajuns manual la bottom
        if (hasUnreadBelow && atBottom()) {
          hideNewMsgsBadge();
        }
      });

      /* -------------------------- event delegation pentru edit/delete/reply -------------------------- */
      // Handlers atașați direct pe butoane se pierd când confirmPending face row.innerHTML = bubble.innerHTML
      // Folosim event delegation pe containerul feed pentru a prinde click-urile pe toate butoanele
      feed.addEventListener('click', (e) => {
        // Edit button
        const editBtn = e.target.closest('.edit-msg-btn');
        if (editBtn) {
          e.preventDefault();
          e.stopPropagation();
          const row = editBtn.closest('.msg');
          if (row) startEditRow(row);
          return;
        }

        // Delete button
        const deleteBtn = e.target.closest('.delete-msg-btn');
        if (deleteBtn) {
          e.preventDefault();
          e.stopPropagation();
          const row = deleteBtn.closest('.msg');
          if (row) deleteRow(row);
          return;
        }

        // Reply button
        const replyBtn = e.target.closest('.reply-msg-btn');
        if (replyBtn) {
          e.preventDefault();
          e.stopPropagation();
          const row = replyBtn.closest('.msg');
          if (row) startReplyFromRow(row);
          return;
        }

        // Reply jump (click pe previzualizare reply)
        const replyJump = e.target.closest('[data-reply-jump]');
        if (replyJump) {
          e.preventDefault();
          const mid = parseInt(replyJump.dataset.replyJump || '0', 10);
          if (mid) jumpToAround(mid);
          return;
        }
      });

      /* -------------------------- click pe badge „mesaje noi" → scroll to bottom -------------------------- */
      if (newMsgsBadge) {
        newMsgsBadge.addEventListener('click', () => {
          scrollBottomSmooth();
          hideNewMsgsBadge();
        });
      }

      /* -------------------------- evenimente global: online/offline -------------------------- */
      window.addEventListener('online', flushOfflineQueue);
      window.addEventListener('focus', flushOfflineQueue);

      /* -------------------------- init -------------------------- */
      function init() {
        loadOfflineQueue();
        flushOfflineQueue();

        // te marcăm ca activ din start
        trackActiveFromMsg({ user_name: meName, ts: Math.floor(Date.now() / 1000) });
        renderPresence();

        // bootstrap mesaje recente – fără sunete
        chatHydrated = false;
        pullLatest().then(() => {
          scrollBottomNow();
          // de aici încolo ce vine este „live”
          chatHydrated = true;
        });

        // pornim stream-ul live
        startSSE();

        // încă de la load verificăm dacă există mențiuni necitite
        loadMentionInbox(false);

        autoGrow();
        updateCharCounter();
      }


      init();

    })();

    function startPresencePing() {
      function ping() {
        fetch('/api/chat/presence_ping.php', {
          method: 'POST',
          credentials: 'include'
        }).catch(() => {
          // ignorăm erorile, nu stricăm UI-ul pentru asta
        });
      }

      // primul ping imediat
      ping();

      // apoi la ~20s, cum scrie și în php
      if (window.chatPresencePingTimer) {
        clearInterval(window.chatPresencePingTimer);
      }
      window.chatPresencePingTimer = setInterval(ping, 20000);
    }

    function startPresenceCounter() {
      async function refresh() {
        try {
          const res = await fetch('/api/chat/presence_online.php', {
            method: 'GET',
            credentials: 'include'
          });
          const data = await res.json();
          if (data && data.ok && Array.isArray(data.list) && window.__chatRenderPresence) {
            window.__chatRenderPresence(data.list);
          }
        } catch (e) {
          // dacă pică endpoint-ul, rămâne fallback-ul pe mesaje
        }
      }

      // prima actualizare imediat
      refresh();

      if (window.chatPresenceCountTimer) {
        clearInterval(window.chatPresenceCountTimer);
      }
      window.chatPresenceCountTimer = setInterval(refresh, 20000);
    }

    // sunete chat comunitate
    const sndMention = new Audio('/assets/sounds/chat-mention.wav');   // pt mesaje in care esti mentionat
    const sndIncoming = new Audio('/assets/sounds/chat-incoming.wav');  // pt mesaje normale primite
    const sndSent = new Audio('/assets/sounds/chat-sent.wav');      // pt mesaj trimis de tine

    sndMention.volume = 0.8;
    sndIncoming.volume = 0.7;
    sndSent.volume = 0.6;

    function playChatSound(type) {
      try {
        let snd = null;
        if (type === 'mention') snd = sndMention;
        else if (type === 'incoming') snd = sndIncoming;
        else if (type === 'sent') snd = sndSent;

        if (!snd) return;
        snd.currentTime = 0;
        snd.play().catch(() => { });
      } catch (e) {
        // ignore, nu ne oprim chatul pentru un sunet ratat
      }
    }




    // Gemini Logic
    async function geminiAnalyze() {
      kpi('kpi:gemini_click', {});
      const q = document.getElementById('geminiQ').value.trim();
      const out = document.getElementById('geminiOut');
      const err = document.getElementById('geminiErr');

      if (!q) {
        out.textContent = 'Scrie o întrebare pentru analiză.';
        return;
      }

      out.textContent = 'Generez analiză…';
      if (err) err.classList.add('hidden');

      const asNumber = (v) => Number(v || 0);


      try {
        await ensureHistoryLoaded();
        if (!recentTransactions.length) await loadRecentTransactions();
        const range = document.getElementById('dateRange').value;
        const byType = { deposit: { count: 0, sum: 0 }, withdraw: { count: 0, sum: 0 }, profit: { count: 0, sum: 0 }, pierdere: { count: 0, sum: 0 } };
        const buildSignedAmount = (t) => {
          const amt = asNumber(t.amount);
          return (t.type === 'pierdere' || t.type === 'withdraw') ? -Math.abs(amt) : Math.abs(amt);
        };

        (recentTransactions || []).forEach(t => {
          if (byType[t.type]) {
            byType[t.type].count += 1;
            byType[t.type].sum += Math.abs(asNumber(t.amount));
          }
        });

        const profitLossTx = (recentTransactions || []).filter(t => t.type === 'profit' || t.type === 'pierdere');
        const lastTradeSrc = profitLossTx[0] || recentTransactions[0] || null;
        const tradeToPayload = (t) => ({
          datetime: t?.date || null,
          type: t?.type || null,
          amount: t ? buildSignedAmount(t) : null,
          event: t?.details || ''
        });

        const calcPeriodStats = (days) => {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          cutoff.setHours(0, 0, 0, 0);
          let profit = 0, deposits = 0, withdrawals = 0, balance = null;
          (dataAll || []).forEach(p => {
            const d = new Date(p.date);
            if (d >= cutoff) {
              profit += asNumber(p.profitDelta);
              deposits += asNumber(p.deposit);
              withdrawals += asNumber(p.withdraw);
              if (p.balance !== null && p.balance !== undefined) balance = p.balance;
            }
          });
          return { profit, deposits, withdrawals, balance };
        };
        const context = {
          global_stats: {
            total_deposits: byType.deposit.sum,
            count_deposits: byType.deposit.count,
            total_withdrawals: byType.withdraw.sum,
            count_withdrawals: byType.withdraw.count,
            net_profit: byType.profit.sum - byType.pierdere.sum,
            roi_total: summaryData?.roiPct ?? null,
            current_balance: summaryData?.balanceEUR ?? null,
            investors_active: document.getElementById('lumenInvestors')?.textContent || null
          },
          period_stats: {
            last_7_days: calcPeriodStats(7),
            last_30_days: calcPeriodStats(30),
            all_time: {
              profit: byType.profit.sum - byType.pierdere.sum,
              deposits: byType.deposit.sum,
              withdrawals: byType.withdraw.sum,
              balance: summaryData?.balanceEUR ?? null
            }
          },
          last_trade: tradeToPayload(lastTradeSrc),
          recent_trades: profitLossTx.slice(0, 10).map(tradeToPayload),
          transactions_summary: {
            by_type: byType
          },
          range,

          question: q
        };

        const r = await fetch('/api/ai/gemini_analyze.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q, context })
        });

        const j = await r.json().catch(() => null);

        if (!r.ok || !j) {
          throw new Error('http');
        }

        if (r.status === 502) {
          out.textContent = 'Nu am reușit conexiunea către serviciul AI (502). Reîncearcă în câteva secunde.';
          return;
        }

        if (j.ok && j.text) {
          if (typeof formatGeminiResponse === 'function') {
            out.innerHTML = formatGeminiResponse(j.text);
          } else {
            out.textContent = j.text;
          }
        } else if (j.error === 'no_api_key' || j.error === 'missing_api_key') {
          out.textContent = 'Serviciul AI nu este configurat pe server (lipsă API key).';
        } else if (j.error === 'rate_limited') {
          out.textContent = 'Te rog încearcă din nou în câteva secunde.';
        } else if (j.answer) {
          // nou: folosește mesajul de eroare prietenos din backend
          out.textContent = j.answer;
        } else {
          throw new Error('generic');
        }
      } catch (e) {
        console.error('Gemini error:', e);
        out.textContent = '';
        const err = document.getElementById('geminiErr');
        if (err) err.classList.remove('hidden');
      }
    }
    document.getElementById('btnGemini')?.addEventListener('click', geminiAnalyze);


  </script>
</body>

</html>