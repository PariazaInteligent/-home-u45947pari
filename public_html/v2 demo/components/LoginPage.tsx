import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronRight, ArrowLeft, Lock, Cpu, ScanFace, Activity, Eye, EyeOff, XCircle, Terminal, AlertTriangle } from 'lucide-react';
import { Button3D } from './ui/Button3D';

interface LoginPageProps {
  onBack: () => void;
  onSwitchToRegister: () => void;
  onLoginSuccess: (role: 'investor' | 'admin') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onSwitchToRegister, onLoginSuccess }) => {
  const [step, setStep] = useState<'boot' | 'form' | 'success'>('boot');
  const [loadingText, setLoadingText] = useState('SEARCHING ENCRYPTED FREQUENCY...');
  const [showPassword, setShowPassword] = useState(false);
  
  // Login State
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'investor' | null>(null);

  useEffect(() => {
    if (step === 'boot') {
      const sequence = [
        { text: 'PINGING SERVER...', time: 500 },
        { text: 'HANDSHAKE ESTABLISHED.', time: 1000 }
      ];

      let timeouts: ReturnType<typeof setTimeout>[] = [];

      sequence.forEach(({ text, time }) => {
        timeouts.push(setTimeout(() => setLoadingText(text), time));
      });

      if (!formData.identifier && !formData.password) {
          timeouts.push(setTimeout(() => setStep('form'), 1500));
      }

      return () => timeouts.forEach(clearTimeout);
    }
  }, [step]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingText('VERIFYING CREDENTIALS...');
    setStep('boot'); 
    
    setTimeout(() => {
        const id = formData.identifier.trim().toLowerCase();
        const pass = formData.password.trim();

        if (id === 'admin@pi.ro' && pass === 'admin2025') {
            setRole('admin');
            setStep('success');
        } else if (id === 'investor@pi.ro' && pass === 'investor2025') {
            setRole('investor');
            setStep('success');
        } else {
            setStep('form');
            setError('CREDENTIALE INVALIDE. ACCES RESPINS.');
        }
    }, 2000);
  };

  const handleEnterDashboard = () => {
      if (role) {
          onLoginSuccess(role);
      }
  };

  if (step === 'boot') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-pulse"></div>
        <div className="z-10 text-center space-y-4">
           <Cpu className="w-16 h-16 text-emerald-500 mx-auto animate-pulse" />
           <div className="text-emerald-400 text-sm tracking-widest uppercase">{loadingText}</div>
           <div className="w-48 h-0.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-emerald-500 animate-[scan_1s_ease-in-out_infinite]"></div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center py-12 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]"></div>
      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
      <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>

      <div className="w-full max-w-4xl relative z-10 grid md:grid-cols-2 gap-0 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Left Panel */}
        <div className="bg-slate-900/80 p-8 flex flex-col border-r border-white/5 relative overflow-hidden">
           <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-0 left-0 text-[10px] font-mono text-emerald-500 whitespace-pre leading-3">
                 {Array(20).fill("01011001 0011010 1101001").map((s, i) => <div key={i}>{s}</div>)}
              </div>
           </div>

           <button 
             onClick={onBack}
             className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 group w-fit relative z-10"
           >
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
             <span className="text-xs uppercase tracking-widest">Înapoi</span>
           </button>

           <div className="mb-auto relative z-10">
             <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 mb-4">
               <ShieldCheck className="w-6 h-6 text-emerald-400" />
             </div>
             <h2 className="text-2xl font-display font-bold text-white mb-2">Portal<br/>Investitori</h2>
             <p className="text-slate-400 text-sm leading-relaxed mb-6">
               Acces securizat la panoul de administrare a fondurilor.
             </p>
             
             <div className="bg-black/40 p-4 rounded-lg border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-xs font-mono text-emerald-400">SYSTEM_OPERATIONAL</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                   <span>UPTIME:</span>
                   <span className="text-slate-300">99.98%</span>
                </div>
             </div>
           </div>
        </div>

        {/* Right Panel */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-slate-950/50">
            {step === 'success' ? (
                 <div className="text-center py-10 animate-[fadeIn_0.5s_ease-out]">
                   <div className={`w-20 h-20 ${role === 'admin' ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]'} rounded-full flex items-center justify-center mx-auto mb-6 border`}>
                     {role === 'admin' ? <Terminal className="w-10 h-10" /> : <Activity className="w-10 h-10" />}
                   </div>
                   
                   <h3 className="text-2xl font-display font-bold text-white mb-2">
                       {role === 'admin' ? 'ROOT ACCESS GRANTED' : 'SINCRONIZARE COMPLETĂ'}
                   </h3>
                   
                   <p className="text-slate-400 mb-8 text-sm font-mono uppercase tracking-wide">
                       {role === 'admin' ? 'Initializing Admin Console...' : 'Se încarcă dashboard-ul...'}
                   </p>
                   
                   <Button3D variant={role === 'admin' ? 'danger' : 'cyan'} className="w-full" onClick={handleEnterDashboard}>
                       {role === 'admin' ? 'DESCHIDE CONSOLA' : 'ACCESEAZĂ DASHBOARD'}
                   </Button3D>
                 </div>
            ) : (
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                   <ScanFace className="w-5 h-5 text-cyan-500" />
                   Autentificare
                </h3>

                {error && (
                    <div className="mb-6 p-3 bg-red-950/30 border border-red-500/50 rounded-lg flex items-center gap-3 animate-[shake_0.5s_ease-in-out]">
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="text-xs text-red-200 font-mono">{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">ID Investitor / Email</label>
                    <div className="relative group">
                      <input 
                         type="text" 
                         required
                         value={formData.identifier}
                         onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                         className={`w-full bg-slate-900 border ${error ? 'border-red-500/50' : 'border-slate-700'} rounded-lg py-3 px-4 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700`}
                         placeholder="ex: user@domain.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cheie de Acces (Parolă)</label>
                    <div className="relative group">
                      <Lock className={`absolute left-4 top-3.5 w-4 h-4 ${error ? 'text-red-400' : 'text-slate-600'} group-focus-within:text-emerald-400 transition-colors`} />
                      <input 
                         type={showPassword ? "text" : "password"}
                         required
                         value={formData.password}
                         onChange={(e) => setFormData({...formData, password: e.target.value})}
                         className={`w-full bg-slate-900 border ${error ? 'border-red-500/50' : 'border-slate-700'} rounded-lg py-3 pl-10 pr-10 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700 font-mono tracking-widest`}
                         placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-600 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button3D variant="cyan" className="w-full">
                        <span className="flex items-center gap-2">
                          RESTABILEȘTE CONEXIUNEA <ChevronRight className="w-4 h-4" />
                        </span>
                    </Button3D>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 bg-slate-950/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-3 h-3 text-yellow-500" />
                          <span className="text-[10px] text-yellow-500 font-mono uppercase tracking-widest">Demo Credentials</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                          <div className="space-y-1">
                              <div className="text-emerald-500 font-bold">INVESTOR:</div>
                              <div className="select-all cursor-pointer hover:text-white">investor@pi.ro</div>
                              <div className="select-all cursor-pointer hover:text-white">investor2025</div>
                          </div>
                          <div className="space-y-1 border-l border-white/10 pl-2">
                              <div className="text-red-400 font-bold">ADMIN:</div>
                              <div className="select-all cursor-pointer hover:text-white">admin@pi.ro</div>
                              <div className="select-all cursor-pointer hover:text-white">admin2025</div>
                          </div>
                      </div>
                  </div>

                  <div className="text-center mt-2">
                    <span className="text-slate-500 text-sm">Nu ești membru încă? </span>
                    <button 
                       type="button"
                       onClick={onSwitchToRegister}
                       className="text-cyan-400 hover:text-cyan-300 text-sm font-bold ml-2 underline decoration-cyan-500/30 underline-offset-4"
                    >
                       Inițiază Protocolul
                    </button>
                  </div>
                </form>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};