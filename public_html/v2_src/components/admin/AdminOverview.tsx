import React from 'react';
import { Lock, CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

export const AdminOverview: React.FC = () => {
  const verificationRequests = [
    { name: 'Popescu A.', id: 'REQ-8821', tier: 'Investor', date: '2 min ago' },
    { name: 'Ionescu M.', id: 'REQ-8822', tier: 'Whale', date: '15 min ago' },
    { name: 'Dumitru S.', id: 'REQ-8823', tier: 'Pro', date: '1 hour ago' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
                { label: 'Total Fond', value: '42,850 RON', change: '+2.5%', color: 'text-white' },
                { label: 'Pending Users', value: '12', change: 'Alert', color: 'text-yellow-400' },
                { label: 'Active Bets', value: '8', change: 'Running', color: 'text-emerald-400' },
                { label: 'System Load', value: '34%', change: 'Stable', color: 'text-cyan-400' },
            ].map((stat, i) => (
                <div key={i} className="bg-slate-900/50 border border-white/5 p-4 rounded-lg relative overflow-hidden">
                    <div className="text-xs text-slate-500 font-mono uppercase mb-2">{stat.label}</div>
                    <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="absolute right-4 top-4 text-xs font-mono text-slate-600 border border-slate-700 px-2 rounded">{stat.change}</div>
                </div>
            ))}
        </div>

        {/* Verification Queue & Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <Lock className="w-5 h-5 text-yellow-500" />
                        Cereri Verificare (Pending)
                    </h3>
                </div>
                
                {/* DESKTOP TABLE VIEW */}
                <div className="hidden lg:block bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-slate-400 font-mono text-xs uppercase">
                            <tr>
                                <th className="p-4">User ID</th>
                                <th className="p-4">Tier Cerut</th>
                                <th className="p-4">Data</th>
                                <th className="p-4 text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {verificationRequests.map((req, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-white">{req.name}</div>
                                        <div className="text-xs text-slate-500">{req.id}</div>
                                    </td>
                                    <td className="p-4 text-yellow-400 font-mono">{req.tier}</td>
                                    <td className="p-4 text-slate-400">{req.date}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded transition-colors" title="Aprobă">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors" title="Respinge">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE CARD VIEW */}
                <div className="lg:hidden space-y-4">
                    {verificationRequests.map((req, i) => (
                      <div key={i} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                              <div>
                                  <div className="font-bold text-white">{req.name}</div>
                                  <div className="text-xs text-slate-500">{req.id}</div>
                              </div>
                              <div className="text-yellow-400 font-mono text-sm bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">{req.tier}</div>
                          </div>
                          <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                              <div className="text-slate-400 text-xs">{req.date}</div>
                              <div className="flex gap-2">
                                  <button className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                                      <CheckCircle2 className="w-4 h-4" /> <span className="text-xs font-bold">Aprobă</span>
                                  </button>
                                  <button className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/20 transition-colors flex items-center gap-1">
                                      <XCircle className="w-4 h-4" /> <span className="text-xs font-bold">Refuză</span>
                                  </button>
                              </div>
                          </div>
                      </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="h-full">
                <TiltCard glowColor="purple" className="h-full" noPadding>
                    <div className="p-6 bg-slate-900/80 backdrop-blur h-full flex flex-col">
                        <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-red-500" />
                            Comenzi Rapide
                        </h3>
                        
                        <div className="space-y-4 flex-1">
                            <Button3D variant="cyan" className="w-full text-xs py-3 lg:py-4">
                                Adaugă Bilet Nou
                            </Button3D>
                            <Button3D variant="purple" className="w-full text-xs py-3 lg:py-4">
                                Generează Raport Zi
                            </Button3D>
                            <div className="h-px bg-white/10 my-4"></div>
                            <Button3D variant="danger" className="w-full text-xs py-3 lg:py-4">
                                Îngheață Depuneri (Panic)
                            </Button3D>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 text-xs font-mono text-slate-500">
                            <div>LAST_LOGIN: {new Date().toLocaleTimeString()}</div>
                            <div>IP: 192.168.1.1 (SECURE)</div>
                        </div>
                    </div>
                </TiltCard>
            </div>
        </div>
    </div>
  );
};