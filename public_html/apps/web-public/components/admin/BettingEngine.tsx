import React, { useState } from 'react';
import { Database, Plus, RefreshCw, Sliders, PlayCircle, PauseCircle } from 'lucide-react';
import { Button3D } from '../ui/Button3D';

export const BettingEngine: React.FC = () => {
  const [algoStatus, setAlgoStatus] = useState<'running' | 'paused'>('running');

  const activeStrategies = [
    { name: 'Value_Finder_Football_v2', market: '1X2 & Over/Under', status: 'Active', roi: '12.4%', risk: 'Medium' },
    { name: 'Tennis_Ace_Sniper', market: 'Set Winner', status: 'Active', roi: '18.2%', risk: 'High' },
    { name: 'NBA_Spread_Hunter', market: 'Handicap', status: 'Paused', roi: '8.5%', risk: 'Low' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
             <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                <Database className="w-6 h-6 text-red-500" /> Betting Engine Control
             </h2>
             <p className="text-slate-400 text-sm">Administrează algoritmii și plasează pariuri manuale.</p>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={() => setAlgoStatus(prev => prev === 'running' ? 'paused' : 'running')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-bold uppercase text-xs tracking-wider transition-all ${
                  algoStatus === 'running' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
               }`}
             >
                {algoStatus === 'running' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                {algoStatus === 'running' ? 'Pause All Algos' : 'Resume System'}
             </button>
             <Button3D variant="cyan" className="text-xs px-4 py-2 h-auto">
                <Plus className="w-4 h-4 mr-2" /> Manual Bet
             </Button3D>
          </div>
       </div>

       <div className="grid lg:grid-cols-3 gap-6">
          {/* Algorithm Status Cards */}
          {activeStrategies.map((algo, i) => (
             <div key={i} className="bg-slate-900/50 border border-white/5 p-5 rounded-xl hover:border-red-500/20 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-red-900/20 group-hover:text-red-400 transition-colors">
                      <Sliders className="w-5 h-5 text-slate-400" />
                   </div>
                   <div className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${
                      algo.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                   }`}>
                      {algo.status}
                   </div>
                </div>
                <h4 className="font-bold text-white text-sm mb-1">{algo.name}</h4>
                <div className="text-xs text-slate-500 mb-4">{algo.market}</div>
                
                <div className="flex justify-between items-center text-xs font-mono pt-4 border-t border-white/5">
                   <div>
                      <span className="text-slate-500">ROI:</span> <span className="text-emerald-400 font-bold">{algo.roi}</span>
                   </div>
                   <div>
                      <span className="text-slate-500">RISK:</span> <span className="text-white">{algo.risk}</span>
                   </div>
                </div>
             </div>
          ))}
       </div>

       {/* Manual Entry Form (Visual Representation) */}
       <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
             <RefreshCw className="w-4 h-4 text-cyan-400" />
             <h3 className="font-bold text-white text-sm uppercase tracking-wider">Manual Override / Emergency Hedge</h3>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4 mb-4">
             <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Event ID</label>
                <input type="text" placeholder="ex: 8821" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none" />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Selection</label>
                <input type="text" placeholder="ex: Over 2.5" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none" />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Odds</label>
                <input type="text" placeholder="2.10" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none" />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Stake (RON)</label>
                <input type="text" placeholder="500" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none" />
             </div>
          </div>
          <div className="flex justify-end">
             <button className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-lg shadow-red-900/20">
                Execute Order
             </button>
          </div>
       </div>
    </div>
  );
};