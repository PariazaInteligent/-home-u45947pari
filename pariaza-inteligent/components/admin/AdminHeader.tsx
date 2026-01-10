import React from 'react';
import { Menu, Search, Bell, Terminal, UserPlus, AlertTriangle, ShieldAlert, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    actionLink?: string;
}

interface AdminHeaderProps {
    onMobileMenuToggle: () => void;
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
    notifications: Notification[];
    onNavigateToProfile: () => void;
    user: any; // Using any for now to match parent, strictly typed would be better
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
    onMobileMenuToggle,
    showNotifications,
    setShowNotifications,
    notifications,
    onNavigateToProfile,
    user
}) => {
    const navigate = useNavigate();
    const unreadCount = notifications.filter(n => !n.read).length;

    // Helper to safely navigate
    const handleNotificationClick = async (notification: Notification) => {
        // Mark notification as read when clicked (if unread)
        if (!notification.read) {
            try {
                const token = localStorage.getItem('accessToken');
                await fetch(`http://localhost:3001/admin/broadcast-notifications/mark-read/${notification.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                // Note: Parent component will refresh notifications via polling
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }

        // Navigate if action link exists
        const link = notification.actionLink;
        if (!link) {
            setShowNotifications(false);
            return;
        }

        // Check if it's a hash link on the same page
        if (link.startsWith('/admin#') && window.location.pathname === '/admin') {
            const elementId = link.split('#')[1];
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Optional:Flash the element or add a highlight effect
                element.classList.add('ring-4', 'ring-purple-400', 'transition-all', 'duration-1000');
                setTimeout(() => element.classList.remove('ring-4', 'ring-purple-400'), 2000);
            }
        } else {
            // Normal navigation
            window.location.href = link;
        }
        setShowNotifications(false);
    };

    // Helper to get initials
    const getInitials = (name?: string) => {
        if (!name) return 'AD';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Get emoji for broadcast template type
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

    // Extract recipient count from broadcast notification message
    const getRecipientCount = (message: string): number | null => {
        const match = message.match(/\((\d+) utilizatori\)/);
        return match ? parseInt(match[1]) : null;
    };

    return (
        <header className="h-20 bg-white border-b-4 border-slate-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-all">

            {/* Left Section: Mobile Menu & Breadcrumbs/Badge */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMobileMenuToggle}
                    className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl border-2 border-transparent hover:border-slate-100 transition-all"
                    aria-label="Toggle mobile menu"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* INVESTOR VIEW Button - Replaces "ADMIN_ZONE" */}
                <div className="hidden sm:flex items-center">
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl border-b-4 border-slate-200 active:border-b-0 active:translate-y-1 transition-all font-bold text-xs uppercase tracking-wider"
                    >
                        <div className="w-2 h-2 bg-[#58CC02] rounded-full animate-pulse"></div>
                        INVESTOR VIEW
                    </button>
                </div>
            </div>

            {/* Right Section: Search, Notifications, Profile */}
            <div className="flex items-center gap-3 sm:gap-4">

                {/* Search Bar - Chunky Style */}
                <div className="relative hidden md:block group">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#1CB0F6] transition-colors" />
                    <input
                        type="text"
                        placeholder="Cauta..."
                        className="bg-slate-50 border-2 border-slate-200 rounded-2xl py-2.5 pl-12 pr-4 text-sm font-bold text-slate-600 placeholder:text-slate-400 focus:outline-none focus:border-[#1CB0F6] focus:bg-white transition-all w-48 lg:w-64"
                    />
                </div>

                {/* Unified Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        title="Notificări"
                        className={`relative p-2.5 rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1 ${showNotifications
                            ? 'bg-[#FF4B4B] border-[#D32F2F] text-white'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                            }`}
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF4B4B] border-2 border-white text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-4 w-80 sm:w-96 bg-white border-2 border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-4 border-b-2 border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Terminal className="w-4 h-4" /> System Logs
                                </span>
                                <button className="text-[10px] font-bold text-[#1CB0F6] hover:underline cursor-pointer">Mark all read</button>
                            </div>

                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="text-5xl mb-3">🦉</div>
                                        <p className="text-sm font-bold text-slate-400">Nicio notificare</p>
                                        <p className="text-xs text-slate-300 mt-1">Totul sub control!</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => {
                                        const isBroadcast = notif.type === 'broadcast_opportunity';
                                        const recipientCount = isBroadcast ? getRecipientCount(notif.message) : null;
                                        const templateId = isBroadcast && notif.actionLink ?
                                            new URLSearchParams(notif.actionLink.split('?')[1] || '').get('template') : null;

                                        return (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`p-4 border-b border-slate-100 transition-all cursor-pointer group ${isBroadcast
                                                    ? 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50'
                                                    : 'hover:bg-slate-50'
                                                    } ${!notif.read ? (isBroadcast ? 'bg-green-50/50' : 'bg-blue-50/30') : ''}`}
                                            >
                                                <div className="flex gap-4">
                                                    {/* Icon/Emoji Badge */}
                                                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-3 shadow-md group-hover:scale-110 transition-transform ${isBroadcast
                                                        ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300'
                                                        : 'bg-white border-slate-200'
                                                        }`}>
                                                        {isBroadcast && templateId ? (
                                                            getTemplateEmoji(templateId)
                                                        ) : (
                                                            notif.type === 'warning' ? <UserPlus className="w-5 h-5 text-yellow-500" /> :
                                                                notif.type === 'alert' ? <AlertTriangle className="w-5 h-5 text-[#FF4B4B]" /> :
                                                                    notif.type === 'security' ? <ShieldAlert className="w-5 h-5 text-orange-500" /> :
                                                                        <Server className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className={`text-sm font-black ${!notif.read
                                                                ? (isBroadcast ? 'text-green-800' : 'text-slate-700')
                                                                : 'text-slate-400'
                                                                }`}>
                                                                {notif.title}
                                                            </h4>
                                                            <span className="text-[10px] font-bold text-slate-300 ml-2 flex-shrink-0">
                                                                {notif.time}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-medium text-slate-600 mb-2 leading-relaxed">
                                                            {notif.message.replace(/\s*\(\d+ utilizatori\)/, '')}
                                                        </p>

                                                        {/* Recipient Count Badge (for broadcast) */}
                                                        {isBroadcast && recipientCount !== null && (
                                                            <div className="inline-flex items-center gap-2 bg-white border-2 border-green-200 rounded-full px-3 py-1">
                                                                <UserPlus className="w-3 h-3 text-green-600" />
                                                                <span className="text-xs font-black text-green-700">
                                                                    {recipientCount} {recipientCount === 1 ? 'investitor' : 'investitori'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-3 text-center border-t-2 border-slate-50 bg-slate-50/30">
                                <button
                                    onClick={() => {
                                        navigate('/admin/notifications');
                                        setShowNotifications(false);
                                    }}
                                    className="text-xs font-bold text-slate-400 hover:text-[#1CB0F6] transition-colors uppercase tracking-widest"
                                >
                                    View Full History
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div
                    onClick={onNavigateToProfile}
                    className="flex items-center gap-3 pl-2 cursor-pointer group"
                >
                    <div className="hidden lg:block text-right">
                        <div className="text-xs font-black text-slate-700 uppercase">
                            {user?.role === 'admin' ? 'Super Admin' : user?.role || 'Admin'}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400">
                            {user?.email || 'root@pariaza.ro'}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#58CC02] border-b-4 border-[#46A302] flex items-center justify-center text-white font-black shadow-sm group-hover:scale-105 group-active:border-b-0 group-active:translate-y-1 transition-all">
                        {getInitials(user?.name)}
                    </div>
                </div>

            </div>
        </header>
    );
};
