
import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Lock,
  History,
  PieChart,
  Download
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

interface Transaction {
  id: string;
  type: 'in' | 'out' | 'internal';
  amount: number;
  entity: string;
  method: string;
  status: 'completed' | 'pending' | 'rejected';
  timestamp: string;
}

interface WithdrawalRequest {
  id: string;
  user: string;
  amount: number;
  method: 'Revolut' | 'Bank' | 'Crypto';
  details: string;
  riskScore: 'low' | 'medium' | 'high';
  timestamp: string;
}

export const Treasury: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [totalLiquidity, setTotalLiquidity] = useState(142850.00);
  const [hotWallet, setHotWallet] = useState(42850.00); // Available for immediate betting/withdrawals
  const [coldStorage, setColdStorage] = useState(100000.00); // Secure vault
  
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Queue de retrageri (Demo Data)
  const [requests, setRequests] = useState<WithdrawalRequest[]>([
    { id: 'WTH-9921', user: 'Alex I. (Tier 1)', amount: 500.00, method: 'Revolut', details: '@alexinvestor', riskScore: 'low', timestamp: '10 min ago' },
    { id: 'WTH-9922', user: 'Mihai B. (Pro)', amount: 2500.00, method: 'Crypto', details: 'TRC20: T9...xj2', riskScore: 'medium', timestamp: '45 min ago' },
    { id: 'WTH-9923', user: 'Elena D. (Whale)', amount: 12000.00, method: 'Bank', details: 'RO98 BTRL...', riskScore: 'high', timestamp: '2 hours ago' },
  ]);

  // Istoric Tranzacții
  const [history, setHistory] = useState<Transaction[]>([
    { id: 'TX-1001', type: 'in', amount: 5000, entity: 'Gateway Stripe', method: 'Auto-Deposit', status: 'completed', timestamp: '10:42 AM' },
    { id: 'TX-1002', type: 'out', amount: 250, entity: 'User #8821', method: 'Revolut', status: 'completed', timestamp: '09:15 AM' },
    { id: 'TX-1003', type: 'internal', amount: 1500, entity: 'Bet365 Account', method: 'Allocation', status: 'completed', timestamp: '08:30 AM' },
  ]);

  // --- ACTIONS ---

  const handleApprove = (req: WithdrawalRequest) => {
    setProcessingId(req.id);
    
    setTimeout(() => {
        // 1. Remove from queue
        setRequests(prev => prev.filter(r => r.id !== req.id));
        
        // 2. Deduct from Hot Wallet
        setHotWallet(prev => prev - req.amount);
        setTotalLiquidity(prev => prev - req.amount);

        // 3. Add to History
        const newTx: Transaction = {
            id: `TX-${Math.floor(Math.random() * 10000)}`,
            type: 'out',
            amount: req.amount,
            entity: req.user.split('(')[0].trim(),
            method: req.method,
            status: 'completed',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setHistory(prev => [newTx, ...prev]);
        setProcessingId(null);
    }, 1500);
  };

  const handleReject = (req: WithdrawalRequest) => {
    setProcessingId(req.id);
    setTimeout(() => {
        setRequests(prev => prev.filter(r => r.id !== req.id));
        const newTx: Transaction = {
            id: `TX-${Math.floor(Math.random() * 10000)}`,
            type: 'out',
            amount: req.amount,
            entity: req.user.split('(')[0].trim(),
            method: req.method,
            status: 'rejected',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setHistory(prev => [newTx, ...prev]);
        setProcessingId(null);
    }, 1000);
  };

  const handleRebalance = () => {
      // Simulează o mutare din Cold în Hot
      const amount = 5000;
      if (coldStorage >= amount) {
          setColdStorage(prev => prev - amount);
          setHotWallet(prev => prev + amount);
          const newTx: Transaction = {
            id: `INT-${Math.floor(Math.random() * 10000)}`,
            type: 'internal',
            amount: amount,
            entity: 'Vault -> Hot Wallet',
            method: 'Rebalance',
            status: 'completed',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        setHistory(prev => [newTx, ...prev]);
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <Landmark className="w-6 h-6 text-emerald-400" /> Treasury & Finance HQ
                </h2>
                <p className="text-slate-400 text-sm">Monitorizare lichiditate, aprobare plăți și reconciliere bancară.</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end mr-4">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Curs Referință</span>
                    <span className="text-xs text-white font-mono">1 EUR = 4.97 RON</span>
                </div>
                <Button3D variant="cyan" onClick={handleRebalance} className="text-xs px-4 py-2 h-auto">
                    <RefreshCw className="w-4 h-4 mr-2" /> Rebalansare Automată
                </Button3D>
            </div>
        </div>

        {/* VAULT HUD - Top Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Liquidity Card */}
            <TiltCard glowColor="emerald" className="lg:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Lock className="w-32 h-32 text-emerald-400" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-emerald-500/20 rounded border border-emerald-500/30">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Total Fond Garantat</span>
                    </div>
                    <div className="text-5xl font-display font-bold text-white tracking-tight mb-2">
                        {totalLiquidity.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} <span className="text-xl text-slate-500">RON</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-500 font-bold">+4.2%</span>
                        <span>față de luna trecută</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5 relative z-10">
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                            <Wallet className="w-3 h-3" /> Hot Wallet (Operational)
                        </div>
                        <div className="text-xl font-mono font-bold text-white">{hotWallet.toLocaleString('ro-RO')} RON</div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                             <div className="h-full bg-emerald-400 w-[30%]"></div>
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Cold Storage (Vault)
                        </div>
                        <div className="text-xl font-mono font-bold text-slate-300">{coldStorage.toLocaleString('ro-RO')} RON</div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                             <div className="h-full bg-slate-500 w-[70%]"></div>
                        </div>
                    </div>
                </div>
            </TiltCard>

            {/* Asset Allocation Pie (Simplified Visual) */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                    <h3 className="text-white font-bold flex items-center gap-2 mb-6">
                        <PieChart className="w-5 h-5 text-purple-400" /> Distribuție Active
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-slate-300">Fiat (RON/EUR)</span>
                            </div>
                            <span className="font-mono text-white">65%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                <span className="text-slate-300">Crypto (USDT)</span>
                            </div>
                            <span className="font-mono text-white">25%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                                <span className="text-slate-300">Escrow (Betting)</span>
                            </div>
                            <span className="font-mono text-white">10%</span>
                        </div>
                    </div>
                </div>
                <button className="w-full py-2 mt-4 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 uppercase tracking-wider rounded-lg transition-colors border border-white/5">
                    Descarcă Raport Audit
                </button>
            </div>
        </div>

        {/* MAIN WORKSPACE SPLIT */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: WITHDRAWAL QUEUE */}
            <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ArrowUpRight className="w-5 h-5 text-yellow-500" />
                        Pending Withdrawals
                        <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-0.5 rounded border border-yellow-500/20">{requests.length}</span>
                    </h3>
                    <div className="text-xs text-slate-500">Timp mediu procesare: <span className="text-emerald-400">12 min</span></div>
                </div>

                <div className="space-y-2">
                    {requests.length === 0 ? (
                        <div className="h-40 bg-slate-900/30 border border-white/5 rounded-xl flex flex-col items-center justify-center text-slate-500">
                            <CheckCircle2 className="w-10 h-10 mb-2 opacity-20" />
                            <p className="text-sm">Toate cererile au fost procesate.</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <TiltCard key={req.id} glowColor={req.riskScore === 'high' ? 'red' : 'cyan'} noPadding hFull={false} className="p-3 relative group">
                                {processingId === req.id && (
                                    <div className="absolute inset-0 bg-slate-900/90 z-20 flex items-center justify-center backdrop-blur-sm rounded-xl">
                                        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                                    </div>
                                )}
                                
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold border ${
                                            req.method === 'Crypto' ? 'bg-purple-900/20 border-purple-500/30 text-purple-400' :
                                            req.method === 'Revolut' ? 'bg-blue-900/20 border-blue-500/30 text-blue-400' :
                                            'bg-slate-800 border-slate-600 text-slate-300'
                                        }`}>
                                            {req.method === 'Crypto' ? '₿' : req.method === 'Revolut' ? 'R' : 'B'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-sm">{req.user}</span>
                                                {req.riskScore === 'high' && (
                                                    <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 rounded flex items-center gap-1 uppercase tracking-wider">
                                                        <AlertTriangle className="w-2 h-2" /> Risk
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                                                {req.details} <span className="opacity-50">|</span> {req.timestamp}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-[9px] text-slate-500 uppercase font-bold">Sumă</div>
                                            <div className="text-sm font-mono font-bold text-white">{req.amount.toLocaleString()} RON</div>
                                        </div>
                                        
                                        {/* Mobile Amount */}
                                        <div className="sm:hidden text-sm font-mono font-bold text-white">
                                            {req.amount.toLocaleString()} RON
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleReject(req)}
                                                className="p-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-500 border border-red-500/20 rounded transition-colors"
                                                title="Respinge"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleApprove(req)}
                                                className="p-1.5 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-500 border border-emerald-500/20 rounded transition-colors shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                                title="Aprobă & Transferă"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </TiltCard>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: TRANSACTION LEDGER */}
            <div className="lg:col-span-5 bg-slate-900/30 border border-white/5 rounded-2xl p-6 flex flex-col h-[500px]">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-cyan-400" /> Live Ledger
                    </h3>
                    <button className="text-xs text-cyan-400 hover:text-white flex items-center gap-1 transition-colors">
                        <Download className="w-3 h-3" /> Export CSV
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {history.map((tx) => (
                        <div key={tx.id} className="p-3 bg-slate-950/50 border border-white/5 rounded-lg flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full border ${
                                    tx.type === 'in' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                    tx.type === 'out' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                }`}>
                                    {tx.type === 'in' ? <ArrowDownRight className="w-3 h-3" /> :
                                     tx.type === 'out' ? <ArrowUpRight className="w-3 h-3" /> :
                                     <RefreshCw className="w-3 h-3" />}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white">{tx.entity}</div>
                                    <div className="text-[10px] text-slate-500">{tx.method} • {tx.timestamp}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-mono font-bold ${
                                    tx.status === 'rejected' ? 'text-slate-500 line-through' :
                                    tx.type === 'in' ? 'text-emerald-400' : 'text-white'
                                }`}>
                                    {tx.type === 'out' ? '-' : '+'}{tx.amount.toLocaleString()}
                                </div>
                                <div className={`text-[10px] uppercase font-bold ${
                                    tx.status === 'completed' ? 'text-emerald-500' :
                                    tx.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                                }`}>
                                    {tx.status}
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    </div>
  );
};
