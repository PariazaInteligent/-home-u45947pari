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
    const range = maxVal - minVal || 1; // avoid divide by zero

    return projectionData.map((d, i) => {
        const x = (i / months) * 100;
        // Normalize y to 0-100 scale (inverted because SVG 0 is top)
        // We ensure the chart starts at the bottom-ish if growth is huge
        const y = 100 - ((d.balance - (minVal * 0.5)) / (maxVal - (minVal * 0.5))) * 80;
        return `${x},${y}`;
    }).join(' ');
  };

  const chartPath = generateChartPath();
  const chartFill = `0,100 ${chartPath} 100,100`;

  // --- CALCULATIONS: KELLY ---
  // Formula: (bp - q) / b
  // b = odds - 1
  // p = probability
  // q = 1 - p
  const kellyResult = useMemo(() => {
      const b = kellyOdds - 1;
      const p = kellyWinRate / 100;
      const q = 1 - p;
      
      const f = (b * p - q) / b;
      return f; // Decimal percentage (e.g. 0.05 for 5%)
  }, [kellyOdds, kellyWinRate]);

  const kellyPercentage = (kellyResult * 100).toFixed(2);
  const kellyStake = Math.round(kellyBank * kellyResult);
  const isPositiveEV = kellyResult > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-cyan-400" /> Calculator Profit & Risc
                </h2>
                <p className="text-slate-400 text-sm">Simulează creșterea exponențială și optimizează mizele.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-violet-900/20 border border-violet-500/20 rounded-lg">
                <Scale className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-mono text-violet-300">KELLY_CRITERION_ENABLED</span>
            </div>
        </div>

        {/* SECTION 1: COMPOUND INTEREST SIMULATOR */}
        <div className="grid lg:grid-cols-12 gap-6">
            {/* Input Controls */}
            <div className="lg:col-span-4 space-y-6">
                <TiltCard glowColor="cyan" className="h-full flex flex-col justify-between" noPadding>
                    <div className="p-6 border-b border-white/5 bg-slate-900/50">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-cyan-400" /> Simulare Dobândă Compusă
                        </h3>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                                Banca Inițială <span className="text-white">{startBank} RON</span>
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                                <input 
                                    type="number" 
                                    value={startBank}
                                    onChange={(e) => setStartBank(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>
                            <input 
                                type="range" min="100" max="50000" step="100" 
                                value={startBank} 
                                onChange={(e) => setStartBank(Number(e.target.value))}
                                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                                ROI Lunar Estimat <span className="text-white">{monthlyRoi}%</span>
                            </label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                                <input 
                                    type="number" 
                                    value={monthlyRoi}
                                    onChange={(e) => setMonthlyRoi(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>
                            <input 
                                type="range" min="1" max="100" step="0.5" 
                                value={monthlyRoi} 
                                onChange={(e) => setMonthlyRoi(Number(e.target.value))}
                                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                                Perioada (Luni) <span className="text-white">{months} luni</span>
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                                <input 
                                    type="number" 
                                    value={months}
                                    onChange={(e) => setMonths(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>
                            <input 
                                type="range" min="1" max="60" step="1" 
                                value={months} 
                                onChange={(e) => setMonths(Number(e.target.value))}
                                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-cyan-900/10 border-t border-white/5 mt-auto">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-xs text-slate-400 uppercase">Creștere Totală</span>
                             <span className="text-xl font-bold text-cyan-400">{growthMultiplier}x</span>
                         </div>
                         <Button3D variant="cyan" className="w-full text-xs" onClick={() => { setStartBank(1000); setMonthlyRoi(15); setMonths(12); }}>
                            <RefreshCcw className="w-4 h-4 mr-2" /> Resetează Parametrii
                         </Button3D>
                    </div>
                </TiltCard>
            </div>

            {/* Results Visualization */}
            <div className="lg:col-span-8">
                <TiltCard glowColor="emerald" className="h-full relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
                         <TrendingUp className="w-48 h-48 text-emerald-500" />
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-8 mb-8">
                        <div>
                             <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Balanță Finală Estimată</div>
                             <div className="text-4xl font-display font-bold text-white">{finalBalance.toLocaleString()} <span className="text-lg text-slate-500">RON</span></div>
                        </div>
                        <div>
                             <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Profit Total Generat</div>
                             <div className="text-4xl font-display font-bold text-emerald-400">+{totalProfit.toLocaleString()} <span className="text-lg text-emerald-600/50">RON</span></div>
                        </div>
                    </div>

                    {/* SVG Chart Container */}
                    <div className="flex-1 min-h-[300px] bg-slate-900/50 rounded-xl border border-white/5 relative p-4 group">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none opacity-10">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-px bg-white"></div>)}
                        </div>

                        {/* Chart */}
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                             <defs>
                                <linearGradient id="calcChartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                </linearGradient>
                             </defs>
                             
                             <polygon points={chartFill} fill="url(#calcChartGradient)" />
                             
                             <polyline 
                                points={chartPath} 
                                fill="none" 
                                stroke="#10b981" 
                                strokeWidth="2" 
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                             />
                             
                             {/* Last Point Marker */}
                             <circle cx="100" cy={100 - ((finalBalance - (startBank * 0.5)) / (finalBalance - (startBank * 0.5))) * 80} r="3" fill="#fff" className="animate-pulse" />
                        </svg>

                        {/* Chart Labels Overlay */}
                        <div className="absolute bottom-2 left-4 text-[10px] text-slate-500 font-mono">Start: {startBank} RON</div>
                        <div className="absolute top-2 right-4 text-[10px] text-emerald-400 font-mono font-bold">End: {finalBalance.toLocaleString()} RON</div>
                    </div>
                </TiltCard>
            </div>
        </div>

        {/* SECTION 2: KELLY CRITERION */}
        <div className="bg-slate-900/30 border-t border-white/5 pt-8">
            <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <Scale className="w-6 h-6 text-violet-400" />
                Kelly Criterion (Money Management)
            </h3>

            <div className="grid lg:grid-cols-3 gap-8">
                 {/* Kelly Inputs */}
                 <div className="lg:col-span-2 grid sm:grid-cols-3 gap-4">
                     <div className="bg-slate-900 border border-white/10 p-4 rounded-xl">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Cota Evenimentului</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={kellyOdds}
                            onChange={(e) => setKellyOdds(Number(e.target.value))}
                            className="w-full bg-black border border-slate-700 rounded px-3 py-2 text-white font-mono font-bold focus:border-violet-500 outline-none"
                        />
                     </div>
                     <div className="bg-slate-900 border border-white/10 p-4 rounded-xl">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Probabilitate Câștig (%)</label>
                        <input 
                            type="number" 
                            value={kellyWinRate}
                            onChange={(e) => setKellyWinRate(Number(e.target.value))}
                            className="w-full bg-black border border-slate-700 rounded px-3 py-2 text-white font-mono font-bold focus:border-violet-500 outline-none"
                        />
                     </div>
                     <div className="bg-slate-900 border border-white/10 p-4 rounded-xl">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Banca Disponibilă</label>
                        <input 
                            type="number" 
                            value={kellyBank}
                            onChange={(e) => setKellyBank(Number(e.target.value))}
                            className="w-full bg-black border border-slate-700 rounded px-3 py-2 text-white font-mono font-bold focus:border-violet-500 outline-none"
                        />
                     </div>
                 </div>

                 {/* Kelly Result */}
                 <div className="lg:col-span-1">
                     <div className={`h-full border rounded-xl p-6 flex flex-col justify-center items-center text-center transition-colors ${
                         isPositiveEV ? 'bg-violet-900/20 border-violet-500/30' : 'bg-red-900/20 border-red-500/30'
                     }`}>
                         {isPositiveEV ? (
                             <>
                                <div className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Value Bet Identificat
                                </div>
                                <div className="text-4xl font-display font-bold text-white mb-1">{kellyPercentage}%</div>
                                <div className="text-sm text-slate-400 mb-4">Miza recomandată din bancă</div>
                                <div className="bg-black/40 px-4 py-2 rounded-lg border border-violet-500/20">
                                    <span className="text-slate-500 text-xs mr-2">SUMA EXACTĂ:</span>
                                    <span className="text-white font-bold font-mono">{kellyStake} RON</span>
                                </div>
                             </>
                         ) : (
                             <>
                                <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> EV Negativ (Nu paria)
                                </div>
                                <div className="text-sm text-slate-400">
                                    Cota este prea mică pentru riscul asumat. Probabilitatea de câștig ar trebui să fie mai mare pentru ca acest pariu să fie profitabil pe termen lung.
                                </div>
                             </>
                         )}
                     </div>
                 </div>
            </div>

            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-white/5 text-xs text-slate-400 flex items-start gap-3">
                 <Info className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                 <p className="leading-relaxed">
                    <strong>Notă despre Kelly Criterion:</strong> Acest calculator folosește formula "Full Kelly". 
                    Deși matematic optimă pentru creșterea maximă a băncii, poate duce la volatilitate mare. 
                    Mulți investitori profesioniști folosesc "Fractional Kelly" (ex: jumătate din suma recomandată) pentru a reduce riscul.
                 </p>
            </div>
        </div>
    </div>
  );
};