import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader, X } from 'lucide-react';
import { SoundManager } from '../utils/SoundManager';
import { ToastManager } from '../utils/ToastManager';

interface LoginPageProps {
  onBack: () => void;
  onSwitchToRegister: () => void;
  onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onSwitchToRegister, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login State
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [requiresBiometric, setRequiresBiometric] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          ...(requires2FA && totpCode && { totpCode: totpCode.trim() })
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if 2FA is required
        if (data.requires2FA) {
          setRequires2FA(true);
          setError('🔐 Introdu codul din Google Authenticator');
          setIsLoading(false);
          return;
        }
        throw new Error(data.message || 'Autentificare eșuată');
      }

      // ⭐ Check if biometric is required (after 2FA if applicable)
      if (data.requiresBiometric) {
        setRequiresBiometric(true);
        setIsLoading(false);

        // Trigger WebAuthn assertion
        try {
          const challenge = new Uint8Array(32);
          crypto.getRandomValues(challenge);

          const publicKeyOptions: PublicKeyCredentialRequestOptions = {
            challenge,
            rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
            userVerification: 'required',
            timeout: 60000
          };

          const credential = await navigator.credentials.get({
            publicKey: publicKeyOptions
          }) as PublicKeyCredential;

          if (!credential) {
            throw new Error('Autentificare biometrică eșuată');
          }

          ToastManager.showWithSound('success', '✅ Biometric verificat!');
          setRequiresBiometric(false);

          // Continue with normal login flow (tokens already set)
        } catch (biometricError: any) {
          console.error('Biometric error:', biometricError);
          if (biometricError.name === 'NotAllowedError') {
            setError('❌ Autentificare biometrică anulată');
            ToastManager.showWithSound('error', 'Autentificare biometrică anulată');
          } else {
            setError('❌ Eroare autentificare biometrică');
            ToastManager.showWithSound('error', 'Eroare autentificare biometrică');
          }
          // Reset and allow retry
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsLoading(false);
          return;
        }
      }

      // Save tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Determine role and show success
      const role = data.user.role === 'ADMIN' ? 'admin' : 'investor';
      setSuccess(true);

      // Toast + Sound combo
      ToastManager.showWithSound('success', '🎉 Bine ai revenit!');

      // Give time for bounce animation
      setTimeout(() => {
        // Fix: Normalize the user object before passing it up
        // The backend returns role as 'ADMIN' (uppercase), but App.tsx expects 'admin' (lowercase)
        const normalizedUser = {
          ...data.user,
          role: role // 'admin' or 'investor' (already calculated above correctly)
        };
        onLoginSuccess(normalizedUser);

        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 1500);

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Conexiune eșuată. Încearcă din nou.');
      ToastManager.showWithSound('error', err.message || 'Email sau parolă incorectă');
      // Clear TOTP on error
      if (requires2FA) {
        setTotpCode('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen (Duolingo Style)
  if (success) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-[480px] rounded-3xl shadow-[0_8px_0_#E5E5E5] border-2 border-[#E5E5E5] p-8 text-center">
          <div className="text-6xl mb-6 animate-bounce">🦉🎉</div>
          <h2 className="text-2xl font-black text-[#58CC02] mb-2">Bine ai revenit!</h2>
          <p className="text-[#777] font-medium mb-8 text-lg">Te conectăm imediat...</p>
          <div className="w-16 h-16 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[480px]">

        {/* Header with Mascot */}
        <div className="text-center mb-8">
          <div className="inline-block relative group">
            <div className="text-7xl mb-2 hover:scale-110 transition-transform cursor-default select-none">🦉</div>
            <div className="absolute -right-12 -top-2 bg-white px-4 py-2 rounded-xl border-2 border-[#E5E5E5] shadow-sm rotate-12 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-black text-[#1CB0F6]">Salut!</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-[#4B4B4B] mb-2">Intră în Cont</h1>
          <p className="text-[#777] font-medium text-lg">Continuă aventura ta în investiții.</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_0_#E5E5E5] border-2 border-[#E5E5E5] p-6 sm:p-8 animate-[fadeIn_0.5s_ease-out]">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[#4B4B4B] font-bold uppercase text-xs tracking-wider ml-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-[#F7F7F7] border-2 ${error ? 'border-[#FF4B4B] bg-[#FFF5F5]' : 'border-[#E5E5E5]'} text-[#4B4B4B] font-bold text-lg px-4 py-4 rounded-2xl focus:border-[#1CB0F6] focus:bg-white focus:outline-none transition-colors placeholder:text-[#D4D4D4]`}
                placeholder="nume@exemplu.or"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[#4B4B4B] font-bold uppercase text-xs tracking-wider">Parolă</label>
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-[#1CB0F6] font-bold text-xs uppercase tracking-wider hover:underline">
                  Recuperare?
                </button>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full bg-[#F7F7F7] border-2 ${error ? 'border-[#FF4B4B] bg-[#FFF5F5]' : 'border-[#E5E5E5]'} text-[#4B4B4B] font-bold text-lg px-4 py-4 rounded-2xl focus:border-[#1CB0F6] focus:bg-white focus:outline-none transition-colors placeholder:text-[#D4D4D4]`}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#AFAFAF] hover:text-[#1CB0F6] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {/* 2FA Code Field (Conditional) */}
            {requires2FA && (
              <div className="space-y-2">
                <label className="text-[#4B4B4B] font-bold uppercase text-xs tracking-wider ml-1">🔐 Cod 2FA</label>
                <input
                  type="text"
                  required
                  value={totpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9A-Fa-f-]/g, '').toUpperCase();
                    setTotpCode(value);
                  }}
                  maxLength={14}
                  className="w-full bg-[#F7F7F7] border-2 border-[#1CB0F6] text-[#4B4B4B] font-bold text-lg px-4 py-4 rounded-2xl focus:border-[#58CC02] focus:bg-white focus:outline-none transition-colors placeholder:text-[#D4D4D4] text-center tracking-widest"
                  placeholder="123456 sau XXXX-XXXX-XXXX"
                  disabled={isLoading}
                  autoFocus
                />
                <p className="text-[#777] text-xs font-medium ml-1">Introdu codul din Google Authenticator sau un cod backup</p>
              </div>
            )}

            {/* Biometric Prompt (Conditional) */}
            {requiresBiometric && (
              <div className="space-y-2 animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-[#58CC02] rounded-2xl p-6 text-center">
                  <div className="text-5xl mb-3 animate-pulse">🔐</div>
                  <p className="text-[#4B4B4B] font-black text-lg mb-2">Verificare Biometrică</p>
                  <p className="text-[#777] text-sm font-medium">
                    Autentifică-te cu FaceID, TouchID sau Windows Hello
                  </p>
                  <div className="mt-4">
                    <div className="w-12 h-12 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-[#FFDEDE] border-2 border-[#FF4B4B] rounded-2xl p-4 flex items-center gap-3 animate-shake">
                <div className="bg-[#FF4B4B] rounded-full p-1 text-white flex-shrink-0">
                  <X className="w-4 h-4" />
                </div>
                <span className="text-[#EA2B2B] font-bold text-sm tracking-wide">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#58CC02] hover:bg-[#46A302] active:translate-y-[4px] active:shadow-none text-white font-extrabold text-lg uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_0_#58A700] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  SE VERIFICĂ...
                </>
              ) : (
                'INTRĂ ÎN CONT'
              )}
            </button>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 space-y-4">
          <button
            onClick={onSwitchToRegister}
            className="w-full bg-white hover:bg-[#F0F0F0] active:translate-y-[4px] active:shadow-none text-[#1CB0F6] font-extrabold uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_0_#E5E5E5] border-2 border-[#E5E5E5] transition-all"
          >
            NU AI CONT? CREEAZĂ UNUL
          </button>

          <button
            onClick={onBack}
            className="w-full text-[#AFAFAF] font-bold uppercase tracking-widest text-sm hover:text-[#4B4B4B] transition-colors"
          >
            Înapoi la pagina principală
          </button>
        </div>

      </div>
    </div>
  );
};