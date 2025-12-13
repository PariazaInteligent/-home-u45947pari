import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  PieChart, 
  BarChart2, 
  Calendar,
  Download,
  Info,
  Zap,
  Share2
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  // Mock Data for Charts
  const dataPoints = [10, 25, 20, 35, 45, 42, 55, 60, 58, 75, 85, 90];
  const maxVal = Math.max(...dataPoints);
  const points = dataPoints.map((val, i) => {
    const x = (i / (dataPoints.length - 1)) * 100;
    const y = 100 - (val / maxVal) * 80; // Keep some padding on top
    return `${x},${y}`;
  }).join(' ');

  const chartFill = `0,100 ${points} 100,100`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <BarChart2 className="w-6 h-6 text-cyan-400" /> Analiză Performanță
                </h2>
                <p className="text-slate-400 text-sm">Metrici detaliați despre evoluția portofoliului tău.</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-white/10">
                {(['week', 'month', 'year', 'all'] as const).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${
                            timeRange === range 
                            ? 'bg-cyan-500 text-white shadow-lg' 
                            : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {range === 'all' ? 'Tot' : range === 'year' ? 'An' : range === 'month' ? 'Lună' : 'Săpt'}
                    </button>
                ))}
            </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <TiltCard glowColor="emerald" noPadding className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center">
                        +12.5% <Activity className="w-3 h-3 ml-1" />
                    </span>
                </div>
                <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">ROI (Randament)</div>
                <div className="text-2xl font-display font-bold text-white">18.4%</div>
            </TiltCard>

            <TiltCard glowColor="cyan" noPadding className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
                        <Target className="w-5 h-5" />
                    </div>
                    <span className="text-cyan-400 text-xs font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        Top 5%
                    </span>
                </div>
                <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Win Rate</div>
                <div className="text-2xl font-display font-bold text-white">64.2%</div>
            </TiltCard>

            <TiltCard glowColor="purple" noPadding className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20 text-violet-400">
                        <Zap className="w-5 h-5" />
                    </div>
                    <span className="text-slate-400 text-xs font-mono px-2 py-0.5">
                        Volum Înalt
                    </span>
                </div>
                <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Rulaj Total</div>
                <div className="text-2xl font-display font-bold text-white">12,450 <span className="text-sm text-slate-500">RON</span></div>
            </TiltCard>

            <TiltCard glowColor="red" noPadding className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-red-400">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                    <span className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                        -2.1%
                    </span>
                </div>
                <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Drawdown Max</div>
                <div className="text-2xl font-display font-bold text-white">8.5%</div>
            </TiltCard>
        </div>

        {/* Main Chart Section */}
        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <TiltCard glowColor="cyan" className="h-full flex flex-col relative overflow-hidden">
                    <div className="absolute top-4 right-4 z-10">
                        <Button3D variant="cyan" className="px-3 py-1 text-[10px] h-8">
                            <Download className="w-3 h-3 mr-1" /> Export CSV
                        </Button3D>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            Evoluție Profit Net
                        </h3>
                        <p className="text-xs text-slate-400">Creștere cumulativă a băncii (fără depuneri)</p>
                    </div>

                    <div className="flex-1 relative min-h-[250px] bg-slate-900/50 rounded-xl border border-white/5 p-4">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none opacity-20">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-px bg-white"></div>)}
                        </div>
                        
                        {/* SVG Chart */}
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                             <defs>
                                <linearGradient id="mainChartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                                </linearGradient>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="2" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                             </defs>
                             
                             {/* Area Fill */}
                             <polygon points={chartFill} fill="url(#mainChartGradient)" />
                             
                             {/* Line */}
                             <polyline 
                                points={points} 
                                fill="none" 
                                stroke="#22d3ee" 
                                strokeWidth="1.5" 
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#glow)"
                             />

                             {/* Interactive Dots (Mock) */}
                             <circle cx="20" cy="80" r="1.5" fill="#fff" className="opacity-50" />
                             <circle cx="50" cy="55" r="1.5" fill="#fff" className="opacity-50" />
                             <circle cx="100" cy="20" r="2" fill="#22d3ee" stroke="white" strokeWidth="0.5" className="animate-pulse" />
                        </svg>

                        {/* Hover Tooltip Mockup */}
                        <div className="absolute top-[20%] right-0 bg-slate-800 border border-cyan-500/30 p-2 rounded shadow-xl transform translate-x-1/2 -translate-y-full hidden lg:block">
                            <div className="text-[10px] text-slate-400 uppercase">Profit Curent</div>
                            <div className="text-sm font-bold text-cyan-400">+1,450 RON</div>
                        </div>
                    </div>
                </TiltCard>
            </div>

            <div className="lg:col-span-1 space-y-6">
                {/* Win/Loss Donut */}
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-violet-400" />
                        Distribuție Rezultate
                    </h3>
                    
                    <div className="flex items-center justify-center relative h-40">
                         {/* CSS Conic Gradient for Donut Chart */}
                         <div className="w-32 h-32 rounded-full relative" 
                              style={{ background: 'conic-gradient(#10b981 0% 64%, #ef4444 64% 90%, #eab308 90% 100%)' }}>
                            <div className="absolute inset-2 bg-slate-900 rounded-full flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white">158</span>
                                <span className="text-[10px] text-slate-500 uppercase">Pariuri</span>
                            </div>
                         </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-slate-300">Câștigătoare</span>
                            </div>
                            <span className="font-bold text-emerald-400">64% (101)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-slate-300">Pierdute</span>
                            </div>
                            <span className="font-bold text-red-400">26% (41)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <span className="text-slate-300">Void / Cashout</span>
                            </div>
                            <span className="font-bold text-yellow-400">10% (16)</span>
                        </div>
                    </div>
                </div>

                {/* Best Performance */}
                <div className="bg-gradient-to-br from-violet-900/20 to-slate-900 border border-violet-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                         <div className="p-2 bg-violet-500/20 rounded-lg">
                            <Zap className="w-4 h-4 text-violet-300" />
                         </div>
                         <div>
                            <div className="text-xs text-slate-400 uppercase font-bold">Best Sport</div>
                            <div className="text-sm font-bold text-white">Tenis (ATP/WTA)</div>
                         </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>ROI</span>
                            <span className="text-violet-300 font-bold">22.5%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-violet-500 h-full w-[85%]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    Performanță pe Sporturi
                </h3>
                
                <div className="space-y-5">
                    {[
                        { name: 'Fotbal', count: 85, roi: 12.4, color: 'bg-emerald-500' },
                        { name: 'Tenis', count: 42, roi: 22.5, color: 'bg-cyan-500' },
                        { name: 'Baschet', count: 21, roi: -5.2, color: 'bg-red-500' },
                        { name: 'E-Sports', count: 10, roi: 8.1, color: 'bg-purple-500' },
                    ].map((sport, i) => (
                        <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-white font-bold">{sport.name} <span className="text-slate-500 font-normal">({sport.count} pariuri)</span></span>
                                <span className={`font-mono font-bold ${sport.roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {sport.roi > 0 ? '+' : ''}{sport.roi}% ROI
                                </span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className={`h-full ${sport.color}`} style={{ width: `${Math.max(10, Math.min(100, 50 + sport.roi * 2))}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 relative">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Info className="w-24 h-24 text-white" />
                 </div>
                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    AI Insights (Beta)
                </h3>
                
                <div className="space-y-4 relative z-10">
                    <div className="p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-xl flex gap-3">
                         <div className="mt-1">
                             <TrendingUp className="w-4 h-4 text-emerald-400" />
                         </div>
                         <div>
                             <h4 className="text-sm font-bold text-emerald-400 mb-1">Interval Cote Optim</h4>
                             <p className="text-xs text-slate-400 leading-relaxed">
                                 Ai cea mai mare profitabilitate pe cote între <span className="text-white font-bold">1.80 - 2.20</span>.
                                 Evită cotele sub 1.40, unde ai un ROI negativ (-4%).
                             </p>
                         </div>
                    </div>

                    <div className="p-3 bg-red-900/10 border border-red-500/20 rounded-xl flex gap-3">
                         <div className="mt-1">
                             <TrendingDown className="w-4 h-4 text-red-400" />
                         </div>
                         <div>
                             <h4 className="text-sm font-bold text-red-400 mb-1">Atenție la Live Betting</h4>
                             <p className="text-xs text-slate-400 leading-relaxed">
                                 Performanța ta pe pariuri Live este cu 15% sub cea Pre-match. 
                                 Recomandăm focus pe strategia Pre-match pentru luna viitoare.
                             </p>
                         </div>
                    </div>
                    
                    <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-white/5 transition-colors mt-2">
                        Generează Raport Detaliat cu AI
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};