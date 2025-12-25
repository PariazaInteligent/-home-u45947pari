
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

type Mode = 'login' | 'register';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationState {
  email: string;
  password: string;
  confirmPassword: string;
}

export function Login({ onBack, onNavigate }: LoginProps) {
  const { login, register, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateEmail = (email: string): string => {
    if (!email) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Format email invalid';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return '';
    if (password.length < 8) return 'Minim 8 caractere';
    // Remove strict requirements for now to match easy testing, or keep them if strict is desired. 
    // Keeping basic check.
    return '';
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string => {
    if (!confirmPassword) return '';
    if (password !== confirmPassword) return 'Parolele nu coincid';
    return '';
  };

  const validation: ValidationState = {
    email: validateEmail(formData.email),
    password: validatePassword(formData.password),
    confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword),
  };

  const isValid = mode === 'login'
    ? !validation.email && !validation.password && formData.email && formData.password
    : !validation.email && !validation.password && !validation.confirmPassword && formData.email && formData.password && formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        navigate('/dashboard');
      } else {
        await register(formData.email, formData.password);
        setSubmitSuccess(true);
      }
    } catch (err) {
      // Error is handled via authError from context usually, or we can catch it here.
      // AuthContext also sets error state.
    }
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const switchMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setFormData({ email: '', password: '', confirmPassword: '' });
    setTouched({});
    setSubmitSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background effects - minimal */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30 pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 border-b border-slate-800 backdrop-blur-xl bg-slate-900/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Înapoi</span>
          </button>
          <div className="text-sm text-slate-500">Acces controlat</div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="flex items-center justify-center px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mode toggle */}
          <div className="mb-12 space-y-4">
            <div className="flex gap-2 p-1 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <button
                onClick={() => mode !== 'login' && switchMode()}
                className={`flex-1 py-3 rounded-md text-sm transition-all ${mode === 'login'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-300'
                  }`}
              >
                Autentificare
              </button>
              <button
                onClick={() => mode !== 'register' && switchMode()}
                className={`flex-1 py-3 rounded-md text-sm transition-all ${mode === 'register'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-300'
                  }`}
              >
                Înregistrare
              </button>
            </div>

            {/* Contextual copy */}
            <div className="text-center">
              <p className="text-sm text-slate-400 leading-relaxed">
                {mode === 'login' ? (
                  'Acces pentru participanți existenți.'
                ) : (
                  'Cerere de acces. Aprobarea nu este garantată.'
                )}
              </p>
            </div>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {authError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {authError}
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={isLoading || submitSuccess}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="adresa@email.com"
                  autoComplete="email"
                />
                {touched.email && validation.email && (
                  <p className="text-xs text-red-400">{validation.email}</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm text-slate-300">
                  Parolă
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    disabled={isLoading || submitSuccess}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {touched.password && validation.password && (
                  <p className="text-xs text-red-400">{validation.password}</p>
                )}
              </div>

              {/* Confirm password field - only for register */}
              {mode === 'register' && (
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm text-slate-300">
                    Confirmare parolă
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      disabled={isLoading || submitSuccess}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {touched.confirmPassword && validation.confirmPassword && (
                    <p className="text-xs text-red-400">{validation.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={!isValid || isLoading || (submitSuccess && mode === 'register')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg transition-all disabled:cursor-not-allowed relative overflow-hidden"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    {mode === 'login' ? 'Verificare...' : 'Înregistrare...'}
                  </span>
                ) : submitSuccess ? (
                  <span className="text-green-400">
                    {mode === 'login' ? 'Autentificat!' : 'Cont creat! Așteaptă aprobare.'}
                  </span>
                ) : (
                  <span>{mode === 'login' ? 'Continuă' : 'Trimite cerere'}</span>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Footer links */}
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 space-y-3">
            <p>
              Prin continuare, accepți{' '}
              <button
                onClick={() => onNavigate?.('terms')}
                className="text-slate-400 hover:text-slate-300 transition-colors underline underline-offset-2"
              >
                Termenii
              </button>{' '}
              și{' '}
              <button
                onClick={() => onNavigate?.('privacy')}
                className="text-slate-400 hover:text-slate-300 transition-colors underline underline-offset-2"
              >
                Politica de confidențialitate
              </button>
            </p>
            <p className="text-slate-600">
              {mode === 'register'
                ? 'Procesul de aprobare poate dura până la 48h.'
                : 'Datele sunt transmise criptat.'
              }
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
