
import React, { useState } from 'react';
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
  ChevronDown
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
import { BroadcastAlerts } from './admin/BroadcastAlerts';
import { SystemConfig } from './admin/SystemConfig';
import { PlaceholderPage } from './dashboard/PlaceholderPage';

interface AdminConsolePageProps {
  onLogout: () => void;
  onSwitchToInvestor: () => void;
  onNavigateToProfile?: () => void;
}

export const AdminConsolePage: React.FC<AdminConsolePageProps> = ({ onLogout, onSwitchToInvestor, onNavigateToProfile }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin Specific Notifications
  const notifications = [
    { 
      id: 1, 
      type: 'warning', 
      title: 'New User Request', 
      message: 'Popescu A. has requested access to Investor Tier.', 
      time: '2 min ago',
      read: false
    },
    { 
      id: 2, 
      type: 'alert', 
      title: 'High Load Alert', 
      message: 'Server CPU usage peaked at 85%. Scaling instances...', 
      time: '15 min ago',
      read: false
    },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  const renderContent = () => {
      switch (activeTab) {
          case 'overview': return <AdminOverview />;
          case 'users': return <UserManagement />;
          case 'bets': return <BettingEngine />;
          case 'logs': return <SecurityLogs />;
          case 'treasury': return <Treasury />;
          case 'risk': return <RiskManagement />;
          case 'content': return <ContentStudio />;
          case 'support': return <SupportCRM />;
          case 'broadcast': return <BroadcastAlerts />;
          case 'config': return <SystemConfig />;

          default: return <AdminOverview />;
      }
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
            { id: 'bets', icon: Database, label: 'Betting Engine' },
            { id: 'content', icon: PenTool, label: 'Content Studio' }, 
          ]
      },
      {
          title: "Communication & Logs",
          items: [
            { id: 'support', icon: LifeBuoy, label: 'Support Desk' }, 
            { id: 'broadcast', icon: Radio, label: 'Broadcast Center' }, 
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

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-black/95 backdrop-blur-xl border-r border-red-900/20 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(220,38,38,0.2)]' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-red-900/20">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-900/20 text-red-500 rounded-lg flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="ml-3 font-display font-bold text-white tracking-widest text-xs uppercase">
                ROOT_<span className="text-red-500">ACCESS</span>
            </span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group, idx) => (
             <div key={idx} className="mb-6">
                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 pl-2 flex items-center gap-2">
                    {group.title} <ChevronDown className="w-3 h-3 opacity-50" />
                </h4>
                <div className="space-y-1">
                    {group.items.map((item) => (
                        <button
                        key={item.id}
                        onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center p-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                            activeTab === item.id 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[inset_0_0_10px_rgba(220,38,38,0.1)]' 
                            : 'text-slate-500 hover:text-red-200 hover:bg-white/5'
                        }`}
                        >
                        {activeTab === item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                        <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-red-500' : 'text-slate-500 group-hover:text-red-400'}`} />
                        <span className="ml-3 font-mono font-medium text-xs tracking-wider uppercase">{item.label}</span>
                        </button>
                    ))}
                </div>
             </div>
          ))}
        </nav>

        <div className="p-4 border-t border-red-900/20 space-y-3 bg-red-950/5">
          <button 
            onClick={onSwitchToInvestor}
            className="w-full flex items-center p-2.5 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-400 border border-cyan-500/20 rounded-lg transition-colors group"
          >
            <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="ml-3 font-bold text-[10px] uppercase tracking-wider">Investor View</span>
          </button>

          <button 
            onClick={onLogout}
            className="w-full flex items-center p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="ml-3 font-bold text-xs uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative w-full">
        {/* Header - Z-INDEX INCREASED TO 40 */}
        <header className="h-20 bg-black/50 backdrop-blur-md border-b border-red-900/20 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-2 sm:gap-4">
             {/* Mobile Menu Trigger */}
             <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg border border-white/10"
             >
                <Menu className="w-5 h-5" />
             </button>

             <div className="flex items-center text-xs font-mono text-red-500 bg-red-500/10 px-3 py-1 rounded border border-red-500/20">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                ADMIN_CONSOLE_V2.0
             </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
             <div className="relative hidden md:block">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Cauta utilizator / hash..." 
                  className="bg-black border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500 transition-colors w-32 sm:w-64 text-red-100 placeholder:text-slate-700"
                />
             </div>

             {/* ADMIN NOTIFICATIONS DROPDOWN */}
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative transition-colors ${showNotifications ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-4 w-80 sm:w-96 bg-black/95 backdrop-blur-xl border border-red-900/50 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.2)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-red-900/30 flex justify-between items-center bg-red-950/20">
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> System Logs
                      </span>
                      <button className="text-[10px] text-slate-500 hover:text-white transition-colors">Clear Stream</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.map((notif) => (
                        <div key={notif.id} className={`p-4 border-b border-red-900/20 hover:bg-red-950/10 transition-colors cursor-pointer ${!notif.read ? 'bg-red-500/5' : ''}`}>
                          <div className="flex gap-4">
                            <div className="mt-1">
                               {notif.type === 'warning' ? <UserPlus className="w-4 h-4 text-yellow-500" /> :
                                notif.type === 'alert' ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                                notif.type === 'security' ? <ShieldAlert className="w-4 h-4 text-orange-500" /> :
                                <Server className="w-4 h-4 text-slate-500" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className={`text-xs font-bold font-mono uppercase mb-1 ${!notif.read ? 'text-red-200' : 'text-slate-500'}`}>{notif.title}</h4>
                                <span className="text-[10px] text-slate-600 whitespace-nowrap ml-2 font-mono">{notif.time}</span>
                              </div>
                              <p className="text-sm text-slate-400 leading-tight">{notif.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 text-center border-t border-red-900/30 bg-black/50">
                      <button className="text-[10px] text-red-500/50 hover:text-red-400 transition-colors uppercase tracking-wider font-mono">:: VIEW_FULL_LOGS ::</button>
                    </div>
                  </div>
                )}
             </div>

             <div className="w-10 h-10 rounded-full bg-red-950 border border-red-500/30 flex items-center justify-center text-red-500 font-bold font-display cursor-pointer hover:bg-red-900/50 transition-colors" onClick={onNavigateToProfile}>
                AD
             </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-10 space-y-8 pb-20">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};
