import React, { useState } from 'react';
import { 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  Laptop, 
  User, 
  Mail, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  Zap, 
  CreditCard, 
  Globe 
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

export const Settings: React.FC = () => {
  const [settingsForm, setSettingsForm] = useState({
      emailNotifs: true,
      pushNotifs: true,
      marketing: false,
      twoFactor: true,
      biometrics: false,
      currency: 'RON',
      language: 'ro'
  });
  const [showPassword, setShowPassword] = useState(false);

  const toggleSetting = (key: keyof typeof settingsForm) => {
      setSettingsForm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
             <h2 className="text-2xl font-display font-bold text-white">Setări & Preferințe</h2>
             <p className="text-slate-400 text-sm">Administrează contul, securitatea și notificările.</p>
          </div>
          <Button3D variant="cyan" className="text-xs px-6 py-3">
             <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Salvează Modificările
             </span>
          </Button3D>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* LEFT COLUMN: Profile Info */}
           <div className="lg:col-span-4 space-y-6">
              <TiltCard glowColor="purple" noPadding className="relative overflow-hidden">
                 <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-purple-900/20 to-transparent"></div>
                 <div className="p-8 relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-purple-500/50 p-1 mb-4 relative">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-black flex items-center justify-center overflow-hidden">
                            <span className="text-3xl font-display font-bold text-white">AI</span>
                        </div>
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                           <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-white">Alex I.</h3>
                    <p className="text-xs text-purple-400 font-mono mb-6 uppercase tracking-widest">Investor Tier 1</p>

                    <div className="w-full space-y-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Nume Complet</label>
                          <div className="relative">
                             <User className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                             <input type="text" defaultValue="Alex I." className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-colors" />
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Email</label>
                          <div className="relative">
                             <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                             <input type="email" defaultValue="alex.investor@pi.ro" className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-colors" />
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="bg-slate-950/50 p-4 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Status KYC:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> VERIFICAT
                    </span>
                 </div>
              </TiltCard>

              {/* Session Info */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                     <Laptop className="w-4 h-4 text-cyan-400" /> Sesiuni Active
                  </h4>
                  <div className="space-y-3">
                     <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                           <div>
                              <div className="text-xs font-bold text-white">Chrome - Windows</div>
                              <div className="text-[10px] text-slate-500">București • Acum</div>
                           </div>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-mono border border-emerald-500/20 px-1.5 py-0.5 rounded">CURENT</span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-transparent rounded-lg border border-white/5 opacity-60">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                           <div>
                              <div className="text-xs font-bold text-white">Safari - iPhone 14</div>
                              <div className="text-[10px] text-slate-500">București • 2h în urmă</div>
                           </div>
                        </div>
                     </div>
                  </div>
              </div>
           </div>

           {/* RIGHT COLUMN: Settings Grid */}
           <div className="lg:col-span-8 space-y-6">
              
              {/* Security Settings */}
              <div className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                 <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-cyan-400" />
                    Securitate & Autentificare
                 </h3>

                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Parolă Curentă</label>
                          <div className="relative">
                             <Key className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                             <input type="password" value="********" readOnly className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-500 cursor-not-allowed" />
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Parolă Nouă</label>
                          <div className="relative">
                             <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                             <input 
                               type={showPassword ? "text" : "password"} 
                               className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors" 
                               placeholder="Minim 8 caractere"
                             />
                             <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-500 hover:text-white">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                             </button>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 pt-1">
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-white/5">
                           <div>
                              <div className="text-sm font-bold text-white mb-1">Autentificare 2FA</div>
                              <div className="text-xs text-slate-500">Cod unic via Google Auth</div>
                           </div>
                           <button 
                             onClick={() => toggleSetting('twoFactor')}
                             className={`relative w-11 h-6 rounded-full transition-colors ${settingsForm.twoFactor ? 'bg-cyan-600' : 'bg-slate-700'}`}
                           >
                              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settingsForm.twoFactor ? 'translate-x-5' : ''}`}></div>
                           </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-white/5">
                           <div>
                              <div className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                 Biometrie <Fingerprint className="w-3 h-3 text-cyan-400" />
                              </div>
                              <div className="text-xs text-slate-500">Login rapid (FaceID/TouchID)</div>
                           </div>
                           <button 
                             onClick={() => toggleSetting('biometrics')}
                             className={`relative w-11 h-6 rounded-full transition-colors ${settingsForm.biometrics ? 'bg-cyan-600' : 'bg-slate-700'}`}
                           >
                              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settingsForm.biometrics ? 'translate-x-5' : ''}`}></div>
                           </button>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Preferences */}
              <div className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                 <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    Preferințe & Notificări
                 </h3>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <span className="text-sm text-slate-300">Notificări Email (Rezultate)</span>
                           <button onClick={() => toggleSetting('emailNotifs')} className={`relative w-11 h-6 rounded-full transition-colors ${settingsForm.emailNotifs ? 'bg-purple-600' : 'bg-slate-700'}`}>
                              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settingsForm.emailNotifs ? 'translate-x-5' : ''}`}></div>
                           </button>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-sm text-slate-300">Notificări Push (Aplicație)</span>
                           <button onClick={() => toggleSetting('pushNotifs')} className={`relative w-11 h-6 rounded-full transition-colors ${settingsForm.pushNotifs ? 'bg-purple-600' : 'bg-slate-700'}`}>
                              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settingsForm.pushNotifs ? 'translate-x-5' : ''}`}></div>
                           </button>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-sm text-slate-300">Marketing & Oferte</span>
                           <button onClick={() => toggleSetting('marketing')} className={`relative w-11 h-6 rounded-full transition-colors ${settingsForm.marketing ? 'bg-purple-600' : 'bg-slate-700'}`}>
                              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settingsForm.marketing ? 'translate-x-5' : ''}`}></div>
                           </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Monedă Afișare</label>
                          <div className="relative">
                             <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                             <select 
                                value={settingsForm.currency}
                                onChange={(e) => setSettingsForm({...settingsForm, currency: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                             >
                                <option value="RON">RON (Lei)</option>
                                <option value="EUR">EUR (Euro)</option>
                                <option value="USD">USD (Dollar)</option>
                             </select>
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Limbă</label>
                          <div className="relative">
                             <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                             <select 
                                value={settingsForm.language}
                                onChange={(e) => setSettingsForm({...settingsForm, language: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                             >
                                <option value="ro">Română</option>
                                <option value="en">English</option>
                             </select>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Danger Zone */}
              <div className="border border-red-500/20 rounded-2xl p-6 bg-red-950/10">
                 <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4">Zona de Pericol</h3>
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-xs text-slate-400">
                       <p className="font-bold text-white mb-1">Dezactivare Temporară</p>
                       Poți suspenda activitatea contului pentru o perioadă determinată (Cool-off).
                    </div>
                    <button className="px-4 py-2 bg-transparent border border-red-500/50 text-red-400 text-xs font-bold rounded hover:bg-red-500/10 transition-colors whitespace-nowrap">
                       Suspendă Contul
                    </button>
                 </div>
              </div>
           </div>
       </div>
    </div>
  );
};