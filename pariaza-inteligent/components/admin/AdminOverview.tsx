import React, { useEffect, useState } from 'react';
import { Rocket, Zap, Users, Clock, UserPlus, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

interface AdminStatsData {
    dataSource: 'DATABASE' | 'MOCK';
    timestamp: string;
    kpiMetrics: {
        totalFundEUR: number;
        pendingUsers: number;
        totalTrades: number;  // Renamed from activeBets
        systemLoad: number;
        totalUsers: number;
        activeUsers: number;
        tradingProfit?: number;  // Optional debug info
    };
    pendingUsers: Array<{
        id: string;
        name: string;
        email: string;
        ticketId: string;
        createdAt: string;
        tier: string;
    }>;
}

export const AdminOverview: React.FC = () => {
    const [data, setData] = useState<AdminStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Get token from localStorage (check multiple possible keys)
                const token = localStorage.getItem('accessToken') ||
                    localStorage.getItem('token') ||
                    localStorage.getItem('auth_token');

                if (!token) {
                    throw new Error('No authentication token found. Please log in again.');
                }

                const response = await fetch('http://localhost:3001/admin/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: Failed to fetch admin stats`);
                }

                const statsData: AdminStatsData = await response.json();

                // CRITICAL: Verify data source
                if (statsData.dataSource !== 'DATABASE') {
                    throw new Error(`⚠️ MOCK DATA DETECTED! Backend returned dataSource: "${statsData.dataSource}" instead of "DATABASE"`);
                }

                setData(statsData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching admin stats:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setLoading(false);
            }
        };

        fetchStats();
    }, [refreshKey]);

    const handleApprove = async (userId: string) => {
        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            const response = await fetch(`http://localhost:3001/admin/users/${userId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),  // Empty body required by Fastify
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to approve user');
            }

            alert('✅ Investitor aprobat cu succes! Email de activare trimis.');
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error('Error approving user:', err);
            alert('❌ Eroare la aprobare: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleReject = async (userId: string) => {
        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            const response = await fetch(`http://localhost:3001/admin/users/${userId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),  // Empty body required by Fastify
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to reject user');
            }

            alert('✅ Investitor refuz at. Email de notificare trimis.');
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error('Error rejecting user:', err);
            alert('❌ Eroare la refuz: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    // ERROR STATE: Display big red error banner if mock data detected
    if (error) {
        return (
            <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 -m-10 p-10 min-h-screen">
                <div className="bg-red-500 text-white p-8 rounded-3xl border-4 border-red-300 shadow-2xl max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <AlertTriangle className="w-16 h-16 animate-pulse" />
                        <div>
                            <h2 className="text-3xl font-black mb-2">🚨 DATA SOURCE ERROR</h2>
                            <p className="text-xl font-bold">Admin Overview cannot display data!</p>
                        </div>
                    </div>
                    <div className="bg-red-600/50 p-6 rounded-xl border-2 border-red-400 mb-4">
                        <p className="text-lg font-mono">{error}</p>
                    </div>
                    <div className="text-sm opacity-90">
                        <p>✅ <strong>Expected:</strong> dataSource = "DATABASE"</p>
                        <p>❌ <strong>Actual:</strong> Error occurred or MOCK data detected</p>
                    </div>
                </div>
            </div>
        );
    }

    // LOADING STATE
    if (loading || !data) {
        return (
            <div className="bg-gradient-to-br from-green-50 via-purple-50 to-orange-50 -m-10 p-10 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🦉</div>
                    <div className="text-2xl font-bold text-gray-700">Loading Admin Stats...</div>
                </div>
            </div>
        );
    }

    // Map real data to KPI metrics with EUR
    const kpiMetrics = [
        {
            label: 'Total în Fond',
            value: `€${data.kpiMetrics.totalFundEUR.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: 'DATE REALE! 🎉',
            icon: Rocket,
            gradient: 'from-green-400 to-emerald-500',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200 hover:border-green-400',
            textColor: 'text-green-700'
        },
        {
            label: 'Utilizatori în Așteptare',
            value: data.kpiMetrics.pendingUsers.toString(),
            change: 'LIVE Database! 👀',
            icon: Users,
            gradient: 'from-purple-400 to-pink-500',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200 hover:border-purple-400',
            textColor: 'text-purple-700'
        },
        {
            label: 'Trade-uri',
            value: data.kpiMetrics.totalTrades.toString(),
            change: 'Toate trade-urile 📊',
            icon: Zap,
            gradient: 'from-orange-400 to-yellow-500',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200 hover:border-orange-400',
            textColor: 'text-orange-700'
        },
        {
            label: 'Useri Activi',
            value: `${data.kpiMetrics.systemLoad}%`,
            change: `${data.kpiMetrics.activeUsers}/${data.kpiMetrics.totalUsers} activi 👥`,
            icon: Clock,
            gradient: 'from-blue-400 to-cyan-500',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200 hover:border-blue-400',
            textColor: 'text-blue-700'
        },
    ];

    return (
        <div className="bg-gradient-to-br from-green-50 via-purple-50 to-orange-50 -m-10 p-10 min-h-screen">
            {/* DATA SOURCE VERIFICATION BANNER */}
            <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl flex items-center gap-4 shadow-xl border-2 border-green-400">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse shadow-lg"></div>
                <span className="font-black text-lg">✅ LIVE DATABASE CONNECTED</span>
                <span className="ml-auto text-sm opacity-95 font-mono">
                    Last Sync: {new Date(data.timestamp).toLocaleTimeString('ro-RO')}
                </span>
            </div>

            {/* Prof. Investino Mascot */}
            <div className="mb-8 flex items-start gap-4 animate-[fadeIn_0.5s_ease-out]">
                <div className="text-6xl animate-bounce" style={{ animationDuration: '3s' }}>
                    🦉
                </div>
                <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border-2 border-green-200 max-w-2xl">
                    <p className="text-lg font-bold text-green-800">
                        Salut, Super Admin! 👋 Totul funcționează perfect astăzi! Sistemul rulează smooth și avem <strong>{data.pendingUsers.length}</strong> utilizatori care așteaptă aprobarea ta. 🎉
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpiMetrics.map((metric, i) => (
                    <div
                        key={i}
                        className={`${metric.bgColor} rounded-3xl p-6 shadow-xl border-2 ${metric.borderColor} 
                        hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer
                        animate-[fadeIn_0.5s_ease-out]`}
                        style={{ animationDelay: `${i * 0.1}s` }}
                    >
                        {/* Gradient Icon */}
                        <div className={`w-16 h-16 bg-gradient-to-br ${metric.gradient} rounded-full 
                            flex items-center justify-center mb-4 shadow-lg
                            animate-[pulse_3s_ease-in-out_infinite]`}>
                            <metric.icon className="w-8 h-8 text-white" />
                        </div>

                        {/* Label */}
                        <div className="text-sm font-bold text-gray-700 mb-1">{metric.label}</div>

                        {/* Big Value */}
                        <div className={`text-3xl font-black ${metric.textColor} mb-2`}>
                            {metric.value}
                        </div>

                        {/* Cheerful Status */}
                        <div className={`inline-block ${metric.bgColor} ${metric.textColor} 
                            px-3 py-1 rounded-full text-xs font-bold border-2 ${metric.borderColor.split(' ')[0]}`}>
                            {metric.change}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Verification Queue */}
                <div className="lg:col-span-2 animate-[fadeIn_0.5s_ease-out] animate-delay-400">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-purple-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 
                              rounded-full flex items-center justify-center shadow-lg">
                                <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-purple-800">
                                Cereri de Aprobare
                            </h3>
                            <div className="ml-auto bg-purple-100 text-purple-700 px-4 py-2 
                              rounded-full font-bold text-sm border-2 border-purple-200">
                                🎯 {data.pendingUsers.length} în așteptare
                            </div>
                        </div>

                        {/* Request Cards */}
                        <div className="space-y-3">
                            {data.pendingUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 
                             border-2 border-purple-100 hover:border-purple-300 hover:shadow-lg 
                             transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 
                                    rounded-full flex items-center justify-center font-bold 
                                    text-white text-lg shadow-lg">
                                            {user.name[0].toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-800 text-lg truncate">{user.name}</div>
                                            <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-xs">{user.ticketId}</span>
                                                <span>•</span>
                                                <span className="truncate">{user.email}</span>
                                                <span>•</span>
                                                <span>{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: ro })}</span>
                                            </div>
                                        </div>

                                        {/* Tier Badge */}
                                        <div className="bg-purple-200 text-purple-800 px-4 py-2 rounded-full 
                                    font-bold text-sm border-2 border-purple-300">
                                            {user.tier}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(user.id)}
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 
                                          hover:from-green-600 hover:to-emerald-700
                                          text-white px-6 py-3 rounded-full font-bold text-sm
                                          hover:scale-110 transition-all duration-300
                                          shadow-lg hover:shadow-xl flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Aprobă
                                            </button>
                                            <button
                                                onClick={() => handleReject(user.id)}
                                                className="bg-gradient-to-r from-red-500 to-red-600 
                                          hover:from-red-600 hover:to-red-700
                                          text-white px-6 py-3 rounded-full font-bold text-sm
                                          hover:scale-110 transition-all duration-300
                                          shadow-lg hover:shadow-xl flex items-center gap-2">
                                                <XCircle className="w-4 h-4" />
                                                Refuză
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State Message */}
                        {data.pendingUsers.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🎉</div>
                                <div className="text-xl font-bold text-gray-700 mb-2">
                                    Super! Nicio cerere în așteptare!
                                </div>
                                <div className="text-gray-500">
                                    Toate cererile au fost procesate. Treabă bună! 💪
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="animate-[fadeIn_0.5s_ease-out] animate-delay-600">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-orange-200 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-500 
                              rounded-full flex items-center justify-center shadow-lg">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-orange-800">
                                Acțiuni Rapide
                            </h3>
                        </div>

                        <div className="space-y-4 flex-1">
                            {/* Colorful Action Buttons */}
                            <button className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 
                                 hover:from-cyan-500 hover:to-cyan-700
                                 text-white font-bold py-4 px-6 rounded-2xl
                                 hover:scale-105 transition-all duration-300 shadow-lg
                                 hover:shadow-xl flex items-center justify-center gap-2">
                                <span className="text-2xl">📝</span>
                                Adaugă Bilet Nou
                            </button>

                            <button className="w-full bg-gradient-to-r from-purple-400 to-purple-600 
                                 hover:from-purple-500 hover:to-purple-700
                                 text-white font-bold py-4 px-6 rounded-2xl
                                 hover:scale-105 transition-all duration-300 shadow-lg
                                 hover:shadow-xl flex items-center justify-center gap-2">
                                <span className="text-2xl">📊</span>
                                Generează Raport
                            </button>

                            <div className="h-px bg-gray-200 my-2"></div>

                            <button className="w-full bg-gradient-to-r from-red-500 to-red-600 
                                 hover:from-red-600 hover:to-red-700
                                 text-white font-bold py-4 px-6 rounded-2xl
                                 hover:scale-105 transition-all duration-300 shadow-lg
                                 hover:shadow-xl flex items-center justify-center gap-2">
                                <span className="text-2xl">🚨</span>
                                Îngheață Depuneri
                            </button>
                        </div>

                        {/* Friendly Footer */}
                        <div className="mt-6 pt-4 border-t-2 border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <span className="text-2xl">👋</span>
                                <span className="font-bold">Ultima autentificare:</span>
                            </div>
                            <div className="text-gray-500 text-sm">
                                <div>🕐 {new Date().toLocaleTimeString('ro-RO')}</div>
                                <div>📍 IP: Securizat</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};