import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { UserCheck, Shield, ChevronRight, CheckCircle2, Terminal, ArrowLeft, Lock, Fingerprint, Key, Unlock, Clock, AlertTriangle, Gift, CheckCircle } from 'lucide-react';
import { Button3D } from './ui/Button3D';
import { TiltCard } from './ui/TiltCard';

interface RegisterPageProps {
  onBack: () => void;
  onSwitchToLogin: () => void;
  onLoginSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onBack, onSwitchToLogin, onLoginSuccess }) => {
  const [step, setStep] = useState<'boot' | 'form' | 'success'>('boot');
  const [loadingText, setLoadingText] = useState('INITIALIZING SECURE CONNECTION...');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tier: 'Entry Level',
    inviteCode: ''
  });

  // Result State
  const [verificationStatus, setVerificationStatus] = useState<'approved' | 'pending'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Invitation Code Validation
  const [inviteCodeValidating, setInviteCodeValidating] = useState(false);
  const [inviteCodeValid, setInviteCodeValid] = useState<boolean | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [inviteCodeMessage, setInviteCodeMessage] = useState<string>('');

  useEffect(() => {
    if (step === 'boot') {
      const sequence = [
        { text: 'ESTABLISHING HANDSHAKE...', time: 800 },
        { text: 'VERIFYING ENCRYPTION KEYS...', time: 1600 },
        { text: 'ACCESS GRANTED.', time: 2400 }
      ];

      let timeouts: ReturnType<typeof setTimeout>[] = [];

      sequence.forEach(({ text, time }) => {
        timeouts.push(setTimeout(() => setLoadingText(text), time));
      });

      timeouts.push(setTimeout(() => setStep('form'), 3000));

      return () => timeouts.forEach(clearTimeout);
    }
  }, [step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError(null);

    // Trigger invitation code validation with debounce
    if (name === 'inviteCode') {
      if (value.length >= 3) {
        setInviteCodeValidating(true);
        // Debounce validation
        const timeoutId = setTimeout(() => {
          validateInvitationCode(value);
        }, 500);
        return () => clearTimeout(timeoutId);
      } else {
        setInviteCodeValid(null);
        setReferrerName(null);
        setInviteCodeMessage('');
      }
    }
  };

  // Validate invitation code
  const validateInvitationCode = async (code: string) => {
    if (!code) {
      setInviteCodeValid(null);
      setReferrerName(null);
      setInviteCodeMessage('');
      setInviteCodeValidating(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/validate-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setInviteCodeValid(true);
        setReferrerName(data.referrerName);
        setInviteCodeMessage(data.message || 'Cod valid!');
      } else {
        setInviteCodeValid(false);
        setReferrerName(null);
        setInviteCodeMessage(data.message || 'Cod invalid');
      }
    } catch (err) {
      setInviteCodeValid(false);
      setReferrerName(null);
      setInviteCodeMessage('Eroare la validare');
    } finally {
      setInviteCodeValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Initial loading simulation for effect
    setLoadingText('PROCESSING BLOCKCHAIN TRANSACTION...');
    setStep('boot'); // Trigger boot animation

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          invitationCode: formData.inviteCode || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Success - check if user was activated based on invitation code
      const wasActivated = data.user?.status === 'ACTIVE' || inviteCodeValid;
      setVerificationStatus(wasActivated ? 'approved' : 'pending');
      setStep('success');

    } catch (err: any) {
      setError(err.message || 'A apărut o eroare. Încearcă din nou.');
      setIsLoading(false);
      setStep('form'); // Go back to form on error
    }
  };

  if (step === 'boot') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-pulse"></div>
        <div className="z-10 text-center space-y-4">
          {verificationStatus === 'pending' ? (
            <Fingerprint className="w-16 h-16 text-cyan-500 mx-auto animate-pulse" />
          ) : (
            <Lock className="w-16 h-16 text-violet-500 mx-auto animate-spin-slow" />
          )}
          <div className="text-cyan-400 text-sm tracking-widest uppercase">{loadingText}</div>
          <div className="w-64 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-cyan-500 animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center py-12 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_70%)]"></div>
      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
      <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>

      <div className="w-full max-w-5xl relative z-10 grid lg:grid-cols-5 gap-0 lg:gap-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* Left Panel */}
        <div className="lg:col-span-2 bg-slate-900/80 p-8 flex flex-col border-r border-white/5 relative">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs uppercase tracking-widest">Înapoi la Prezentare</span>
          </button>

          <div className="mb-8">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20 mb-4">
              <Lock className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">Protocol <br />Securizat</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Datele tale sunt criptate end-to-end. Accesul în fondul comun se face doar pe bază de invitație sau aprobare manuală.
            </p>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-950/50 p-3 rounded border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Zero comisioane ascunse</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-950/50 p-3 rounded border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Retrageri procesate în 24h</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center relative">
          {step === 'success' ? (
            <div className="text-center py-4 animate-[fadeIn_0.5s_ease-out]">

              {verificationStatus === 'approved' ? (
                <>
                  <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                    <Unlock className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-white mb-2">ACCES APROBAT</h3>
                  <p className="text-emerald-400/80 mb-8 font-mono text-sm tracking-wide uppercase">Cod invitație validat</p>

                  <div className="bg-emerald-950/30 p-6 rounded-xl border border-emerald-500/20 text-left font-mono text-sm space-y-3 mb-8">
                    <div className="flex justify-between border-b border-emerald-500/10 pb-2">
                      <span className="text-slate-400">STATUS CONT:</span>
                      <span className="text-emerald-400 font-bold animate-pulse">ACTIVE</span>
                    </div>
                    <div className="flex justify-between border-b border-emerald-500/10 pb-2">
                      <span className="text-slate-400">TIER:</span>
                      <span className="text-white uppercase">{formData.tier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">WALLET:</span>
                      <span className="text-emerald-400">GENERATED</span>
                    </div>
                  </div>

                  <Button3D variant="cyan" className="w-full" onClick={onLoginSuccess}>
                    INTRĂ ÎN DASHBOARD
                  </Button3D>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/40 shadow-[0_0_40px_rgba(234,179,8,0.2)]">
                    <Clock className="w-10 h-10 animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-white mb-2">VERIFICARE NECESARĂ</h3>
                  <div className="flex items-center justify-center gap-2 mb-8">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <p className="text-yellow-500/80 font-mono text-xs tracking-wide uppercase">Cod invalid sau lipsă</p>
                  </div>

                  <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                    Cererea ta a fost înregistrată, dar necesită aprobare manuală deoarece nu ai furnizat un cod VIP valid. Un administrator te va contacta pe email.
                  </p>

                  <div className="bg-slate-950 p-6 rounded-xl border border-white/10 text-left font-mono text-sm space-y-2 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">TICKET ID:</span>
                      <span className="text-white">#MN-8821-X</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">EST. TIMP:</span>
                      <span className="text-yellow-400">24 - 48 ORE</span>
                    </div>
                  </div>

                  <button onClick={onBack} className="text-sm text-slate-500 hover:text-white underline decoration-slate-700 underline-offset-4 transition-all">
                    Întoarce-te la pagina principală
                  </button>
                </>
              )}

            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-8 opacity-50">
                <Terminal className="w-4 h-4 text-cyan-500" />
                <span className="font-mono text-xs text-cyan-500">ROOT/USER/REGISTER_V2.exe</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Identificator (Nume)</label>
                  <div className="relative group">
                    <UserCheck className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700"
                      placeholder="ex: Alex I."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Canal Comunicare (Email)</label>
                  <div className="relative group">
                    <Shield className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-700"
                      placeholder="ex: contact@proton.me"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Cheie de Acces (Parolă)</label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={8}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Cod Invitație (Opțional)</label>
                  <div className="relative group">
                    <Unlock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="text"
                      name="inviteCode"
                      value={formData.inviteCode}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder:text-slate-700 font-mono tracking-widest uppercase"
                      placeholder="ex: PRO-2025"
                    />
                  </div>
                  {formData.inviteCode && (
                    <div className="mt-2">
                      {inviteCodeValidating && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                          Se validează...
                        </div>
                      )}
                      {!inviteCodeValidating && inviteCodeValid === true && (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-500/20">
                          <CheckCircle className="w-4 h-4" />
                          <div>
                            <div className="font-bold">{inviteCodeMessage}</div>
                            {referrerName && (
                              <div className="text-emerald-400/70 mt-0.5">Invitat de: {referrerName}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {!inviteCodeValidating && inviteCodeValid === false && (
                        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-500/20">
                          <AlertTriangle className="w-4 h-4" />
                          {inviteCodeMessage}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nivel Investiție</label>
                  <div className="relative">
                    <select
                      name="tier"
                      value={formData.tier}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer hover:border-slate-500"
                    >
                      <option value="Entry Level">Entry Level (500 - 1.000 RON)</option>
                      <option value="Investor">Investor (1.000 - 5.000 RON)</option>
                      <option value="Pro">Pro (5.000 - 10.000 RON)</option>
                      <option value="Whale">Whale (10.000+ RON)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      ▼
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <Button3D variant="cyan" className="w-full" disabled={isLoading}>
                    <span className="flex items-center gap-2">
                      {isLoading ? 'SE PROCESEAZĂ...' : 'INIȚIAZĂ CONEXIUNEA'} <ChevronRight className="w-4 h-4" />
                    </span>
                  </Button3D>
                </div>

                <div className="text-center pt-4 border-t border-white/5 mt-6">
                  <span className="text-slate-500 text-sm">Ai deja acces la protocol? </span>
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-bold ml-2 underline decoration-cyan-500/30 underline-offset-4"
                  >
                    Restabilește Conexiunea
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