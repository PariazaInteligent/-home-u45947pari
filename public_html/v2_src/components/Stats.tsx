import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, RefreshCcw, Terminal, Wifi } from 'lucide-react';
import { Button3D } from './ui/Button3D';
import { api, Transaction, GlobalStats } from '../lib/api';

export const Stats: React.FC = () => {
   const [transactions, setTransactions] = useState<Transaction[]>([]);
   const [stats, setStats] = useState<GlobalStats | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchData = async () => {
         try {
            const [txs, global] = await Promise.all([
               api.getTransactions(5),
               api.getGlobalStats()
            ]);
            setTransactions(txs);
            setStats(global);
         } catch (err) {
            console.error(err);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, []);

   const kpis = [
      { label: "Bancă Totală", value: stats ? `${stats.total_bank} RON` : '...', color: "text-white", sub: "+12% vs luna trecută" },
      { label: "Profit Istoric", value: stats ? `${stats.historic_profit_ron} RON` : '...', color: "text-emerald-400", sub: "Calculat după taxe" },
      { label: "Investitori", value: stats ? stats.investors.toString() : '...', color: "text-violet-400", sub: "Membri activi" },
   ];

   return (
      <section id="stats" className="py-32 bg-slate-950 relative border-t border-white/5">
         {/* Heavy Industrial Background */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
               <div>
                  <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-4">
                     Terminal <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">LIVE</span>
                  </h2>
                  <p className="text-slate-400 text-lg">Acces direct la registrul tranzacțional al fondului.</p>
               </div>

               <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-lg border border-white/10 shadow-inner">
                  <Wifi className="text-emerald-500 w-4 h-4 animate-pulse" />
                  <span className="text-xs font-mono text-emerald-500">SYSTEM_ONLINE // LATENCY: 24ms</span>
               </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
               {/* Left Side: KPIs */}
               <div className="lg:col-span-4 grid grid-cols-1 gap-4">
                  {kpis.map((stat, i) => (
                     <div key={i} className="bg-slate-900 border border-white/10 p-6 rounded-xl hover:border-cyan-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                           <Terminal className="w-12 h-12 text-white" />
                        </div>
                        <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-2">{stat.label}</div>
                        <div className={`text-3xl font-display font-bold ${stat.color} mb-1`}>{stat.value}</div>
                        <div className="text-slate-600 text-xs font-mono">{stat.sub}</div>
                     </div>
                  ))}
                  <div className="mt-4">
                     <Button3D variant="cyan" className="w-full">Descarcă Raport PDF</Button3D>
                  </div>
               </div>

               {/* Right Side: Cyberdeck Terminal */}
               <div className="lg:col-span-8">
                  {/* Physical Frame of the Monitor */}
                  <div className="bg-slate-800 p-2 rounded-xl rounded-b-none border-t-4 border-l-4 border-r-4 border-slate-700 shadow-2xl relative">
                     {/* Screen Bezel */}
                     <div className="bg-black p-4 rounded-t-lg border border-slate-700/50 shadow-[inset_0_0_20px_rgba(0,0,0,1)]">

                        {/* Screen Content */}
                        <div className="bg-[#0c0c0c] rounded border border-white/5 h-[400px] relative overflow-hidden font-mono text-sm scanlines">

                           {/* Terminal Header */}
                           <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/10 text-xs text-slate-400">
                              <div className="flex gap-2">
                                 <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                 <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                              </div>
                              <div>user@pariaza-inteligent:~/transactions</div>
                           </div>

                           {/* Terminal Body */}
                           <div className="p-4 space-y-1 h-full overflow-y-auto custom-scrollbar pb-12">
                              <div className="text-slate-500 mb-4">Last login: {new Date().toDateString()} from 192.168.0.1</div>

                              {transactions.map((tx, idx) => (
                                 <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-white/5 hover:bg-white/5 px-2 transition-colors group">
                                    <div className="flex items-center gap-4">
                                       <span className="text-slate-600 text-xs w-16">{tx.date}</span>
                                       <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold w-20 text-center ${tx.type === 'PROFIT' ? 'bg-emerald-900/30 text-emerald-400' :
                                             (tx.type === 'PIERDERE' || tx.type === 'LOSS') ? 'bg-red-900/30 text-red-400' :
                                                'bg-blue-900/30 text-blue-400'
                                          }`}>{tx.type}</span>
                                       <span className="text-slate-300 group-hover:text-white">{tx.label}</span>
                                    </div>
                                    <div className="flex items-center gap-4 pl-20 sm:pl-0 mt-1 sm:mt-0">
                                       <span className="text-slate-700 text-xs hidden sm:block">{tx.hash}</span>
                                       <span className={`font-bold font-display ${tx.amount.includes('+') ? 'text-emerald-400' : 'text-slate-400'}`}>
                                          {tx.amount}
                                       </span>
                                    </div>
                                 </div>
                              ))}

                              <div className="flex items-center gap-2 mt-4 text-emerald-500 animate-pulse">
                                 <span>$</span>
                                 <span className="w-2 h-4 bg-emerald-500 block"></span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Monitor Stand/Base */}
                  <div className="mx-auto w-1/3 h-4 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-lg"></div>
                  <div className="mx-auto w-1/2 h-2 bg-slate-900/50 rounded-full blur-sm mt-1"></div>
               </div>
            </div>
         </div>
      </section>
   );
};