import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ShieldAlert, ArrowDownCircle } from 'lucide-react';

export const SecurityLogs: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll state
  const shouldAutoScroll = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const messages = [
        "[AUTH] User Alex I. logged in from 192.168.1.10",
        "[SYS] Database backup started...",
        "[SYS] Database backup completed (2.4s)",
        "[API] Rate limit warning for key API-9921",
        "[BET] ValueBet_Engine placed order #88291 on Bet365",
        "[SEC] Suspicious activity detected on port 443",
        "[SEC] IP 82.11.22.3 blocked by firewall",
        "[AUTH] Admin session refreshed",
        "[SYS] Integrity check passed",
        "[WARN] High latency on node EU-West-1 (140ms)"
    ];

    const interval = setInterval(() => {
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        const time = new Date().toISOString().split('T')[1].split('.')[0];
        const logEntry = `[${time}] ${randomMsg}`;
        setLogs(prev => [...prev.slice(-30), logEntry]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (shouldAutoScroll.current && scrollContainerRef.current) {
      // Use instant behavior to avoid UI fighting
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'instant'
      });
    }
  }, [logs]);

  // Handle manual scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Strict threshold: if user moves up > 20px, stop auto-scrolling
    const isAtBottom = distanceFromBottom < 20;
    
    shouldAutoScroll.current = isAtBottom;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
        shouldAutoScroll.current = true;
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
        setShowScrollButton(false);
    }
  };

  return (
    <div className="h-[600px] flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                <Terminal className="w-6 h-6 text-red-500" /> Security & System Logs
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-950/30 border border-red-500/20 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-red-400">LIVE_STREAM</span>
            </div>
        </div>

        <div className="flex-1 bg-black rounded-xl border border-red-900/30 p-1 relative overflow-hidden shadow-2xl group">
            {/* Terminal Window Header */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900/80 border-b border-white/10 flex items-center px-4 gap-2 z-10">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                <div className="ml-4 text-[10px] text-slate-500 font-mono">root@admin-console:~# tail -f /var/log/syslog</div>
            </div>

            {/* Logs Content */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="h-full pt-10 pb-4 px-4 overflow-y-auto custom-scrollbar font-mono text-xs relative"
            >
                {logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${
                        log.includes('[WARN]') ? 'text-yellow-500' : 
                        log.includes('[SEC]') ? 'text-red-400 font-bold' : 
                        log.includes('[AUTH]') ? 'text-cyan-400' :
                        'text-slate-400'
                    }`}>
                        <span className="opacity-50 mr-2">{'>'}</span>{log}
                    </div>
                ))}
            </div>

            {/* Scroll Button */}
            <div className={`absolute bottom-4 right-4 z-30 transition-all duration-300 ${showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                 <button 
                     onClick={scrollToBottom}
                     className="bg-red-950 text-red-100 p-2 rounded-full shadow-lg border border-red-500/30 hover:bg-red-900 transition-all flex items-center gap-2"
                 >
                     <span className="text-[10px] font-bold uppercase hidden group-hover:block pr-1">Sync</span>
                     <ArrowDownCircle className="w-5 h-5 text-red-500 animate-pulse" />
                 </button>
            </div>

            {/* Scanlines Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] z-20 opacity-20"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-lg flex items-center gap-4">
                <ShieldAlert className="w-8 h-8 text-red-500" />
                <div>
                    <div className="text-xs text-red-400 font-bold uppercase">Threat Level</div>
                    <div className="text-xl font-display text-white">LOW</div>
                </div>
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-lg flex flex-col justify-center">
                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Failed Logins (24h)</div>
                <div className="text-xl font-mono text-white">24</div>
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-lg flex flex-col justify-center">
                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Active Sessions</div>
                <div className="text-xl font-mono text-white">3</div>
            </div>
        </div>
    </div>
  );
};