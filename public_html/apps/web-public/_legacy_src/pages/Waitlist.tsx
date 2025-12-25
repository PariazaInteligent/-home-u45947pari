import { motion } from 'motion/react';
import { useState } from 'react';
import { ArrowLeft, Mail, Check, AlertCircle } from 'lucide-react';

interface WaitlistProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function Waitlist({ onBack, onNavigate }: WaitlistProps) {
  const [email, setEmail] = useState('');
  const [experience, setExperience] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email-ul este necesar.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email invalid. Verifică formatul.');
      return;
    }

    setIsValidating(true);

    // Simulate API call
    setTimeout(() => {
      setIsValidating(false);
      setIsSubmitted(true);
    }, 1200);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4">
        {/* Background effects */}
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-2xl w-full text-center space-y-8"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20"
          >
            <Check className="w-10 h-10 text-emerald-400" />
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl">
              Ești pe listă.
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-xl mx-auto">
              Te contactăm când are sens. Fără spam. Fără urgențe inventate.
            </p>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 space-y-4"
          >
            <div className="space-y-2">
              <p className="text-slate-300">
                Email confirmat: <span className="text-blue-400">{email}</span>
              </p>
            </div>

            <div className="pt-4 border-t border-slate-700/50 text-sm text-slate-500 leading-relaxed space-y-2">
              <p>
                Accesul beta se deschide în funcție de capacitatea de management a capitalului.
              </p>
              <p>
                Nu grăbim procesul. Nu forțăm volumul. Nu sacrificăm calitatea pentru creștere.
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <button
              onClick={onBack}
              className="px-6 py-3 border border-slate-700 hover:border-slate-600 rounded-lg transition-all duration-300 hover:bg-slate-800/50 backdrop-blur-sm"
            >
              Înapoi la pagina principală
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40 pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative border-b border-slate-800 backdrop-blur-xl bg-slate-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Înapoi</span>
          </button>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-12"
          >
            {/* Hero text */}
            <div className="text-center space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm text-blue-200">
                  Acces limitat. Din responsabilitate.
                </span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight">
                Intră pe lista
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  de așteptare
                </span>
              </h1>

              <p className="text-xl text-slate-400 leading-relaxed max-w-xl mx-auto">
                Accesul este controlat. Nu din marketing. Din management de risc.
              </p>
            </div>

            {/* Explanation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 space-y-4"
            >
              <h2 className="text-2xl">De ce există lista?</h2>
              <div className="space-y-3 text-slate-300 leading-relaxed">
                <p>
                  Capitalul se gestionează responsabil doar când volumul rămâne sub control.
                </p>
                <p>
                  Prea mulți participanți = prea mult capital = presiune de execuție = decizii proaste.
                </p>
                <p>
                  Preferăm să creștem lent și să menținem standardele, decât să diluăm procesul pentru volum.
                </p>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm text-slate-400">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="adresa@exemplu.ro"
                      className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-white placeholder:text-slate-500"
                      disabled={isValidating}
                    />
                  </div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-red-400"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </div>

                {/* Experience field (optional) */}
                <div className="space-y-2">
                  <label htmlFor="experience" className="block text-sm text-slate-400">
                    Experiență în betting/investiții <span className="text-slate-600">(opțional)</span>
                  </label>
                  <select
                    id="experience"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-white appearance-none cursor-pointer"
                    disabled={isValidating}
                  >
                    <option value="">Prefer să nu răspund</option>
                    <option value="beginner">Începător - explorare</option>
                    <option value="intermediate">Intermediar - experiență moderată</option>
                    <option value="advanced">Avansat - experiență solidă</option>
                  </select>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isValidating}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isValidating ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                      />
                      Validare...
                    </span>
                  ) : (
                    'Confirmă înscrierea'
                  )}
                </button>

                {/* Disclaimer */}
                <div className="text-center text-sm text-slate-500 leading-relaxed space-y-1">
                  <p>
                    Fără date sensibile. Fără PII.
                  </p>
                  <p>
                    Folosim email-ul doar pentru comunicare legată de accesul beta.
                  </p>
                </div>
              </form>
            </motion.div>

            {/* Additional info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="border-t border-slate-800 pt-8 space-y-4"
            >
              <h3 className="text-lg text-slate-300">Ce urmează?</h3>
              <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
                <p>
                  <span className="text-slate-300">→</span> Primești confirmare instant (verifică și spam).
                </p>
                <p>
                  <span className="text-slate-300">→</span> Te contactăm când capacitatea permite acces nou.
                </p>
                <p>
                  <span className="text-slate-300">→</span> Fără presiune. Fără countdown. Fără FOMO artificial.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div>© 2024 Pariază Inteligent. Acces controlat.</div>
          <div className="flex gap-6">
            <button onClick={() => onNavigate?.('terms')} className="hover:text-slate-300 transition-colors">Termeni</button>
            <button onClick={() => onNavigate?.('privacy')} className="hover:text-slate-300 transition-colors">Confidențialitate</button>
            <button onClick={() => onNavigate?.('contact')} className="hover:text-slate-300 transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}