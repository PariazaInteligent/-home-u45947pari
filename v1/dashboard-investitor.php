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
      <div class="bg-glass-bg border border-glass-border p-5 rounded-xl relative group hover:border-neon-blue/50 transition-colors"
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
          <div id="growthTrigger" class="p-3 rounded bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors group/growth">
             <div class="flex justify-between items-center">
                <div class="text-xs text-gray-500 uppercase group-hover/growth:text-neon-blue transition-colors">Creștere (strategie) <i class="fa-solid fa-circle-info ml-1"></i></div>
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

      <!-- Community Chat -->
      <div
        class="bg-glass-bg border border-glass-border rounded-xl flex flex-col h-[600px] xl:h-auto relative overflow-hidden"
        data-widget-id="chat">
        <div class="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <div class="flex items-center gap-3">
            <h3 class="font-orbitron text-sm text-white flex items-center gap-2">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              CHAT COMUNITATE
            </h3>
            <div class="flex gap-1 text-[10px]">
              <button id="tabAll" class="px-2 py-1 rounded bg-white/10 text-white">toate</button>
              <button id="tabMent" class="px-2 py-1 rounded hover:bg-white/10 text-gray-400">mențiuni</button>
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

        <!-- Feed -->
        <div id="chatFeed" class="flex-1 overflow-y-auto nice-scroll p-4 space-y-4 bg-black/20 relative"></div>

        <!-- Toasts container inside chat or fixed? Original was fixed. Let's keep fixed for better visibility -->
        <div id="mentionToast" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"></div>

        <!-- Mention Inbox (Hidden by default, toggled via tab) -->
        <div id="mentionInbox" class="hidden absolute inset-0 bg-slate-900/95 z-20 p-4 overflow-y-auto"></div>

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
              <textarea id="chatInput" rows="1" placeholder="Scrie un mesaj..."
                class="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-neon-blue outline-none resize-none overflow-hidden"></textarea>
              <div class="absolute right-2 top-2 flex items-center gap-1">
                <label for="chatFile" class="p-1.5 text-gray-500 hover:text-white transition-colors cursor-pointer"><i
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
             <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-blue to-neon-purple flex items-center justify-center animate-pulse-fast">
                <i class="fa-solid fa-robot text-white"></i>
             </div>
             <div>
                <h3 class="font-orbitron text-lg text-white">LUMEN AI INSIGHT</h3>
                <span class="text-xs text-gray-500 font-mono">Analiză Portofoliu Live</span>
             </div>
          </div>
          <button id="btnLumen" class="px-4 py-2 border border-neon-purple/50 text-neon-purple rounded text-xs font-bold hover:bg-neon-purple hover:text-white transition-all">
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

       <div id="lumenOut" class="p-4 bg-white/5 rounded-xl border-l-4 border-neon-blue text-sm text-gray-300 leading-relaxed min-h-[60px]">
          <p class="text-slate-500 italic">Apasă pe buton pentru a genera o analiză detaliată.</p>
       </div>
       
       <div class="mt-3 flex flex-wrap gap-4 text-[10px] text-gray-500 border-t border-white/5 pt-3">
          <div><span class="text-gray-400">Taxă dinamică est.:</span> <span id="lumenTax" class="text-neon-purple">—</span></div>
          <div><span class="text-gray-400">Investitori activi:</span> <span id="lumenInvestors" class="text-white">—</span></div>
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
    <div class="bg-void border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
      <button id="closeGrowthModal" class="absolute top-4 right-4 text-gray-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
      <h3 class="font-orbitron text-lg text-white mb-2">Nomenclator „Creștere”</h3>
      <p class="text-sm text-gray-400 mb-6">Randament (strategie) arată performanța fără a penaliza retragerile aprobate. Pentru transparență, mai jos vezi descompunerea:</p>
      
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
        <p>• <strong>Randament (strategie)</strong> ≈ profitul generat de strategie raportat la sumele investite, fără a scădea retragerile aprobate.</p>
        <p>• <strong>Retrageri & taxe</strong> sunt tratate ca ieșiri de numerar; ele pot aduce Profitul curent la 0 chiar dacă Randamentul rămâne pozitiv.</p>
      </div>
      
      <div class="mt-6 flex justify-end">
        <button id="btnCloseGrowth" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm text-white transition-colors">Închis</button>
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
        if(!list) return;
        try {
             const res = await fetch('/api/user/recent_transactions.php', { credentials: 'include' });
            if(!res.ok) throw new Error('http ' + res.status);
            const data = await res.json();
            recentTransactions = Array.isArray(data.items) ? data.items : [];
            
            list.innerHTML = '';
            if(!data.ok || !recentTransactions.length) {
                list.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Nu există tranzacții recente.</div>';
                return;
            }
            
           
            const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
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
            
        } catch(e) {
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
        if(!res.ok) throw new Error('err');
        const j = await res.json();
        if(!j.ok) throw new Error('err');

        // Update Stats
        if(statsDiv) statsDiv.classList.remove('hidden');
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
        if(procEl) procEl.textContent = '~' + j.avg_processing_days + ' Zile';

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
    });

    // --- CHAT LOGIC ---
    (function chatModule() {
      const feed = document.getElementById('chatFeed');
      const form = document.getElementById('chatForm');
      const input = document.getElementById('chatInput');
      const btn = document.getElementById('chatSend');
      const csrfToken = document.body.dataset.csrfChat || '';
      const meName = document.body.dataset.userName || 'Eu';
      const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c] || c));

      if (!feed || !form) return;

      input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        document.getElementById('charCountVal').textContent = this.value.length + '/1000';
      });

      async function loadMessages() {
        try {
          const r = await fetch('/api/chat/poll.php?limit=50', { credentials: 'include' });
          if (r.ok) {
            const j = await r.json();
            if (j.items) renderMessages(j.items);
          }
        } catch (e) { }
      }

      function renderMessages(list) {
        list.sort((a, b) => a.ts - b.ts);
        feed.innerHTML = '';
        list.forEach(m => {
          const isMine = m.user_name === meName;
          const div = document.createElement('div');
          div.className = `flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`;

          const initial = (m.user_name || '?')[0].toUpperCase();
          const roleColor = m.role === 'ADMIN' ? 'text-neon-purple' : 'text-gray-400';
          const bubbleClass = isMine
            ? 'bg-neon-blue/10 border border-neon-blue/30 text-white rounded-br-none'
            : (m.role === 'ADMIN' ? 'bg-neon-purple/10 border border-neon-purple/30 text-white rounded-bl-none' : 'bg-white/5 border border-white/10 text-gray-300 rounded-bl-none');
            const timeStr = m.ts ? new Date(m.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          const bodyHtml = esc(m.body || '').replace(/\n/g, '<br>');

          div.innerHTML = `
                    <div class="flex items-end gap-2 max-w-[90%]">
                       ${!isMine ? `<div class="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-[10px] border border-white/10 shrink-0">${initial}</div>` : ''}
                       <div class="rounded-2xl px-4 py-2 text-sm shadow-lg ${bubbleClass}">
                          ${!isMine ? `<div class="flex items-center gap-2 mb-1">
                                <span class="text-[10px] font-bold ${roleColor}">${esc(m.user_name || 'Investitor')}</span>
                                <span class="text-[9px] text-gray-600">${timeStr}</span>
                             </div>` : ''}
                           ${bodyHtml}
                       </div>
                    </div>
                `;
          feed.appendChild(div);
        });
        feed.scrollTop = feed.scrollHeight;
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const txt = input.value.trim();
        if (!txt) return;

        input.value = '';
        input.style.height = 'auto';

        try {
          await fetch('/api/chat/send.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
            credentials: 'include',
            body: JSON.stringify({ text: txt, csrf_token: csrfToken })
          });
          loadMessages();
        } catch (e) {
          alert('Eroare la trimitere');
        }
      });

      setInterval(loadMessages, 5000);
      loadMessages();
    })();

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