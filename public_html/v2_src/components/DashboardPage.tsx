import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Wallet as WalletIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  ShieldAlert,
  Menu,
  X,
  Radar,
  BarChart2,
  Calculator,
  BookOpen,
  MessageSquare,
  Headphones,
} from 'lucide-react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';

interface DashboardPageProps {
  userType: 'investor' | 'admin';
  onLogout: () => void;
  onSwitchToAdmin?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToDeposit?: () => void;
  onNavigateToWithdraw?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  userType,
  onLogout,
  onSwitchToAdmin,
  onNavigateToProfile,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- MENU ITEMS DEFINITION ---
  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Panou General' },
    { id: 'wallet', icon: WalletIcon, label: 'Portofel & Depuneri' },
    { id: 'history', icon: HistoryIcon, label: 'Istoric Pariuri' },
    { id: 'scanner', icon: Radar, label: 'Live Scanner', isNew: true },
    { id: 'analytics', icon: BarChart2, label: 'Analiză Performanță' },
    { id: 'calculator', icon: Calculator, label: 'Calculator Profit' },
    { id: 'academy', icon: BookOpen, label: 'Academie' },
    { id: 'community', icon: MessageSquare, label: 'VIP Lounge' },
    { id: 'support', icon: Headphones, label: 'Suport & Tichete' },
    { id: 'settings', icon: SettingsIcon, label: 'Setări Cont' },
  ];

  // Derive active tab from URL
  const currentPath = location.pathname.split('/').pop() || 'overview';
  // Handle case where path is just /dashboard causing pop to be dashboard if strictly following, 
  // but App.tsx will redirect /dashboard to /dashboard/overview usually.
  // Better logic: match against known IDs.

  const activeTab = menuItems.find(item => location.pathname.includes(`/dashboard/${item.id}`))?.id || 'overview';

  // Mock Notifications (Only keeping shell-level data here)
  const notifications = [
    {
      id: 1,
      type: 'profit',
      title: 'Profit Înregistrat!',
      message: 'Biletul pe Real Madrid a fost câștigător. +125 RON adăugați în balanță.',
      time: '10 min',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Bilet Nou Plasat',
      message: 'Sistemul a identificat un value bet pe Tenis (ATP). Investiție: 250 RON.',
      time: '1 oră',
      read: false
    },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans text-slate-200 overflow-hidden relative selection:bg-cyan-500/30">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(6,182,212,0.2)]' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="font-display font-bold text-white text-lg">P</span>
            </div>
            <span className="ml-3 font-display font-bold text-white tracking-widest text-sm">
              PARIAZĂ<span className="text-cyan-400">INTELIGENT</span> <span className="text-[10px] text-slate-500 ml-1">v2.1</span>
            </span>
          </div>
          {/* Close button for mobile */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-1 px-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.id === 'overview' ? '/dashboard' : `/dashboard/${item.id}`}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative overflow-hidden mb-1 ${activeTab === item.id
                ? 'bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]'
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`}
            >
              {activeTab === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
              )}
              <div className="relative">
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'animate-pulse' : ''}`} />
                {item.isNew && <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>}
              </div>
              <span className="ml-3 font-medium text-sm tracking-wide uppercase">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-900/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="ml-3 font-bold text-sm">Deconectare</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative w-full">
        {/* Header - Z-INDEX INCREASED TO 40 */}
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg border border-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden md:flex items-center text-xs font-mono text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
              SYSTEM_ONLINE
            </div>

            {/* Admin Console Switch - ONLY FOR ADMINS */}
            {userType === 'admin' && (
              <button
                onClick={onSwitchToAdmin}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-2 sm:px-3 py-1.5 rounded-lg border border-red-500/30 transition-all hover:shadow-[0_0_10px_rgba(220,38,38,0.2)] ml-2 group"
              >
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Admin Console</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cauta tranzactie..."
                className="bg-slate-950 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 transition-colors w-32 sm:w-48 lg:w-64"
              />
            </div>

            {/* NOTIFICATIONS DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative transition-colors ${showNotifications ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Notificări</span>
                    <button className="text-[10px] text-cyan-400 hover:text-white transition-colors">Mark all read</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {notifications.map((notif) => (
                      <div key={notif.id} className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-cyan-500/5' : ''}`}>
                        <div className="flex gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'profit' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' :
                            notif.type === 'alert' ? 'bg-cyan-500' : 'bg-slate-500'
                            }`}></div>
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className={`text-sm font-bold mb-1 ${!notif.read ? 'text-white' : 'text-slate-400'}`}>{notif.title}</h4>
                              <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">{notif.time}</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 text-center border-t border-white/5 bg-slate-950/30">
                    <button className="text-[10px] text-slate-500 hover:text-white transition-colors uppercase tracking-wider">Vezi istoric complet</button>
                  </div>
                </div>
              )}
            </div>

            <div
              className="flex items-center gap-3 pl-0 sm:pl-6 sm:border-l border-white/10 cursor-pointer group"
              onClick={onNavigateToProfile}
            >
              <div className="text-right hidden lg:block">
                <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Alex I.</div>
                <div className="text-xs text-cyan-400 uppercase font-mono tracking-wider">{userType === 'admin' ? 'ROOT_ADMIN' : 'INVESTOR_TIER_1'}</div>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-display shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] group-hover:bg-slate-700 transition-all">
                {userType === 'admin' ? 'AD' : 'AI'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 lg:p-10 pb-20">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// Export helper constants if needed by App.tsx (not doing it now to keep it simple)
const menuItems = [
  { id: 'overview', icon: LayoutDashboard, label: 'Panou General' },
  { id: 'wallet', icon: WalletIcon, label: 'Portofel & Depuneri' },
  { id: 'history', icon: HistoryIcon, label: 'Istoric Pariuri' },
  { id: 'scanner', icon: Radar, label: 'Live Scanner', isNew: true },
  { id: 'analytics', icon: BarChart2, label: 'Analiză Performanță' },
  { id: 'calculator', icon: Calculator, label: 'Calculator Profit' },
  { id: 'academy', icon: BookOpen, label: 'Academie' },
  { id: 'community', icon: MessageSquare, label: 'VIP Lounge' },
  { id: 'support', icon: Headphones, label: 'Suport & Tichete' },
  { id: 'settings', icon: SettingsIcon, label: 'Setări Cont' },
];