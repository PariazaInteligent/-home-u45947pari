import React, { useState, useEffect } from 'react';
import { Copy, UserPlus, CheckCircle, Users, Gift, Clock } from 'lucide-react';
import { Button3D } from '../ui/Button3D';

interface InvitationCode {
    code: string;
    createdAt: string;
    expiresAt: string | null;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
}

interface Referral {
    id: string;
    name: string | null;
    email: string;
    joinedAt: string;
    invitationCode: string | null;
}

export const Referrals: React.FC = () => {
    const [codes, setCodes] = useState<InvitationCode[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Fetch invitation codes
    const fetchCodes = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:3001/investor/invitation-codes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setCodes(data.codes || []);
        } catch (error) {
            console.error('Error fetching codes:', error);
        }
    };

    // Fetch referrals
    const fetchReferrals = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:3001/investor/referrals', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setReferrals(data.referrals || []);
        } catch (error) {
            console.error('Error fetching referrals:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchCodes(), fetchReferrals()]);
            setLoading(false);
        };
        loadData();
    }, []);

    // Generate new code
    const generateCode = async () => {
        setGenerating(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:3001/investor/invitation-codes/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ maxUses: 1 })
            });

            if (response.ok) {
                await fetchCodes();
            }
        } catch (error) {
            console.error('Error generating code:', error);
        } finally {
            setGenerating(false);
        }
    };

    // Copy to clipboard
    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Se încarcă...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Invitații</h1>
                    <p className="text-slate-400">Invită prieteni și primește beneficii</p>
                </div>
                <Button3D
                    variant="purple"
                    onClick={generateCode}
                    disabled={generating}
                    className="flex items-center gap-2"
                >
                    <Gift className="w-5 h-5" />
                    {generating ? 'Generează...' : 'Generează Cod Nou'}
                </Button3D>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <UserPlus className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{codes.length}</div>
                            <div className="text-sm text-slate-400">Coduri Generate</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{referrals.length}</div>
                            <div className="text-sm text-slate-400">Investitori Invitați</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {codes.filter(c => c.usedCount > 0).length}
                            </div>
                            <div className="text-sm text-slate-400">Coduri Folosite</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invitation Codes Table */}
            <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Gift className="w-5 h-5 text-violet-400" />
                        Codurile Mele de Invitație
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-950/50">
                            <tr className="text-left text-sm text-slate-400">
                                <th className="p-4">Cod</th>
                                <th className="p-4">Creat</th>
                                <th className="p-4">Utilizări</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {codes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        Niciun cod generat încă. Generează primul tău cod de invitație!
                                    </td>
                                </tr>
                            ) : (
                                codes.map((code) => (
                                    <tr key={code.code} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <code className="text-cyan-400 font-mono text-sm bg-slate-950/50 px-3 py-1 rounded">
                                                {code.code}
                                            </code>
                                        </td>
                                        <td className="p-4 text-slate-300 text-sm">
                                            {new Date(code.createdAt).toLocaleDateString('ro-RO')}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-sm ${code.usedCount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                {code.usedCount} / {code.maxUses}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {code.isActive && code.usedCount < code.maxUses ? (
                                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
                                                    Activ
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-1 rounded-full border border-slate-600/30">
                                                    Folosit
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => copyToClipboard(code.code)}
                                                className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                                            >
                                                {copiedCode === code.code ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Copiat!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        Copiază
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invited Users Table */}
            <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-400" />
                        Investitori Invitați
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-950/50">
                            <tr className="text-left text-sm text-slate-400">
                                <th className="p-4">Nume</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Data Înregistrării</th>
                                <th className="p-4">Cod Folosit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referrals.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        Niciun investitor invitat încă. Distribuie codul tău de invitație!
                                    </td>
                                </tr>
                            ) : (
                                referrals.map((referral) => (
                                    <tr key={referral.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="text-white font-medium">{referral.name || 'N/A'}</div>
                                        </td>
                                        <td className="p-4 text-slate-300 text-sm">{referral.email}</td>
                                        <td className="p-4 text-slate-300 text-sm">
                                            {new Date(referral.joinedAt).toLocaleDateString('ro-RO')}
                                        </td>
                                        <td className="p-4">
                                            <code className="text-violet-400 font-mono text-xs bg-slate-950/50 px-2 py-1 rounded">
                                                {referral.invitationCode}
                                            </code>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
