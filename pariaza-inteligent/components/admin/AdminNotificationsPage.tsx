import React, { useState, useEffect } from 'react';
import { Bell, Check, Filter, Search, Calendar, User, Info, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, UserPlus, Server } from 'lucide-react';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    time?: string;
    createdAt: string;
    read: boolean;
    isRead: boolean;
    actionLink?: string;
    recipientCount?: number;
    templateId?: string;
    isManual?: boolean;
}

export const AdminNotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            // Use the unified endpoint which includes Pending Users + Broadcasts
            const response = await fetch('http://localhost:3001/admin/notifications?includeRead=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Map 'read' (from unified endpoint) to 'isRead' (for frontend consistency)
                const mappedData = (Array.isArray(data) ? data : data.notifications || []).map((n: any) => ({
                    ...n,
                    isRead: n.read,
                    // If ID is number, convert to string for React keys safety
                    id: String(n.id)
                }));
                setNotifications(mappedData);
            }
        } catch (error) {
            console.error('Failed to fetch notifications history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`http://localhost:3001/admin/broadcast-notifications/mark-read/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true, read: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const filteredNotifications = notifications.filter(notif => {
        if (filter === 'unread' && notif.isRead) return false;
        if (filter === 'read' && !notif.isRead) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                notif.title.toLowerCase().includes(query) ||
                notif.message.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const getIcon = (type: string, templateId?: string) => {
        if (templateId === 'streak_loss') return <AlertTriangle className="w-6 h-6 text-[#FF4B4B]" />;
        if (templateId === 'welcome') return <User className="w-6 h-6 text-[#58CC02]" />;
        if (type === 'broadcast_opportunity') return <Bell className="w-6 h-6 text-[#1CB0F6]" />;
        if (type === 'security') return <ShieldAlert className="w-6 h-6 text-orange-500" />;
        return <Info className="w-6 h-6 text-slate-400" />;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto px-4 sm:px-6 py-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="bg-white p-2 rounded-2xl border-b-4 border-slate-200 shadow-sm">
                            <Bell className="w-8 h-8 text-[#FF4B4B]" />
                        </div>
                        Istoric Notificări
                    </h1>
                    <p className="text-slate-500 font-bold mt-2 ml-1">
                        Vezi toată activitatea și alertele sistemului.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={fetchNotifications}
                        className="p-3 text-slate-400 hover:text-[#1CB0F6] bg-white border-2 border-slate-200 hover:border-[#1CB0F6] border-b-4 rounded-xl active:border-b-2 active:translate-y-[2px] transition-all"
                        title="Reîncarcă"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Filter Tabs - Duolingo Style */}
                    <div className="bg-slate-100 p-1.5 rounded-2xl flex border-b-4 border-slate-200">
                        {(['all', 'unread', 'read'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${filter === f
                                    ? 'bg-white text-[#1CB0F6] shadow-sm ring-2 ring-slate-100'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                                    }`}
                            >
                                {f === 'all' ? 'Toate' : f === 'unread' ? 'Necitite' : 'Citite'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="space-y-6">

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-400 group-focus-within:text-[#1CB0F6] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Caută în istoric..."
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-700 font-bold placeholder:text-slate-300 focus:outline-none focus:border-[#1CB0F6] focus:ring-4 focus:ring-[#1CB0F6]/10 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Loading State */}
                {isLoading && notifications.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border-2 border-slate-100 border-b-4">
                        <LoaderIcon />
                        <p className="mt-4 font-black">Se încarcă istoricul...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    // Empty State
                    <div className="p-12 text-center bg-white rounded-3xl border-2 border-slate-100 border-b-4 shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-slate-100">
                            <span className="text-4xl grayscale opacity-50">🦉</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-700 mb-2">Nicio notificare găsită</h3>
                        <p className="text-slate-400 font-bold max-w-md mx-auto">
                            Momentan nu ai nicio notificare aici. Totul este curat și liniștit!
                        </p>
                    </div>
                ) : (
                    // Notifications List
                    <div className="grid gap-4">
                        {filteredNotifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`group relative bg-white p-5 rounded-2xl border-2 border-b-4 transition-all hover:-translate-y-1 hover:shadow-md ${!notif.isRead
                                    ? 'border-[#1CB0F6] shadow-[0_4px_0_#1CB0F6]'
                                    : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex gap-5">
                                    {/* Icon */}
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-b-4 ${!notif.isRead ? 'bg-[#E5F6FF] border-[#1CB0F6] text-[#1CB0F6]' : 'bg-slate-50 border-slate-200 text-slate-400'
                                        }`}>
                                        {getIcon(notif.type, notif.templateId)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 py-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <h3 className={`text-lg font-black leading-tight ${!notif.isRead ? 'text-slate-800' : 'text-slate-500'
                                                }`}>
                                                {notif.title}
                                            </h3>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-400 whitespace-nowrap">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(notif.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                {new Date(notif.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <p className="text-slate-600 font-medium leading-relaxed mb-4">
                                            {notif.message.replace(/\s*\(\d+ utilizatori\)/, '')}
                                        </p>

                                        {/* Action Area */}
                                        <div className="flex items-center justify-between pt-2 border-t-2 border-slate-50">
                                            <div className="flex items-center gap-3">
                                                {notif.isRead ? (
                                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wide bg-slate-100 px-3 py-1 rounded-lg">
                                                        <Check className="w-3 h-3" /> Citit
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-[#1CB0F6] flex items-center gap-1.5 uppercase tracking-wide bg-[#E5F6FF] px-3 py-1 rounded-lg">
                                                        <AlertTriangle className="w-3 h-3" /> Necesită Atenție
                                                    </span>
                                                )}
                                            </div>

                                            {!notif.isRead && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(notif.id);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#58CC02] hover:bg-[#46A302] text-white text-sm font-bold rounded-xl border-b-4 border-[#46A302] active:border-b-0 active:translate-y-1 transition-all"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Marchează Citit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const LoaderIcon = () => (
    <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1CB0F6] rounded-full animate-spin mx-auto"></div>
);
