
import { useEffect, useState } from 'react';
import { ShieldAlert, Check, X, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface PendingUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
}

export function Admin() {
    const { user, token } = useAuth();
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Double check role protection
    if (user?.role !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const response = await fetch('http://localhost:3001/admin/users?status=PENDING_VERIFICATION', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setPendingUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        try {
            const response = await fetch(`http://localhost:3001/admin/users/${userId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to approve');

            // Update local list
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading admin data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Administrare Utilizatori</h2>
                <div className="text-sm text-slate-400">
                    Status: <span className="text-emerald-400">Sistem Activ</span>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                    {error}
                </div>
            )}

            {/* Pending Approvals Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                        Cereri în Așteptare
                    </h3>
                    <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">
                        {pendingUsers.length} cereri
                    </span>
                </div>

                {pendingUsers.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        Nu există cereri de înregistrare în așteptare.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        {pendingUsers.map(user => (
                            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{user.email}</div>
                                        <div className="text-xs text-slate-500">
                                            Înregistrat: {new Date(user.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Optional: Add Reject Button Logic later */}
                                    {/* <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Respinge">
                                <X className="w-5 h-5" />
                            </button> */}

                                    <button
                                        onClick={() => handleApprove(user.id)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                        Aprobă
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
