import React, { useState, useEffect, useRef } from 'react';
import { 
  Radar, 
  Search, 
  Activity, 
  Zap, 
  Server, 
  Radio, 
  RefreshCw, 
  Info,
  ArrowDownCircle
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';

export const LiveScanner: React.FC = () => {
  const [scannerLogs, setScannerLogs] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Track if we should auto-scroll using a Ref to avoid re-render loops
  const shouldAutoScroll = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const valueBets = [
    { sport: 'Football', league: 'Premier League', event: 'Chelsea vs Arsenal', market: 'Over 2.5', odds: 1.95, trueOdds: 1.80, edge: '8.3%', bookie: 'Bet365', status: 'Available' },
    { sport: 'Tennis', league: 'ATP Paris', event: 'Sinner vs Rune', market: 'Sinner -3.5', odds: 1.88, trueOdds: 1.75, edge: '7.4%', bookie: 'Unibet', status: 'Available' },
    { sport: 'Basketball', league: 'NBA', event: 'Celtics vs Heat', market: 'Heat +8.5', odds: 1.91, trueOdds: 1.82, edge: '4.9%', bookie: 'Superbet', status: 'Processing' },
  ];

  // Log Simulation
  useEffect(() => {
    const actions = [
        "Scanning Premier League matches...",
        "Analyzing liquidity on Bet365...",
        "Ping: 12ms to Server EU-West-1",
        "Calculating EV for ID #9921...",
        "Comparing odds: Pinnacle vs Soft Bookies...",
        "No value found in Bundesliga (GER). Skipping.",
        "Refreshing API tokens...",
        "Monitoring heavy drop on Market: 1X2...",
        "Discrepancy detected: 0.05 deviation.",
        "Verification complete. Secure connection stable."
    ];

    const interval = setInterval(() => {
        const randomLog = actions[Math.floor(Math.random() * actions.length)];
        const time = new Date().toLocaleTimeString('ro-RO', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setScannerLogs(prev => [...prev.slice(-40), `[${time}] ${randomLog}`]); 
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Auto-Scroll Effect
  useEffect(() => {
    if (shouldAutoScroll.current && scrollContainerRef.current) {
      // Use instant scroll behavior for updates to prevent fighting user input
      // This is key: 'smooth' behavior creates a timeline where user input is ignored/overwritten
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'instant'
      });
    }
  }, [scannerLogs]);

  // Handle User Scroll Interaction
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // We calculate distance from bottom. 
    // If it's greater than a small threshold (e.g., 20px), we assume user wants to read history.
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom < 20;

    shouldAutoScroll.current = isAtBottom;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      shouldAutoScroll.current = true;
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth' // We can use smooth here because it's a user-initiated click
      });
      setShowScrollButton(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <Radar className="w-6 h-6 text-red-500 animate-pulse" /> Live Scanner
                </h2>
                <p className="text-slate-400 text-sm">Algoritmul monitorizează 50+ case de pariuri în timp real.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                SYSTEM_ACTIVE
            </div>
        </div>

        {/* Scanner Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TiltCard glowColor="purple" noPadding className="p-4 flex flex-col justify-between h-24">
                <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Scanned Events</span>
                    <Search className="w-4 h-4 text-violet-400" />
                </div>
                <div className="text-2xl font-mono font-bold text-white">14,205</div>
            </TiltCard>
            <TiltCard glowColor="cyan" noPadding className="p-4 flex flex-col justify-between h-24">
                <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Speed</span>
                    <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-mono font-bold text-white">85 <span className="text-xs text-slate-500">ev/sec</span></div>
            </TiltCard>
            <TiltCard glowColor="emerald" noPadding className="p-4 flex flex-col justify-between h-24 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-6 bg-emerald-500/10 rounded-bl-full"></div>
                <div className="flex justify-between items-start relative z-10">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Value Found</span>
                    <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-mono font-bold text-emerald-400 relative z-10">3</div>
            </TiltCard>
            <TiltCard glowColor="red" noPadding className="p-4 flex flex-col justify-between h-24">
                <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Bookies</span>
                    <Server className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-mono font-bold text-white">52</div>
            </TiltCard>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 h-[600px]">
            {/* Left: Terminal Console */}
            <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Radar Visual */}
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex items-center justify-center relative overflow-hidden h-48">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)]"></div>
                    {/* Concentric Circles */}
                    <div className="absolute w-32 h-32 rounded-full border border-cyan-500/20"></div>
                    <div className="absolute w-24 h-24 rounded-full border border-cyan-500/30"></div>
                    <div className="absolute w-16 h-16 rounded-full border border-cyan-500/40"></div>
                    {/* Scanner Line */}
                    <div className="w-40 h-40 rounded-full border border-transparent border-t-cyan-500/80 animate-spin absolute shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
                    
                    <div className="text-center relative z-10">
                        <div className="text-3xl font-display font-bold text-white">SCANNING</div>
                        <div className="text-xs text-cyan-400 font-mono mt-1">TARGET: ALL MARKETS</div>
                    </div>
                </div>

                {/* Console Log */}
                <div className="bg-black rounded-xl border border-slate-800 p-4 font-mono text-xs flex-1 overflow-hidden flex flex-col shadow-inner relative group">
                    <div className="text-slate-500 mb-2 pb-2 border-b border-white/10 flex justify-between">
                        <span>root@algo-node-01:~$ tail -f /var/log/scanner</span>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500/20"></div>
                        </div>
                    </div>
                    
                    <div 
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto custom-scrollbar space-y-1"
                    >
                        {scannerLogs.map((log, i) => (
                            <div key={i} className="text-emerald-500/80 break-words animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-slate-600 mr-2">{'>'}</span>{log}
                            </div>
                        ))}
                    </div>

                    {/* Smart Scroll Button */}
                    <div className={`absolute bottom-4 right-4 transition-all duration-300 ${showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <button 
                            onClick={scrollToBottom}
                            className="bg-slate-800 text-white p-2 rounded-full shadow-lg border border-white/20 hover:bg-slate-700 hover:border-cyan-500/50 transition-all flex items-center gap-2 group/btn"
                        >
                            <span className="text-[10px] font-bold uppercase w-0 overflow-hidden group-hover/btn:w-auto group-hover/btn:pr-1 transition-all">Resume</span>
                            <ArrowDownCircle className="w-5 h-5 text-cyan-400 animate-bounce" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Value Bets Feed */}
            <div className="lg:col-span-7 bg-slate-900/30 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Radio className="w-5 h-5 text-cyan-400" />
                        Oportunități Identificate
                    </h3>
                    <button className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                        <RefreshCw className="w-3 h-3" /> Auto-Refresh
                    </button>
                </div>

                <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                    {valueBets.map((bet, i) => (
                        <div key={i} className="bg-slate-950/80 border border-white/5 hover:border-cyan-500/30 rounded-xl p-4 transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex gap-3 items-center">
                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                        {bet.sport.substring(0,2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            {bet.league} <span className="w-1 h-1 rounded-full bg-slate-600"></span> {bet.bookie}
                                        </div>
                                        <div className="font-bold text-white text-sm">{bet.event}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">Edge (ROI)</div>
                                    <div className="text-emerald-400 font-bold font-mono text-lg">{bet.edge}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 bg-white/5 rounded-lg p-2 text-center text-xs mb-3">
                                <div>
                                    <div className="text-slate-500 mb-0.5">Selection</div>
                                    <div className="text-white font-bold">{bet.market}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 mb-0.5">Bookie Odds</div>
                                    <div className="text-cyan-300 font-bold font-mono">{bet.odds}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 mb-0.5">Real Odds</div>
                                    <div className="text-slate-300 font-mono">{bet.trueOdds}</div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2 rounded transition-colors uppercase tracking-wide">
                                    Place Bet
                                </button>
                                <button className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors">
                                    <Info className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {valueBets.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500 opacity-50">
                            <Search className="w-8 h-8 mb-2" />
                            <p>Scanning for value...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};