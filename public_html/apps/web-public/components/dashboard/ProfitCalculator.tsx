
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  RefreshCcw, 
  DollarSign, 
  Percent, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Info
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

export const ProfitCalculator: React.FC = () => {
  // --- COMPOUND INTEREST STATE ---
  const [startBank, setStartBank] = useState<number>(1000);
  const [monthlyRoi, setMonthlyRoi] = useState<number>(15);
  const [months, setMonths] = useState<number>(12);

  // --- KELLY CRITERION STATE ---
  const [kellyOdds, setKellyOdds] = useState<number>(2.00);
  const [kellyWinRate, setKellyWinRate] = useState<number>(55);
  const [kellyBank, setKellyBank] = useState<number>(1000);

  // --- CALCULATIONS: COMPOUND INTEREST ---
  const projectionData = useMemo(() => {
    let currentBalance = startBank;
    const data = [{ month: 0, balance: startBank, profit: 0 }];
    
    for (let i = 1; i <= months; i++) {
        const monthlyProfit = currentBalance * (monthlyRoi / 100);
        currentBalance += monthlyProfit;
        data.push({
            month: i,
            balance: Math.round(currentBalance),
            profit: Math.round(monthlyProfit)
        });
    }
    return data;
  }, [startBank, monthlyRoi, months]);

  const finalBalance = projectionData[projectionData.length - 1].balance;
  const totalProfit = finalBalance - startBank;
  const growthMultiplier = (finalBalance / startBank).toFixed(1);

  // --- CHART GENERATION ---
  const generateChartPath = () => {
    if (projectionData.length < 2) return "";
    
    const maxVal = finalBalance;
    const minVal = startBank;
    const range = maxVal - minVal || 1; 

    return projectionData.map((d, i) => {
        const x = (i / months) * 100;
        const y = 100 - ((d.balance - (minVal * 0.8)) / (maxVal - (minVal * 0.8))) * 85;
        return `${x},${y}`;
    }).join(' ');
  };

  const chartPath = generateChartPath();
  const chartFill = `0,100 ${chartPath} 100,100`;

  // --- CALCULATIONS: KELLY ---
  const kellyResult = useMemo(() => {
      const b = kellyOdds - 1;
      const p = kellyWinRate / 100;
      const q = 1 - p;
      
      const f = (b * p - q) / b;
      return f; 
  }, [kellyOdds, kellyWinRate]);

  const kellyPercentage = (kellyResult * 100).toFixed(2);
  const kellyStake = Math.round(kellyBank * kellyResult);
  const isPositiveEV = kellyResult > 0;

  return (
    <div className="h-[calc(100vh-110px)] flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-1 overflow-hidden">
        
        {/* Compact Header */}
        <div className="flex-none flex flex-col md:flex-row justify-between md:items-center gap-1 px-1 min-h-[40px]">
            <div>
                <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-cyan-400" /> Calculator Profit & Risc
                </h2>
            </div>
            <div className="hidden md:flex items-center gap-2 px-2 py-0.5 bg-violet-900/20 border border-violet-500/20 rounded-lg">
                <Scale className="w-3 h-3 text-violet-400" />
                <span className="text-[9px] font-mono text-violet-300">KELLY_CRITERION_ENABLED</span>
            </div>
        </div>

        {/* MAIN SPLIT CONTAINER - STRICT GRID LAYOUT */}
        {/* This grid forces exact height distribution: 55% Top, 43% Bottom, 2% Gap */}
        <div className="flex-1 min-h-0 grid grid-rows-[55%_43%] gap-[2%]">
            
            {/* TOP ROW: COMPOUND INTEREST */}
            <div className="min-h-0 grid lg:grid-cols-12 gap-2 h-full">
                {/* Inputs Panel */}
                <div className="lg:col-span-3 h-full min-h-0">
                    <TiltCard glowColor="cyan" className="h-full flex flex-col" noPadding>
                        <div className="p-2 border-b border-white/5 bg-slate-900/50 flex-none">
                            <h3 className="font-bold text-white flex items-center gap-2 text-[10px] uppercase tracking-wider">
                                <TrendingUp className="w-3 h-3 text-cyan-400" /> Parametri
                            </h3>
                        </div>
                        
                        <div className="p-3 flex-1 flex flex-col justify-center gap-2 overflow-y-auto custom-scrollbar min-h-0">
                            <div className="space-y-0.5">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                                    Banca Inițială <span className="text-white">{startBank}</span>
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-2 w-3 h-3 text-slate-600" />
                                    <input 
                                        type="number" 
                                        value={startBank}
                                        onChange={(e) => setStartBank(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-md py-1 pl-6 pr-2 text-[10px] text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                    />
                                </div>
                                <input type="range" min="100" max="50000" step="100" value={startBank} onChange={(e) => setStartBank(Number(e.target.value))} className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                            </div>

                            <div className="space-y-0.5">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                                    ROI Lunar <span className="text-white">{monthlyRoi}%</span>
                                </label>
                                <div className="relative">
                                    <Percent className="absolute left-2 top-2 w-3 h-3 text-slate-600" />
                                    <input 
                                        type="number" 
                                        value={monthlyRoi}
                                        onChange={(e) => setMonthlyRoi(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-md py-1 pl-6 pr-2 text-[10px] text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                    />
                                </div>
                                <input type="range" min="1" max="100" step="0.5" value={monthlyRoi} onChange={(e) => setMonthlyRoi(Number(e.target.value))} className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                            </div>

                            <div className="space-y-0.5">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                                    Perioada <span className="text-white">{months} luni</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-2 w-3 h-3 text-slate-600" />
                                    <input 
                                        type="number" 
                                        value={months}
                                        onChange={(e) => setMonths(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-md py-1 pl-6 pr-2 text-[10px] text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                    />
                                </div>
                                <input type="range" min="1" max="60" step="1" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                            </div>
                        </div>

                        <div className="p-2 bg-cyan-900/10 border-t border-white/5 mt-auto flex justify-between items-center flex-none">
                             <div>
                                <span className="text-[9px] text-slate-400 uppercase block">Creștere</span>
                                <span className="text-xs font-bold text-cyan-400">{growthMultiplier}x</span>
                             </div>
                             <Button3D variant="cyan" className="text-[9px] py-1 px-3 h-auto" onClick={() => { setStartBank(1000); setMonthlyRoi(15); setMonths(12); }}>
                                Reset
                             </Button3D>
                        </div>
                    </TiltCard>
                </div>

                {/* Chart Panel */}
                <div className="lg:col-span-9 h-full min-h-0">
                    <TiltCard glowColor="emerald" className="h-full relative overflow-hidden flex flex-col p-0" noPadding>
                        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                             <TrendingUp className="w-48 h-48 text-emerald-500" />
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-4 p-3 border-b border-white/5 bg-slate-900/30 flex-none">
                            <div>
                                 <div className="text-slate-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Balanță Finală</div>
                                 <div className="text-lg font-display font-bold text-white">{finalBalance.toLocaleString()} <span className="text-xs text-slate-500">RON</span></div>
                            </div>
                            <div>
                                 <div className="text-slate-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Profit Net</div>
                                 <div className="text-lg font-display font-bold text-emerald-400">+{totalProfit.toLocaleString()} <span className="text-xs text-emerald-600/50">RON</span></div>
                            </div>
                        </div>

                        <div className="flex-1 relative mx-2 mb-2 mt-2 overflow-hidden min-h-0">
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-px bg-white"></div>)}
                            </div>
                            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                 <defs>
                                    <linearGradient id="calcChartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                    </linearGradient>
                                 </defs>
                                 <polygon points={chartFill} fill="url(#calcChartGradient)" />
                                 <polyline points={chartPath} fill="none" stroke="#10b981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                 <circle cx="100" cy={100 - ((finalBalance - (startBank * 0.8)) / (finalBalance - (startBank * 0.8))) * 85} r="2" fill="#fff" className="animate-pulse" />
                            </svg>
                        </div>
                    </TiltCard>
                </div>
            </div>

            {/* BOTTOM ROW: KELLY CRITERION */}
            <div className="min-h-0 h-full">
                <TiltCard glowColor="purple" className="h-full flex flex-col" noPadding>
                    <div className="h-full flex flex-col md:flex-row">
                        
                        {/* Kelly Info & Header */}
                        <div className="md:w-1/4 p-3 border-b md:border-b-0 md:border-r border-white/5 bg-slate-900/50 flex flex-col justify-center">
                            <h3 className="font-bold text-white flex items-center gap-2 text-xs mb-1">
                                <Scale className="w-3 h-3 text-violet-400" /> Kelly Criterion
                            </h3>
                            <p className="text-[9px] text-slate-400 leading-relaxed mb-2">
                                Calculează miza optimă matematic pentru a maximiza creșterea băncii.
                            </p>
                            <div className="text-[8px] text-slate-500 bg-slate-950 p-1.5 rounded border border-white/5">
                                *Recomandare: Folosește Fractional Kelly (50%).
                            </div>
                        </div>

                        {/* Kelly Inputs - Horizontal Grid */}
                        <div className="md:w-1/2 p-3 grid grid-cols-3 gap-3 items-center">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Cota</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={kellyOdds}
                                    onChange={(e) => setKellyOdds(Number(e.target.value))}
                                    className="w-full bg-black border border-slate-700 rounded px-2 py-1.5 text-white text-xs font-mono font-bold focus:border-violet-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Probabilitate %</label>
                                <input 
                                    type="number" 
                                    value={kellyWinRate}
                                    onChange={(e) => setKellyWinRate(Number(e.target.value))}
                                    className="w-full bg-black border border-slate-700 rounded px-2 py-1.5 text-white text-xs font-mono font-bold focus:border-violet-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Banca</label>
                                <input 
                                    type="number" 
                                    value={kellyBank}
                                    onChange={(e) => setKellyBank(Number(e.target.value))}
                                    className="w-full bg-black border border-slate-700 rounded px-2 py-1.5 text-white text-xs font-mono font-bold focus:border-violet-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Kelly Result - Big Display */}
                        <div className={`md:w-1/4 p-3 flex flex-col justify-center items-center text-center transition-colors ${
                            isPositiveEV ? 'bg-violet-900/10' : 'bg-red-900/10'
                        }`}>
                            {isPositiveEV ? (
                                <>
                                    <div className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Value Bet
                                    </div>
                                    <div className="text-2xl font-display font-bold text-white mb-0.5">{kellyPercentage}%</div>
                                    <div className="text-[9px] text-slate-400 mb-1">Miză Optimă</div>
                                    <div className="bg-black/40 px-2 py-0.5 rounded border border-violet-500/20 w-full max-w-[100px]">
                                        <span className="text-white font-bold font-mono text-xs">{kellyStake} RON</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> EV Negativ
                                    </div>
                                    <div className="text-[9px] text-slate-400 leading-tight max-w-[150px]">
                                        Nu paria. Cota este prea mică.
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </TiltCard>
            </div>
        </div>
    </div>
  );
};
