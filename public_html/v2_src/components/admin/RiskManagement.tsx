
import React, { useState, useEffect } from 'react';
import {
    ShieldAlert,
    Activity,
    AlertTriangle,
    Lock,
    Unlock,
    Ban,
    Plus,
    X,
    Save,
    RefreshCw,
    Zap,
    Scale,
    Siren
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

interface BlacklistItem {
    id: string;
    name: string;
    type: 'Team' | 'League' | 'User';
    reason: string;
    date: string;
}

export const RiskManagement: React.FC = () => {
    // --- STATE ---
    const [maxDailyExposure, setMaxDailyExposure] = useState(5000);
    const [stopLossLimit, setStopLossLimit] = useState(15); // Percentage
    const [maxStakePerBet, setMaxStakePerBet] = useState(500);

    const [aiSupervision, setAiSupervision] = useState(true);
    const [autoHedge, setAutoHedge] = useState(false);
    const [circuitBreaker, setCircuitBreaker] = useState(true);

    const [lockdownMode, setLockdownMode] = useState(false);
    const [lockdownTimer, setLockdownTimer] = useState(0);

    const [newBlacklistInput, setNewBlacklistInput] = useState('');
    const [blacklistType, setBlacklistType] = useState<'Team' | 'League'>('Team');
    const [blacklist, setBlacklist] = useState<BlacklistItem[]>([
        { id: 'BL-01', name: 'FC Voluntari', type: 'Team', reason: 'Suspicious Volume', date: '20 Oct' },
        { id: 'BL-02', name: 'Liga 2 Romania', type: 'League', reason: 'Low Liquidity', date: '15 Oct' }
    ]);

    // --- DERIVED STATE (Risk Calculation) ---
    const calculateRiskScore = () => {
        let score = 0;
        // Higher exposure = higher risk
        score += (maxDailyExposure / 10000) * 30;
        // Higher stop loss = higher risk
        score += stopLossLimit * 1.5;
        // Higher stake = higher risk
        score += (maxStakePerBet / 1000) * 20;

        // Safety features reduce risk
        if (aiSupervision) score -= 10;
        if (circuitBreaker) score -= 15;
        if (autoHedge) score -= 5;

        return Math.max(0, Math.min(100, Math.round(score)));
    };

    const riskScore = calculateRiskScore();

    const getRiskColor = (score: number) => {
        if (score < 30) return 'text-emerald-400 border-emerald-500 shadow-emerald-500/20';
        if (score < 70) return 'text-yellow-400 border-yellow-500 shadow-yellow-500/20';
        return 'text-red-500 border-red-500 shadow-red-500/20';
    };

    const getRiskLabel = (score: number) => {
        if (score < 30) return 'LOW RISK';
        if (score < 70) return 'MODERATE';
        return 'CRITICAL';
    };

    // --- ACTIONS ---

    const handleAddBlacklist = () => {
        if (!newBlacklistInput.trim()) return;
        const newItem: BlacklistItem = {
            id: `BL-${Math.floor(Math.random() * 1000)}`,
            name: newBlacklistInput,
            type: blacklistType,
            reason: 'Manual Admin Add',
            date: new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
        };
        setBlacklist([newItem, ...blacklist]);
        setNewBlacklistInput('');
    };

    const handleRemoveBlacklist = (id: string) => {
        setBlacklist(prev => prev.filter(item => item.id !== id));
    };

    const toggleLockdown = () => {
        if (lockdownMode) {
            setLockdownMode(false);
        } else {
            // Activate countdown sequence visually
            setLockdownMode(true);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">

            {/* OVERLAY FOR LOCKDOWN */}
            {lockdownMode && (
                <div className="absolute inset-0 z-50 bg-red-950/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-center animate-in fade-in duration-300 border-4 border-red-500">
                    <Siren className="w-24 h-24 text-red-500 animate-pulse mb-6" />
                    <h1 className="text-5xl font-display font-bold text-white mb-2 tracking-widest">SYSTEM LOCKDOWN</h1>
                    <p className="text-red-200 font-mono text-lg mb-8 bg-black/50 px-4 py-2 rounded">
                        ALL TRADING PAUSED // WITHDRAWALS FROZEN
                    </p>
                    <Button3D variant="cyan" onClick={toggleLockdown} className="px-12 py-4">
                        <Unlock className="w-5 h-5 mr-2" /> DEACTIVATE PROTOCOL
                    </Button3D>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                        <Scale className="w-6 h-6 text-orange-500" /> Risk Management Protocol
                    </h2>
                    <p className="text-slate-400 text-sm">Parametri globali de expunere și mecanisme de siguranță automată.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 font-mono text-xs font-bold transition-all ${riskScore > 70 ? 'bg-red-900/20 border-red-500 text-red-500 animate-pulse' : 'bg-slate-900 border-white/10 text-slate-400'
                        }`}>
                        <Activity className="w-4 h-4" />
                        SYSTEM_STABILITY: {100 - riskScore}%
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">

                {/* LEFT: RISK PARAMETERS */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Global Limits */}
                    <TiltCard glowColor="purple" noPadding className="p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-violet-400" /> Global Exposure Limits
                        </h3>

                        <div className="space-y-8">
                            {/* Slider 1 */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Max Daily Exposure</label>
                                    <span className="text-sm font-mono font-bold text-white">{maxDailyExposure.toLocaleString()} RON</span>
                                </div>
                                <input
                                    type="range" min="1000" max="20000" step="500"
                                    value={maxDailyExposure}
                                    onChange={(e) => setMaxDailyExposure(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                />
                                <div className="flex justify-between mt-1 text-[10px] text-slate-600">
                                    <span>Conservative</span>
                                    <span>Aggressive</span>
                                </div>
                            </div>

                            {/* Slider 2 */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Stop Loss Limit (Daily)</label>
                                    <span className={`text-sm font-mono font-bold ${stopLossLimit > 20 ? 'text-red-400' : 'text-white'}`}>{stopLossLimit}%</span>
                                </div>
                                <input
                                    type="range" min="5" max="50" step="1"
                                    value={stopLossLimit}
                                    onChange={(e) => setStopLossLimit(Number(e.target.value))}
                                    className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${stopLossLimit > 20 ? 'accent-red-500' : 'accent-violet-500'}`}
                                />
                            </div>

                            {/* Slider 3 */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Max Stake Per Bet</label>
                                    <span className="text-sm font-mono font-bold text-white">{maxStakePerBet} RON</span>
                                </div>
                                <input
                                    type="range" min="50" max="2000" step="50"
                                    value={maxStakePerBet}
                                    onChange={(e) => setMaxStakePerBet(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                />
                            </div>
                        </div>
                    </TiltCard>

                    {/* Automated Protocols */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div
                            onClick={() => setCircuitBreaker(!circuitBreaker)}
                            className={`cursor-pointer p-4 rounded-xl border transition-all relative overflow-hidden group ${circuitBreaker ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-slate-900/50 border-white/5'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <ShieldAlert className={`w-6 h-6 ${circuitBreaker ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${circuitBreaker ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${circuitBreaker ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>
                            <h4 className="text-sm font-bold text-white">Circuit Breaker</h4>
                            <p className="text-[10px] text-slate-400 mt-1">Stops trading if loss &gt; 10% in 1 hour.</p>
                        </div>

                        <div
                            onClick={() => setAiSupervision(!aiSupervision)}
                            className={`cursor-pointer p-4 rounded-xl border transition-all relative overflow-hidden group ${aiSupervision ? 'bg-cyan-900/10 border-cyan-500/50' : 'bg-slate-900/50 border-white/5'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <Activity className={`w-6 h-6 ${aiSupervision ? 'text-cyan-400' : 'text-slate-500'}`} />
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${aiSupervision ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${aiSupervision ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>
                            <h4 className="text-sm font-bold text-white">AI Supervision</h4>
                            <p className="text-[10px] text-slate-400 mt-1">Anomaly detection for odds shifts.</p>
                        </div>

                        <div
                            onClick={() => setAutoHedge(!autoHedge)}
                            className={`cursor-pointer p-4 rounded-xl border transition-all relative overflow-hidden group ${autoHedge ? 'bg-violet-900/10 border-violet-500/50' : 'bg-slate-900/50 border-white/5'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <RefreshCw className={`w-6 h-6 ${autoHedge ? 'text-violet-400' : 'text-slate-500'}`} />
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${autoHedge ? 'bg-violet-500' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoHedge ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>
                            <h4 className="text-sm font-bold text-white">Auto Hedge</h4>
                            <p className="text-[10px] text-slate-400 mt-1">Secure profit if ROI &gt; 80% mid-game.</p>
                        </div>
                    </div>

                    {/* Blacklist Manager */}
                    <TiltCard glowColor="red" noPadding className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Ban className="w-5 h-5 text-red-500" /> Active Blacklist
                        </h3>

                        <div className="flex gap-2 mb-6">
                            <select
                                value={blacklistType}
                                onChange={(e) => setBlacklistType(e.target.value as any)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-red-500 outline-none"
                            >
                                <option value="Team">Team</option>
                                <option value="League">League</option>
                                <option value="User">User</option>
                            </select>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={newBlacklistInput}
                                    onChange={(e) => setNewBlacklistInput(e.target.value)}
                                    placeholder="Enter name to ban..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-red-500 outline-none"
                                />
                            </div>
                            <button
                                onClick={handleAddBlacklist}
                                className="bg-red-900/20 border border-red-500/30 text-red-400 px-3 rounded-lg hover:bg-red-900/40 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                            {blacklist.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-white/5 group hover:border-red-500/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase w-16 text-center">
                                            {item.type}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{item.name}</div>
                                            <div className="text-[10px] text-slate-500">{item.reason} • {item.date}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveBlacklist(item.id)}
                                        className="p-1.5 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {blacklist.length === 0 && (
                                <div className="text-center text-slate-500 text-xs py-4">No active bans.</div>
                            )}
                        </div>
                    </TiltCard>
                </div>

                {/* RIGHT: VISUALIZATION & LOCKDOWN */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Risk Core Visualizer */}
                    <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

                        {/* Rotating Rings */}
                        <div className={`relative w-48 h-48 flex items-center justify-center transition-all duration-700`}>
                            <div className={`absolute inset-0 rounded-full border-4 border-dashed ${getRiskColor(riskScore)} opacity-20 animate-spin-slow`}></div>
                            <div className={`absolute inset-4 rounded-full border-2 ${getRiskColor(riskScore)} opacity-40 animate-spin-reverse-slow`}></div>

                            {/* Center Score */}
                            <div className="z-10 text-center">
                                <div className={`text-5xl font-display font-bold transition-colors duration-500 ${getRiskColor(riskScore).split(' ')[0]}`}>
                                    {riskScore}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono tracking-widest mt-1">RISK SCORE</div>
                            </div>
                        </div>

                        <div className={`mt-8 text-lg font-bold tracking-widest ${getRiskColor(riskScore).split(' ')[0]}`}>
                            STATUS: {getRiskLabel(riskScore)}
                        </div>

                        <p className="text-xs text-slate-500 text-center mt-2 max-w-[200px]">
                            Scor calculat pe baza limitelor de expunere și volatilității curente.
                        </p>
                    </div>

                    {/* System Alerts Console */}
                    <div className="bg-black rounded-xl border border-white/10 p-4 font-mono text-xs h-48 overflow-y-auto custom-scrollbar">
                        <div className="text-slate-500 border-b border-white/10 pb-2 mb-2">System Events Log</div>
                        <div className="space-y-1">
                            <div className="text-emerald-500">[SAFE] Daily exposure within limits (42%)</div>
                            <div className="text-slate-400">[INFO] Blacklist updated by Admin</div>
                            {riskScore > 50 && <div className="text-yellow-500">[WARN] High stake volatility detected</div>}
                            {riskScore > 80 && <div className="text-red-500 font-bold">[CRIT] APPROACHING STOP LOSS LIMIT</div>}
                            <div className="text-slate-400">[INFO] AI Supervision Active</div>
                        </div>
                    </div>

                    {/* LOCKDOWN BUTTON */}
                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={toggleLockdown}
                            className="group w-full relative overflow-hidden bg-red-950 hover:bg-red-900 border-2 border-red-600 text-red-100 font-bold py-6 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] active:scale-95"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] bg-[position:100%_0] group-hover:bg-[position:0_0] transition-[background-position] duration-700"></div>
                            <div className="relative flex flex-col items-center gap-2">
                                <Lock className="w-8 h-8" />
                                <span className="tracking-[0.2em] text-lg">EMERGENCY LOCKDOWN</span>
                                <span className="text-[10px] text-red-400 font-normal opacity-70">HALT ALL TRADING OPERATIONS</span>
                            </div>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
