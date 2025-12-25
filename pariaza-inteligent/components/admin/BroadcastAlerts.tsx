
import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Send, 
  Users, 
  Mail, 
  Bell, 
  Smartphone, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  Globe, 
  Wifi, 
  Cpu,
  Trash2,
  Copy
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

interface BroadcastLog {
  id: string;
  title: string;
  audience: string;
  channels: string[];
  priority: 'normal' | 'high' | 'critical';
  status: 'sent' | 'queued' | 'failed';
  timestamp: string;
  sentCount: number;
}

export const BroadcastAlerts: React.FC = () => {
  // --- STATE ---
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'all',
    priority: 'normal' as 'normal' | 'high' | 'critical',
  });

  const [selectedChannels, setSelectedChannels] = useState<string[]>(['push']);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionProgress, setTransmissionProgress] = useState(0);

  const [history, setHistory] = useState<BroadcastLog[]>([
    { id: 'BC-1001', title: 'Mentenanță Programată', audience: 'All Users', channels: ['push', 'email'], priority: 'normal', status: 'sent', timestamp: 'Yesterday, 10:00', sentCount: 154 },
    { id: 'BC-1002', title: 'Oportunitate Value Bet', audience: 'Whales', channels: ['push'], priority: 'high', status: 'sent', timestamp: 'Yesterday, 14:30', sentCount: 12 },
    { id: 'BC-1003', title: 'Eroare Procesator Plăți', audience: 'All Users', channels: ['email', 'in-app'], priority: 'critical', status: 'sent', timestamp: '2 days ago', sentCount: 154 },
  ]);

  // --- TEMPLATES ---
  const templates = [
    { title: 'Value Bet Alert', message: '🚀 Oportunitate nouă identificată! ROI estimat: 12%. Verifică acum secțiunea Live Scanner.' },
    { title: 'Maintenance Mode', message: '⚠️ Platforma va intra în mentenanță timp de 30 minute pentru upgrade-uri de securitate.' },
    { title: 'Bonus Activ', message: '🎉 Un bonus de loialitate a fost creditat în contul tău. Loghează-te pentru a-l revendica.' }
  ];

  // --- ACTIONS ---
  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev => 
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
    );
  };

  const applyTemplate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      title: templates[index].title,
      message: templates[index].message
    }));
  };

  const handleBroadcast = () => {
    if (!formData.title || !formData.message || selectedChannels.length === 0) return;

    setIsTransmitting(true);
    setTransmissionProgress(0);

    // Simulate Transmission
    const interval = setInterval(() => {
      setTransmissionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeBroadcast();
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const completeBroadcast = () => {
    const newLog: BroadcastLog = {
      id: `BC-${Math.floor(Math.random() * 10000)}`,
      title: formData.title,
      audience: formData.audience === 'all' ? 'All Users' : formData.audience === 'whales' ? 'Whales Only' : 'Inactive Users',
      channels: selectedChannels,
      priority: formData.priority,
      status: 'sent',
      timestamp: 'Just now',
      sentCount: formData.audience === 'all' ? 154 : formData.audience === 'whales' ? 12 : 45
    };

    setHistory([newLog, ...history]);
    setIsTransmitting(false);
    setFormData({ ...formData, title: '', message: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        
        {/* TRANSMISSION OVERLAY */}
        {isTransmitting && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center border border-cyan-500/30">
                <div className="w-64 relative mb-8">
                    <div className="flex justify-between items-end mb-2 text-xs font-mono text-cyan-400">
                        <span>UPLOADING_PACKETS</span>
                        <span>{transmissionProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all duration-100 ease-linear"
                            style={{ width: `${transmissionProgress}%` }}
                        ></div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin"></div>
                    <div className="text-2xl font-display font-bold text-white animate-pulse">BROADCASTING...</div>
                </div>
                <div className="mt-4 font-mono text-xs text-slate-500">
                    ENCRYPTING STREAM :: CHANNEL {selectedChannels.join(' + ').toUpperCase()}
                </div>
            </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    <Radio className="w-6 h-6 text-cyan-400 animate-pulse" /> Broadcast Center
                </h2>
                <p className="text-slate-400 text-sm">Trimite notificări globale sau targetate către baza de utilizatori.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/30 border border-cyan-500/20 rounded-full">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-cyan-400">NETWORK_ONLINE</span>
            </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
            
            {/* LEFT: COMPOSITION CONSOLE */}
            <div className="lg:col-span-7 space-y-6">
                <TiltCard glowColor="cyan" className="h-full flex flex-col" noPadding>
                    <div className="p-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" /> Signal Composer
                        </h3>
                        <div className="flex gap-2">
                            {/* Template Buttons */}
                            {templates.map((t, i) => (
                                <button 
                                    key={i}
                                    onClick={() => applyTemplate(i)}
                                    className="px-2 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 border border-white/10 rounded text-slate-300 transition-colors"
                                    title="Load Template"
                                >
                                    T{i+1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 space-y-6 flex-1">
                        
                        {/* Target & Priority */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Target Audience</label>
                                <div className="relative">
                                    <select 
                                        value={formData.audience}
                                        onChange={(e) => setFormData({...formData, audience: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                                    >
                                        <option value="all">All Users (154)</option>
                                        <option value="whales">Whale Tier Only (12)</option>
                                        <option value="inactive">Inactive {'>'} 30 Days (45)</option>
                                    </select>
                                    <Users className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Priority Level</label>
                                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-700">
                                    {['normal', 'high', 'critical'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setFormData({...formData, priority: p as any})}
                                            className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded transition-all ${
                                                formData.priority === p 
                                                ? p === 'critical' ? 'bg-red-600 text-white' : p === 'high' ? 'bg-yellow-500 text-black' : 'bg-cyan-600 text-white'
                                                : 'text-slate-500 hover:text-white'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Channels */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Transmission Channels</label>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => toggleChannel('push')}
                                    className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        selectedChannels.includes('push') 
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                                    }`}
                                >
                                    <Bell className="w-5 h-5" />
                                    <span className="text-xs font-bold">Push Notif.</span>
                                </button>
                                <button 
                                    onClick={() => toggleChannel('email')}
                                    className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        selectedChannels.includes('email') 
                                        ? 'bg-violet-600/20 border-violet-500 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                                    }`}
                                >
                                    <Mail className="w-5 h-5" />
                                    <span className="text-xs font-bold">Email Blast</span>
                                </button>
                                <button 
                                    onClick={() => toggleChannel('in-app')}
                                    className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        selectedChannels.includes('in-app') 
                                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                                    }`}
                                >
                                    <Smartphone className="w-5 h-5" />
                                    <span className="text-xs font-bold">In-App Msg</span>
                                </button>
                            </div>
                        </div>

                        {/* Content Inputs */}
                        <div className="space-y-4">
                            <div>
                                <input 
                                    type="text" 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="Titlu Mesaj (ex: Alertă Importantă)"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors font-bold"
                                />
                            </div>
                            <div>
                                <textarea 
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    rows={5}
                                    placeholder="Conținutul mesajului..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors resize-none text-sm leading-relaxed"
                                ></textarea>
                            </div>
                        </div>

                    </div>

                    {/* Action Bar */}
                    <div className="p-6 border-t border-white/5 bg-slate-900/50">
                        <Button3D 
                            variant={formData.priority === 'critical' ? 'danger' : 'cyan'} 
                            className="w-full py-4 text-lg"
                            onClick={handleBroadcast}
                            disabled={isTransmitting || !formData.title || !formData.message || selectedChannels.length === 0}
                        >
                            <span className="flex items-center gap-2">
                                <Send className="w-5 h-5" /> 
                                {isTransmitting ? 'TRANSMITTING...' : 'INITIATE BROADCAST'}
                            </span>
                        </Button3D>
                        <div className="text-center mt-2 text-[10px] text-slate-500 font-mono">
                            Estimated Reach: {formData.audience === 'all' ? '154' : formData.audience === 'whales' ? '12' : '45'} Users • Latency: &lt;50ms
                        </div>
                    </div>
                </TiltCard>
            </div>

            {/* RIGHT: LIVE FEED & VISUALIZER */}
            <div className="lg:col-span-5 space-y-6">
                
                {/* Frequency Visualizer (Purely Aesthetic) */}
                <div className="bg-black border border-white/10 rounded-2xl p-6 relative overflow-hidden h-48 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15),transparent_70%)]"></div>
                    
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                    <div className="relative z-10 flex items-end gap-1 h-24">
                        {[...Array(20)].map((_, i) => (
                            <div 
                                key={i}
                                className="w-1.5 bg-cyan-500 rounded-t-sm animate-pulse"
                                style={{ 
                                    height: `${Math.random() * 100}%`,
                                    animationDuration: `${0.5 + Math.random()}s`,
                                    opacity: 0.5 + Math.random() * 0.5
                                }}
                            ></div>
                        ))}
                    </div>
                    
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        <span className="text-[10px] font-mono text-emerald-500">LIVE_FREQUENCY</span>
                    </div>
                    <div className="absolute bottom-4 right-4 text-[10px] font-mono text-cyan-500">
                        108.4 MHz
                    </div>
                </div>

                {/* History Log */}
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col h-[400px]">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                            <History className="w-4 h-4 text-slate-400" /> Transmission Log
                        </h3>
                        <button className="text-xs text-slate-500 hover:text-white transition-colors">Clear Logs</button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {history.map((log) => (
                            <div key={log.id} className="bg-slate-950/50 border border-white/5 p-3 rounded-xl hover:border-cyan-500/30 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                            log.priority === 'critical' ? 'bg-red-500 animate-pulse' :
                                            log.priority === 'high' ? 'bg-yellow-500' :
                                            'bg-cyan-500'
                                        }`}></div>
                                        <span className="font-bold text-white text-sm line-clamp-1">{log.title}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                                </div>
                                
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <div className="flex gap-2">
                                        {log.channels.map(c => (
                                            <span key={c} className="uppercase bg-white/5 px-1.5 py-0.5 rounded text-[10px]">{c}</span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3" /> {log.sentCount}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
