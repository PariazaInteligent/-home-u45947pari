import React, { useEffect, useState } from 'react';
import { Bell, Mail, Users, AlertTriangle, Flame, Gift } from 'lucide-react';

interface BroadcastNotification {
    id: string;
    templateId: string;
    title: string;
    message: string;
    recipientCount: number;
    isRead: boolean;
    createdAt: string;
    isManual: boolean;
}

interface BroadcastNotificationBellProps {
    onNotificationClick: (templateId: string) => void;
}

export const BroadcastNotificationBell: React.FC<BroadcastNotificationBellProps> = ({
    onNotificationClick
}) => {
    const [notifications, setNotifications] = useState<BroadcastNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            const response = await fetch('http://localhost:3001/admin/broadcast-notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch broadcast notifications:', error);
        }
    };

    // Poll for notifications every 30 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Mark notification as read and navigate
    const handleNotificationClick = async (notif: BroadcastNotification) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            // Mark as read
            await fetch(`http://localhost:3001/admin/broadcast-notifications/mark-read/${notif.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Navigate to template
            setShowDropdown(false);
            onNotificationClick(notif.templateId);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Get emoji for template
    const getTemplateEmoji = (templateId: string): string => {
        const emojiMap: Record<string, string> = {
            'welcome': '🎉',
            'weekly_recap': '📊',
            'opportunity': '🚀',
            'rewards': '🎁',
            'system_update': '⚡',
            'tips': '📚',
            'daily_checkin': '🔥',
            'streak_loss': '⚠️',
            'limited_offer': '💎',
            'thank_you': '💙',
        };
        return emojiMap[templateId] || '📬';
    };

    // Format time
    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Acum';
        if (minutes < 60) return `Acum ${minutes}m`;
        if (hours < 24) return `Acum ${hours}h`;
        return `Acum ${days}z`;
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`relative p-2.5 rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1 ${showDropdown
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-600 text-white scale-105'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-green-300 hover:text-green-500 hover:bg-green-50'
                    }`}
                title="Oportunități Broadcast"
            >
                <Mail className={`w-5 h-5 ${showDropdown ? 'animate-bounce' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-br from-red-500 to-orange-500 border-2 border-white text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 top-full mt-4 w-96 bg-white border-4 border-green-300 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="p-5 bg-gradient-to-r from-green-50 via-emerald-50 to-cyan-50 border-b-4 border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-3xl">🎯</div>
                            <h3 className="text-lg font-black text-green-800">Oportunități Broadcast</h3>
                        </div>
                        <p className="text-xs font-bold text-green-600">
                            {unreadCount > 0 ? `${unreadCount} oportunități noi!` : 'Totul sub control! 🦉'}
                        </p>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-5xl mb-3">🦉</div>
                                <p className="text-sm font-bold text-slate-400">Nicio notificare momentan</p>
                                <p className="text-xs text-slate-300 mt-1">Te vom anunța când ai audiență!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b-2 border-slate-100 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all cursor-pointer group ${!notif.isRead ? 'bg-green-50/50' : ''
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        {/* Emoji Badge */}
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-3 shadow-md group-hover:scale-110 transition-transform ${!notif.isRead
                                            ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300'
                                            : 'bg-white border-slate-200'
                                            }`}>
                                            {getTemplateEmoji(notif.templateId)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm font-black ${!notif.isRead ? 'text-green-800' : 'text-slate-400'
                                                    }`}>
                                                    {notif.title}
                                                </h4>
                                                <span className="text-[10px] font-bold text-slate-300 ml-2 flex-shrink-0">
                                                    {formatTime(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium text-slate-600 mb-2 leading-relaxed">
                                                {notif.message}
                                            </p>

                                            {/* Recipient Count Badge */}
                                            <div className="inline-flex items-center gap-2 bg-white border-2 border-green-200 rounded-full px-3 py-1">
                                                <Users className="w-3 h-3 text-green-600" />
                                                <span className="text-xs font-black text-green-700">
                                                    {notif.recipientCount} {notif.recipientCount === 1 ? 'investitor' : 'investitori'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 text-center border-t-4 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDropdown(false);
                                }}
                                className="text-xs font-black text-green-600 hover:text-green-700 transition-colors uppercase tracking-widest"
                            >
                                Închide
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
