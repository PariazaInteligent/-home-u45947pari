import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Key, 
  Smartphone, 
  Bell, 
  Eye, 
  CreditCard, 
  History, 
  Fingerprint, 
  QrCode,
  Zap,
  Cpu,
  Save
} from 'lucide-react';
import { TiltCard } from './ui/TiltCard';
import { Button3D } from './ui/Button3D';

interface ProfilePageProps {
  userType: 'investor' | 'admin';
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userType, onBack }) => {
  const [editMode, setEditMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(true);

  const theme = userType === 'admin' ? {
    color: 'red',
    accent: 'text-red-500',
    bg: 'bg-red-500',
    border: 'border-red-500',
    glow: 'shadow-red-500/20'
  } : {
    color: 'cyan',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500',
    border: 'border-cyan-500',
    glow: 'shadow-cyan-500/20'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      <div className={`absolute top-0 right-0 w-[600px] h-[600px] ${userType === 'admin' ? 'bg-red-600/10' : 'bg-cyan-600/10'} rounded-full blur-[120px] -z-10`}></div>

      {/* Header */}
      <header className="h-20 flex items-center px-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs uppercase tracking-widest font-bold">Înapoi la Dashboard</span>
        </button>
        <div className="ml-auto flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${theme.bg} animate-pulse`}></div>
           <span className={`text-xs font-mono ${theme.accent}`}>IDENTITY_VERIFIED</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 lg:p-12">
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: THE ID CARD */}
          <div className="lg:col-span-4 space-y-8">
            <div className="relative group perspective-1000">
               <TiltCard glowColor={userType === 'admin' ? 'purple' : 'cyan'} noPadding className="overflow-hidden min-h-[500px] flex flex-col relative">
                  {/* Decorative ID Card Elements */}
                  <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  
                  {/* Top Section */}
                  <div className="p-8 relative z-10">
                     <div className="flex justify-between items-start mb-8">
                        <Cpu className={`w-8 h-8 ${theme.accent} opacity-80`} />
                        <QrCode className="w-12 h-12 text-white/20" />
                     </div>

                     <div className="relative w-32 h-32 mx-auto mb-6">
                        <div className={`absolute inset-0 rounded-full border-2 border-dashed ${theme.border} opacity-30 animate-spin-slow`}></div>
                        <div className={`absolute -inset-2 rounded-full border border-white/5`}></div>
                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center relative overflow-hidden border border-white/10 shadow-2xl">
                           <span className={`text-4xl font-display font-bold ${theme.accent}`}>
                              {userType === 'admin' ? 'AD' : 'AI'}
                           </span>
                           {/* Scan Effect */}
                           <div className={`absolute top-0 left-0 w-full h-1 ${theme.bg} opacity-50 animate-[scan_2s_linear_infinite]`}></div>
                        </div>
                        <div className={`absolute bottom-0 right-0 w-8 h-8 ${theme.bg} rounded-full flex items-center justify-center border-4 border-slate-900`}>
                           <ShieldCheck className="w-4 h-4 text-slate-900" />
                        </div>
                     </div>

                     <div className="text-center space-y-1">
                        <h2 className="text-2xl font-display font-bold text-white tracking-wide">Alex I.</h2>
                        <div className={`text-xs font-mono uppercase tracking-widest ${theme.accent}`}>
                           {userType === 'admin' ? 'ROOT ADMINISTRATOR' : 'INVESTOR TIER 1'}
                        </div>
                     </div>
                  </div>

                  {/* ID Details */}
                  <div className="flex-1 bg-black/20 p-8 space-y-4 backdrop-blur-sm border-t border-white/5">
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">ID Hash:</span>
                        <span className="font-mono text-slate-300">0x8F...2A9C</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Membru din:</span>
                        <span className="text-slate-300">Oct 2024</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Clearance:</span>
                        <span className={`${theme.accent} font-bold`}>{userType === 'admin' ? 'LEVEL 5 (MAX)' : 'LEVEL 1'}</span>
                     </div>
                  </div>

                  {/* Bottom Strip */}
                  <div className={`h-12 ${userType === 'admin' ? 'bg-red-900/20' : 'bg-cyan-900/20'} border-t border-white/5 flex items-center justify-between px-6`}>
                     <span className="text-[10px] text-white/40 font-mono">PARIAZĂ INTELIGENT PROTOCOL</span>
                     <div className="flex gap-1">
                        {[1,2,3].map(i => <div key={i} className={`w-1 h-1 rounded-full ${theme.bg} opacity-50`}></div>)}
                     </div>
                  </div>
               </TiltCard>
            </div>

            {/* Quick Stats (Mobile only mostly, visible on desktop too) */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-center">
                  <div className="text-slate-500 text-xs uppercase mb-1">Total Zile</div>
                  <div className="text-xl font-bold text-white">42</div>
               </div>
               <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-center">
                  <div className="text-slate-500 text-xs uppercase mb-1">Sesiuni</div>
                  <div className="text-xl font-bold text-white">158</div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SETTINGS & PREFERENCES */}
          <div className="lg:col-span-8 space-y-6">
             
             {/* Security Panel */}
             <div className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${theme.bg}`}></div>
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
                      <ShieldCheck className={`w-6 h-6 ${theme.accent}`} />
                      Centru de Securitate
                   </h3>
                   <span className="text-xs text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded bg-emerald-500/10">High Security</span>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-slate-800 rounded-lg">
                            <Key className="w-5 h-5 text-slate-400" />
                         </div>
                         <div>
                            <div className="text-sm font-bold text-white">Schimbă Parola</div>
                            <div className="text-xs text-slate-500">Ultima actualizare: acum 30 zile</div>
                         </div>
                      </div>
                      <button className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-white px-4 py-2 rounded transition-all">
                         Update
                      </button>
                   </div>

                   <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-slate-800 rounded-lg">
                            <Smartphone className="w-5 h-5 text-slate-400" />
                         </div>
                         <div>
                            <div className="text-sm font-bold text-white">Autentificare 2FA</div>
                            <div className="text-xs text-slate-500">Protecție extra via Google Authenticator</div>
                         </div>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                         <input type="checkbox" className="sr-only peer" defaultChecked />
                         <div className={`w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${theme.bg}`}></div>
                      </div>
                   </div>

                   <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-slate-800 rounded-lg">
                            <Fingerprint className="w-5 h-5 text-slate-400" />
                         </div>
                         <div>
                            <div className="text-sm font-bold text-white">Login Biometric</div>
                            <div className="text-xs text-slate-500">FaceID / TouchID pentru acces rapid</div>
                         </div>
                      </div>
                      <div 
                        onClick={() => setBiometrics(!biometrics)}
                        className="relative inline-flex items-center cursor-pointer"
                      >
                         <div className={`w-11 h-6 ${biometrics ? theme.bg : 'bg-slate-700'} rounded-full transition-colors relative`}>
                            <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform ${biometrics ? 'translate-x-full' : ''}`}></div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Personal Info & Preferences */}
             <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl p-6">
                   <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                      <Zap className={`w-5 h-5 ${theme.accent}`} />
                      Preferințe
                   </h3>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-sm text-slate-400">Notificări Email</span>
                         <div onClick={() => setNotifications(!notifications)} className={`w-8 h-4 ${notifications ? 'bg-emerald-500' : 'bg-slate-700'} rounded-full relative cursor-pointer transition-colors`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${notifications ? 'translate-x-4' : ''}`}></div>
                         </div>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-sm text-slate-400">Rapoarte Zilnice</span>
                         <div className={`w-8 h-4 bg-emerald-500 rounded-full relative cursor-pointer`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full translate-x-4`}></div>
                         </div>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-sm text-slate-400">Sunete Interfață</span>
                         <div className={`w-8 h-4 bg-slate-700 rounded-full relative cursor-pointer`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full`}></div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl p-6">
                   <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                      <CreditCard className={`w-5 h-5 ${theme.accent}`} />
                      Date Financiare
                   </h3>
                   <div className="space-y-3">
                      <div className="p-3 bg-black/30 rounded border border-white/5">
                         <div className="text-xs text-slate-500 uppercase">Metodă Retragere</div>
                         <div className="text-sm font-mono text-white">Revolut Bank •••• 4291</div>
                      </div>
                      <div className="p-3 bg-black/30 rounded border border-white/5">
                         <div className="text-xs text-slate-500 uppercase">Monedă Principală</div>
                         <div className="text-sm font-mono text-white">RON (Romanian Leu)</div>
                      </div>
                      <button className={`w-full py-2 mt-2 text-xs font-bold uppercase ${theme.accent} border border-dashed ${theme.border} rounded hover:bg-white/5 transition-colors`}>
                         Editează Date
                      </button>
                   </div>
                </div>
             </div>

             {/* Save Button */}
             <div className="flex justify-end pt-4">
                <Button3D variant={userType === 'admin' ? 'danger' : 'cyan'} className="w-full sm:w-auto">
                   <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" /> SALVEAZĂ MODIFICĂRILE
                   </span>
                </Button3D>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};