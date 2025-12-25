
import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Power, 
  Save, 
  HardDrive, 
  Trash2, 
  Terminal, 
  Cpu, 
  Activity,
  AlertTriangle
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

interface ApiService {
  id: string;
  name: string;
  key: string;
  status: 'connected' | 'disconnected' | 'testing';
  latency: string;
  icon: any;
}

export const SystemConfig: React.FC = () => {
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  // API Keys Management
  const [apiServices, setApiServices] = useState<ApiService[]>([
    { id: 'google', name: 'Google Gemini AI', key: 'AIzaSyD...9281', status: 'connected', latency: '45ms', icon: Cpu },
    { id: 'sportradar', name: 'SportRadar API', key: 'sr_live_...k92a', status: 'connected', latency: '120ms', icon: Activity },
    { id: 'stripe', name: 'Stripe Payments', key: 'sk_test_...512b', status: 'disconnected', latency: '--', icon: Key },
    { id: 'sendgrid', name: 'SendGrid Email', key: 'SG.9218...x992', status: 'connected', latency: '80ms', icon: Server },
  ]);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // System Toggles
  const [toggles, setToggles] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    debugLogging: true,
    betaFeatures: false
  });

  // --- ACTIONS ---

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestConnection = (id: string) => {
    setApiServices(prev => prev.map(s => s.id === id ? { ...s, status: 'testing' } : s));
    
    // Simulate API Ping
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      setApiServices(prev => prev.map(s => s.id === id ? { 
        ...s, 
        status: success ? 'connected' : 'disconnected',
        latency: success ? `${Math.floor(Math.random() * 150) + 20}ms` : '--'
      } : s));
    }, 1500);
  };

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBackup = () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    setBackupProgress(0);

    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsBackingUp(false), 1000);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const handleSaveGlobal = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <Server className="w-6 h-6 text-cyan-400" /> System Configuration
                </h2>
                <p className="text-slate-400 text-sm">Administrează cheile API, baza de date și variabilele globale.</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-slate-900 border border-white/10 rounded-lg text-xs font-mono text-slate-400">
                    ENV: <span className="text-emerald-400">PRODUCTION</span>
                </div>
                <Button3D variant="cyan" onClick={handleSaveGlobal} disabled={loading} className="text-xs px-6 py-3">
                    <span className="flex items-center gap-2">
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? 'SAVING...' : 'SAVE CHANGES'}
                    </span>
                </Button3D>
            </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* LEFT: API GATEWAY */}
            <div className="lg:col-span-7">
                <TiltCard glowColor="cyan" noPadding className="h-full flex flex-col">
                    <div className="p-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-cyan-400" /> API Gateway
                        </h3>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            Encrypted Vault
                        </div>
                    </div>

                    <div className="p-6 space-y-4 flex-1">
                        {apiServices.map((service) => (
                            <div key={service.id} className="bg-slate-950/50 border border-white/5 rounded-xl p-4 transition-all hover:border-cyan-500/30 group">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                            service.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
                                            service.status === 'testing' ? 'bg-yellow-500/10 text-yellow-400' :
                                            'bg-red-500/10 text-red-400'
                                        }`}>
                                            <service.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{service.name}</div>
                                            <div className="flex items-center gap-2 text-[10px] font-mono">
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    service.status === 'connected' ? 'bg-emerald-500' :
                                                    service.status === 'testing' ? 'bg-yellow-500 animate-pulse' :
                                                    'bg-red-500'
                                                }`}></span>
                                                <span className="text-slate-500 uppercase">{service.status}</span>
                                                {service.status === 'connected' && (
                                                    <span className="text-emerald-500/50">({service.latency})</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleTestConnection(service.id)}
                                        disabled={service.status === 'testing'}
                                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded text-xs font-bold text-slate-300 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {service.status === 'testing' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                        Test Connection
                                    </button>
                                </div>

                                <div className="relative">
                                    <input 
                                        type={visibleKeys[service.id] ? "text" : "password"} 
                                        value={service.key}
                                        readOnly
                                        className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-3 pr-10 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    />
                                    <button 
                                        onClick={() => toggleKeyVisibility(service.id)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {visibleKeys[service.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </TiltCard>
            </div>

            {/* RIGHT: CONTROLS & DATABASE */}
            <div className="lg:col-span-5 flex flex-col gap-6 h-full">
                
                {/* Global Switches */}
                <TiltCard glowColor="red" noPadding className="flex-1">
                    <div className="p-6 border-b border-white/5 bg-slate-900/50">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Power className="w-5 h-5 text-red-500" /> Core Controls
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-950/30 rounded-lg border border-white/5">
                            <div>
                                <div className="text-sm font-bold text-white">Maintenance Mode</div>
                                <div className="text-[10px] text-slate-500">Oprește accesul utilizatorilor.</div>
                            </div>
                            <div 
                                onClick={() => handleToggle('maintenanceMode')}
                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${toggles.maintenanceMode ? 'bg-red-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${toggles.maintenanceMode ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-950/30 rounded-lg border border-white/5">
                            <div>
                                <div className="text-sm font-bold text-white">Registration</div>
                                <div className="text-[10px] text-slate-500">Permite conturi noi.</div>
                            </div>
                            <div 
                                onClick={() => handleToggle('allowRegistration')}
                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${toggles.allowRegistration ? 'bg-emerald-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${toggles.allowRegistration ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-950/30 rounded-lg border border-white/5">
                            <div>
                                <div className="text-sm font-bold text-white">Debug Logging</div>
                                <div className="text-[10px] text-slate-500">Logare detaliată server.</div>
                            </div>
                            <div 
                                onClick={() => handleToggle('debugLogging')}
                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${toggles.debugLogging ? 'bg-cyan-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${toggles.debugLogging ? 'translate-x-6' : ''}`}></div>
                            </div>
                        </div>
                    </div>
                </TiltCard>

                {/* Database Ops */}
                <TiltCard glowColor="purple" noPadding className="flex-1">
                    <div className="p-6 border-b border-white/5 bg-slate-900/50">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Database className="w-5 h-5 text-purple-400" /> Database Operations
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        
                        {/* Backup UI */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase">System Backup</span>
                                <span className="text-xs font-mono text-purple-400">{isBackingUp ? `${backupProgress}%` : 'Last: 2h ago'}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                                <div 
                                    className="h-full bg-purple-500 transition-all duration-150 ease-linear shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                                    style={{ width: `${backupProgress}%` }}
                                ></div>
                            </div>
                            <button 
                                onClick={handleBackup}
                                disabled={isBackingUp}
                                className="w-full py-2 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-bold rounded uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isBackingUp ? <RefreshCw className="w-3 h-3 animate-spin" /> : <HardDrive className="w-3 h-3" />}
                                {isBackingUp ? 'Backing up...' : 'Start Backup'}
                            </button>
                        </div>

                        {/* Cache UI */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div>
                                <div className="text-sm font-bold text-white">Cache Memory</div>
                                <div className="text-[10px] text-slate-500">Size: 42.5 MB</div>
                            </div>
                            <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Purge Cache">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </TiltCard>

            </div>
        </div>

        {/* BOTTOM: ENVIRONMENT TERMINAL */}
        <div className="bg-black rounded-xl border border-white/10 p-1 relative overflow-hidden font-mono text-xs">
            <div className="bg-slate-900/80 px-4 py-2 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2 text-slate-400">
                    <Terminal className="w-3 h-3" />
                    <span>server_env_variables</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                </div>
            </div>
            <div className="p-4 space-y-1 text-slate-300 max-h-32 overflow-y-auto custom-scrollbar">
                <div><span className="text-cyan-500">NODE_ENV</span>=production</div>
                <div><span className="text-cyan-500">DB_HOST</span>=aws-eu-west-1.cluster.rds</div>
                <div><span className="text-cyan-500">REDIS_PORT</span>=6379</div>
                <div><span className="text-cyan-500">MAX_CONNECTIONS</span>=10000</div>
                <div><span className="text-cyan-500">JWT_SECRET</span>=****************</div>
                <div><span className="text-cyan-500">ENABLE_CRON</span>=true</div>
                <div className="text-slate-500 mt-2"># End of configuration</div>
            </div>
        </div>

    </div>
  );
};
