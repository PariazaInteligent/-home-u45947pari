import React from 'react';
import { Lock, CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';
import { API_URL } from '../../config';

export const AdminOverview: React.FC = () => {
    const [verificationRequests, setVerificationRequests] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchPendingUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/users?status=PENDING_VERIFICATION`, {
                headers: {
                    // In a real app we'd need the token here. For this demo, we might rely on cookie or just bypass if auth is loose.
                    // But wait, the route requires auth. AdminConsolePage usually assumes we are logged in.
                    // We need to pass the token. Ideally stored in localStorage.
                    'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setVerificationRequests(data.map((u: any) => ({
                    name: u.name,
                    id: u.id,
                    tier: 'Investor', // Default for now
                    date: new Date(u.createdAt).toLocaleString(),
                    rawId: u.id // Keep raw ID for API calls
                })));
            }
        } catch (e) {
            console.error('Failed to fetch pending users', e);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            const response = await fetch(`http://localhost:3001/admin/users/${id}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
                }
            });

            if (response.ok) {
                // Refresh list
                fetchPendingUsers();
            } else {
                alert('Action failed');
            }
        } catch (e) {
            alert('Network error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Fond', value: '42,850 RON', change: '+2.5%', color: 'text-white' },
                    { label: 'Pending Users', value: verificationRequests.length.toString(), change: 'Alert', color: 'text-yellow-400' },
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
                    <div className="hidden lg:block bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden min-h-[200px]">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Se încarcă cererile...</div>
                        ) : verificationRequests.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">Nu există cereri în așteptare.</div>
                        ) : (
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
                                                <div className="font-bold text-white">{req.name || 'Fără Nume'}</div>
                                                <div className="text-xs text-slate-500">{req.id}</div>
                                            </td>
                                            <td className="p-4 text-yellow-400 font-mono">{req.tier}</td>
                                            <td className="p-4 text-slate-400">{req.date}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleAction(req.rawId, 'approve')}
                                                        className="p-2 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                                                        title="Aprobă"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req.rawId, 'reject')}
                                                        className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                                                        title="Respinge"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* MOBILE CARD VIEW */}
                    <div className="lg:hidden space-y-4">
                        {loading ? (
                            <div className="text-center text-slate-500">Se încarcă...</div>
                        ) : verificationRequests.length === 0 ? (
                            <div className="text-center text-slate-500">Nu există cereri.</div>
                        ) : (
                            verificationRequests.map((req, i) => (
                                <div key={i} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-white">{req.name || 'Fără Nume'}</div>
                                            <div className="text-xs text-slate-500">{req.id}</div>
                                        </div>
                                        <div className="text-yellow-400 font-mono text-sm bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">{req.tier}</div>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                                        <div className="text-slate-400 text-xs">{req.date}</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleAction(req.rawId, 'approve')} className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                                                <CheckCircle2 className="w-4 h-4" /> <span className="text-xs font-bold">Aprobă</span>
                                            </button>
                                            <button onClick={() => handleAction(req.rawId, 'reject')} className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/20 transition-colors flex items-center gap-1">
                                                <XCircle className="w-4 h-4" /> <span className="text-xs font-bold">Refuză</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )))}
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