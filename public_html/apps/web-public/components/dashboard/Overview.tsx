import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  Users, 
  CreditCard, 
  Download, 
  Crosshair, 
  ChevronRight 
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';

interface OverviewProps {
  onNavigateToDeposit: () => void;
  onNavigateToWithdraw: () => void;
  onChangeTab: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ 
  onNavigateToDeposit, 
  onNavigateToWithdraw, 
  onChangeTab 
}) => {
  const chartData = [10, 15, 13, 25, 30, 28, 45, 50, 48, 65, 75, 90];
  const maxVal = Math.max(...chartData);
  const points = chartData.map((val, i) => {
    const x = (i / (chartData.length - 1)) * 100;
    const y = 100 - (val / maxVal) * 80;
    return `${x},${y}`;
  }).join(' ');
  const chartFillPoints = `0,100 ${points} 100,100`;

  const activeBets = [
    { event: "Real Madrid vs Barcelona", market: "Over 2.5 Goals", odds: "1.85", stake: "500 RON", pot: "925 RON", status: "Active" },
    { event: "Djokovic vs Alcaraz", market: "Set 1 Winner: Alcaraz", odds: "2.10", stake: "350 RON", pot: "735 RON", status: "Active" },
    { event: "Lakers vs Warriors", market: "Lakers +5.5", odds: "1.90", stake: "400 RON", pot: "760 RON", status: "Pending" },
  ];

  return (
    <>
      {/* Top Stats Row */}
      <div className="grid md:grid-cols-3 gap-6 relative z-10 mb-20 lg:mb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* 1. PERSONAL BALANCE CARD */}
        <TiltCard glowColor="cyan" className="col-span-1 md:col-span-2 relative overflow-hidden h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4 sm:gap-0">
              <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-cyan-400" />
                    <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">Balanță Personală</p>
                  </div>
                  <h3 className="text-4xl lg:text-5xl font-display font-bold text-white flex items-end gap-2">
                    5,450.00 <span className="text-xl text-slate-500 mb-1">RON</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-white/5">
                        Investiție Activă: <span className="text-white font-bold">4,000 RON</span>
                    </div>
                    <div className="text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-white/5 hidden sm:block">
                        Ultima act: Azi, 14:30
                    </div>
                  </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={onNavigateToDeposit}
                    className="flex-1 sm:flex-none p-3 sm:p-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-lg shadow-cyan-900/20 text-white transition-all transform hover:scale-105 flex justify-center items-center" 
                    title="Adaugă Fonduri"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="ml-2 sm:hidden font-bold text-sm">Depunere</span>
                  </button>
                  <button 
                    onClick={onNavigateToWithdraw}
                    className="flex-1 sm:flex-none p-3 sm:p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-white/10 text-emerald-400 transition-colors flex justify-center items-center" 
                    title="Retrage Profit"
                  >
                    <Download className="w-5 h-5" />
                    <span className="ml-2 sm:hidden font-bold text-sm">Retragere</span>
                  </button>
              </div>
            </div>

            {/* Personal Growth Chart */}
            <div className="h-48 w-full relative">
              <div className="absolute top-0 right-0 text-[10px] text-cyan-500/50 font-mono">PERSONAL_GROWTH_CHART_V2</div>
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points={chartFillPoints} fill="url(#chartGradient)" />
                  <polyline 
                    points={points} 
                    fill="none" 
                    stroke="#22d3ee" 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  />
                  <circle cx="100" cy="10" r="2" fill="#fff" className="animate-ping" />
                  <circle cx="100" cy="10" r="2" fill="#22d3ee" />
              </svg>
            </div>
        </TiltCard>

        <div className="space-y-6 flex flex-col justify-between">
            {/* 2. PERSONAL PROFIT */}
            <TiltCard glowColor="emerald" className="relative flex-1">
              <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono uppercase">Profit Net</span>
              </div>
              <div className="text-3xl font-display font-bold text-white mb-1">+1,450 <span className="text-sm text-slate-500">RON</span></div>
              <div className="flex items-center gap-2 mt-2">
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded flex items-center border border-emerald-500/20">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> +36.25%
                  </span>
                  <span className="text-slate-500 text-xs">Randament total</span>
              </div>
            </TiltCard>

            {/* 3. TOTAL FUND CONTEXT */}
            <TiltCard glowColor="purple" className="relative flex-1">
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-violet-500/10 rounded border border-violet-500/20">
                        <Users className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-xs text-slate-400 font-mono uppercase">Fond Comun</span>
                  </div>
                  <span className="text-xs font-bold text-violet-300">42,850 RON</span>
              </div>
              
              <div className="mt-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Ponderea ta în fond</span>
                    <span className="text-white font-bold">12.7%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                    {/* Your Share */}
                    <div className="h-full bg-cyan-500 w-[12.7%] shadow-[0_0_10px_rgba(6,182,212,0.5)] relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-cyan-600 text-[10px] text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Tu</div>
                    </div>
                    {/* Others */}
                    <div className="h-full bg-slate-700 w-full opacity-30"></div>
                  </div>
              </div>
            </TiltCard>
        </div>
      </div>

      {/* Active Bets Section */}
      <div className="relative z-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-cyan-400" />
                Pariuri Active (Live Feed)
            </h3>
            <button 
              onClick={() => onChangeTab('history')}
              className="text-xs text-cyan-400 hover:text-white uppercase tracking-wider font-bold transition-colors flex items-center gap-1"
            >
              Vezi Toate <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* DESKTOP VIEW (Table) */}
          <div className="hidden lg:block bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 bg-slate-950/30">
                <div className="col-span-4">Eveniment</div>
                <div className="col-span-2 text-center">Cota</div>
                <div className="col-span-2 text-center">Miza</div>
                <div className="col-span-2 text-center">Potențial</div>
                <div className="col-span-2 text-right">Status</div>
            </div>
            
            {activeBets.map((bet, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-sm hover:bg-white/5 transition-colors group items-center">
                  <div className="col-span-4">
                      <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{bet.event}</div>
                      <div className="text-xs text-slate-500">{bet.market}</div>
                  </div>
                  <div className="col-span-2 text-center font-mono text-cyan-300">{bet.odds}</div>
                  <div className="col-span-2 text-center text-slate-300">{bet.stake}</div>
                  <div className="col-span-2 text-center font-bold text-emerald-400">{bet.pot}</div>
                  <div className="col-span-2 text-right">
                      <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded border border-yellow-500/20 animate-pulse">
                        {bet.status}
                      </span>
                  </div>
                </div>
            ))}
          </div>

          {/* MOBILE VIEW (Stacked Cards) */}
          <div className="lg:hidden space-y-4">
            {activeBets.map((bet, i) => (
              <div key={i} className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-xl p-4 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">{bet.event}</div>
                    <div className="text-xs text-slate-500 mt-1">{bet.market}</div>
                  </div>
                  <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2 py-1 rounded border border-yellow-500/20 animate-pulse uppercase tracking-wider">
                    {bet.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                  <div className="text-center p-2 bg-slate-950/30 rounded">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cota</div>
                      <div className="font-mono text-cyan-300 text-sm">{bet.odds}</div>
                  </div>
                  <div className="text-center p-2 bg-slate-950/30 rounded">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Miza</div>
                      <div className="text-slate-300 text-sm">{bet.stake}</div>
                  </div>
                  <div className="text-center p-2 bg-slate-950/30 rounded">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Profit</div>
                      <div className="font-bold text-emerald-400 text-sm">{bet.pot}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
      </div>
    </>
  );
};