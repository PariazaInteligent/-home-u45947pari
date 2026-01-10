
import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Activity,
  Database,
  LogOut,
  Search,
  Bell,
  Terminal,
  AlertTriangle,
  UserPlus,
  Server,
  Menu,
  X,
  Eye,
  Landmark,
  Scale,
  LifeBuoy,
  PenTool,
  Radio,
  Settings,
  ChevronDown,
  History,
  Calendar
} from 'lucide-react';

// Import Admin Sub-Components
import { AdminOverview } from './admin/AdminOverview';
import { UserManagement } from './admin/UserManagement';
import { BettingEngine } from './admin/BettingEngine';
import { SecurityLogs } from './admin/SecurityLogs';
import { Treasury } from './admin/Treasury';
import { RiskManagement } from './admin/RiskManagement';
import { ContentStudio } from './admin/ContentStudio';
import { SupportCRM } from './admin/SupportCRM';
import { BroadcastPanel } from './admin/BroadcastPanel';
import { BroadcastHistoryPage } from './admin/BroadcastHistoryPage';
import { ScheduleBroadcastPage } from './admin/ScheduleBroadcastPage';
import { SystemConfig } from './admin/SystemConfig';
import { TierManagement } from './admin/TierManagement';
import { AdminHeader } from './admin/AdminHeader';
import { AdminNotificationsPage } from './admin/AdminNotificationsPage';
import { PlaceholderPage } from './dashboard/PlaceholderPage';

interface AdminConsolePageProps {
  user: any; // We'll type this properly in a separate types file later if needed, or inline
  onLogout: () => void;
  onSwitchToInvestor: () => void;
  onNavigateToProfile?: () => void;
}

export const AdminConsolePage: React.FC<AdminConsolePageProps> = ({ user, onLogout, onSwitchToInvestor, onNavigateToProfile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get active tab from URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return 'overview';
    const segment = path.split('/admin/')[1];
    return segment || 'overview';
  };

  const activeTab = getActiveTab();

  // Real-time Notifications State
  interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    actionLink?: string;
  }
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch('http://localhost:3001/admin/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const pathMapping: Record<string, string> = {
    'overview': '/admin',
    'users': '/admin/users',
    'tiers': '/admin/tiers',
    'bets': '/admin/bets',
    'logs': '/admin/logs',
    'treasury': '/admin/treasury',
    'risk': '/admin/risk',
    'content': '/admin/content',
    'support': '/admin/support',
    'broadcast': '/admin/broadcast',
    'broadcast-history': '/admin/broadcast-history',
    'scheduled-broadcast': '/admin/scheduled-broadcast',
    'config': '/admin/config'
  };

  // Grouping Menu Items for better UX
  const menuGroups = [
    {
      title: "Main Operations",
      items: [
        { id: 'overview', icon: Activity, label: 'System Status' },
        { id: 'treasury', icon: Landmark, label: 'Treasury & Finance' },
        { id: 'risk', icon: Scale, label: 'Risk Management' },
      ]
    },
    {
      title: "Platform Management",
      items: [
        { id: 'users', icon: Users, label: 'User Database' },
        { id: 'tiers', icon: Scale, label: 'Tier Management' },
        { id: 'bets', icon: Database, label: 'Betting Engine' },
        { id: 'content', icon: PenTool, label: 'Content Studio' },
      ]
    },
    {
      title: "Communication & Logs",
      items: [
        { id: 'support', icon: LifeBuoy, label: 'Support Desk' },
        { id: 'broadcast', icon: Radio, label: 'Broadcast Center' },
        { id: 'broadcast-history', icon: History, label: 'Broadcast History' },
        { id: 'scheduled-broadcast', icon: Calendar, label: 'Schedule Broadcast' },
        { id: 'logs', icon: Terminal, label: 'Security Logs' },
        { id: 'config', icon: Settings, label: 'Global Config' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex font-sans text-slate-200 overflow-hidden relative selection:bg-red-500/30">
      {/* Red Admin Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(220,38,38,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(220,38,38,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none"></div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar - Updated with Light Theme & Robust Style */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r-4 border-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.1)]' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b-2 border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF4B4B] rounded-xl border-b-4 border-[#D32F2F] flex items-center justify-center text-white shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-slate-700 tracking-wide text-sm uppercase leading-none">PARIAZA</span>
              <span className="font-mono font-bold text-[#FF4B4B] text-[10px] tracking-widest">ADMIN CONSOLE</span>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600" aria-label="Close menu">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="mb-8">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 pl-3 flex items-center gap-2">
                {group.title} <ChevronDown className="w-3 h-3 opacity-50" />
              </h4>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(pathMapping[item.id]);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center p-3 rounded-2xl transition-all duration-200 group relative overflow-hidden border-2 ${activeTab === item.id
                      ? 'bg-[#E5F6FF] border-[#1CB0F6] text-[#1CB0F6]'
                      : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-100'
                      }`}
                  >
                    <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-[#1CB0F6]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="ml-3 font-bold text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t-2 border-slate-100 space-y-3 bg-slate-50">


          <button
            onClick={onLogout}
            className="w-full flex items-center p-3 text-slate-400 hover:text-[#FF4B4B] hover:bg-[#FF4B4B]/5 rounded-xl transition-colors font-bold text-xs uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4" />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative w-full bg-[#F7F7F7]">
        {/* NEW HEADER COMPONENT */}
        <AdminHeader
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          notifications={notifications}
          onNavigateToProfile={() => onNavigateToProfile ? onNavigateToProfile() : null}
          user={user}
        />

        <div className="p-4 sm:p-6 lg:p-10 space-y-8 pb-20">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/tiers" element={<TierManagement />} />
            <Route path="/bets" element={<BettingEngine />} />
            <Route path="/logs" element={<SecurityLogs />} />
            <Route path="/treasury" element={<Treasury />} />
            <Route path="/risk" element={<RiskManagement />} />
            <Route path="/content" element={<ContentStudio />} />
            <Route path="/support" element={<SupportCRM />} />
            <Route path="/broadcast" element={<BroadcastPanel />} />
            <Route path="/broadcast-history" element={<BroadcastHistoryPage />} />
            <Route path="/scheduled-broadcast" element={<ScheduleBroadcastPage />} />
            <Route path="/notifications" element={<AdminNotificationsPage />} />
            <Route path="/config" element={<SystemConfig />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};
