import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Mail, User, Target, Key, Sparkles, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundManager } from '../utils/SoundManager';
import { ToastManager } from '../utils/ToastManager';

interface RegisterPageProps {
  onBack: () => void;
  onSwitchToLogin: () => void;
  onLoginSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onBack, onSwitchToLogin, onLoginSuccess }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 'success'>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tier: 'Entry Level',
    gender: 'NEUTRAL' as 'MALE' | 'FEMALE' | 'NEUTRAL',
    inviteCode: ''
  });
  const [verificationStatus, setVerificationStatus] = useState<'approved' | 'pending'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ticketId, setTicketId] = useState<string>('');

  // Progress calculation
  const progress = currentStep === 'success' ? 100 : (currentStep / 5) * 100;

  // Validation for current step
  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.name.trim().length >= 2;
      case 2: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      case 3: return formData.tier.length > 0;
      case 4: return formData.gender.length > 0;
      case 5: return true; // Invite code is optional
      default: return false;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      SoundManager.play('whoosh'); // 🎵 Step transition sound
      if (currentStep === 5) {
        // Submit form
        handleSubmit();
      } else {
        setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4 | 5);
      }
    } else {
      SoundManager.play('error'); // 🎵 Validation error sound
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep !== 'success') {
      SoundManager.play('whoosh'); // 🎵 Backward transition sound
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          gender: formData.gender, // Send gender to backend
          invitationCode: formData.inviteCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Înregistrarea a eșuat');
      }

      // Check user status from API response
      const userStatus = data.user?.status;
      const userTicketId = data.user?.ticketId;

      if (userTicketId) {
        setTicketId(userTicketId);
      }

      if (userStatus === 'ACTIVE') {
        setVerificationStatus('approved');
        // Trigger confetti for instant activation
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#58CC02', '#7C3AED', '##FF9600', '#10B981']
          });
        }, 100);
      } else {
        setVerificationStatus('pending');
      }

      setCurrentStep('success');

      // ACHIEVEMENT TOAST - major milestone!
      ToastManager.showWithSound('achievement', '🎉 Cont creat cu succes!');

      // Trigger confetti with slight delay for dramatic effect
      setTimeout(() => {
        SoundManager.play('coins'); // 🎵 Bonus points feeling
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#58CC02', '#7C3AED', '#FF9600', '#10B981']
        });
      }, 300);
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Eroare la înregistrare. Încearcă din nou.');
      ToastManager.showWithSound('error', 'Eroare la înregistrare. Încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prof. Investino speech bubble messages
  const getMascotMessage = () => {
    switch (currentStep) {
      case 1: return "Hai să ne cunoaștem! Cum te cheamă? 🦉";
      case 2: return "Perfect! Unde să-ți trimitem știri bune? 📧";
      case 3: return "Cum vrei să apari în platformă? 👤";
      case 4: return "La ce nivel vrei să începi aventura? 🎯";
      case 5: return "Ai un cod special? Dacă nu, nicio problemă! 🔑";
      default: return "Bun venit! 🦉";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-purple-50 to-orange-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-green-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      {/* Header with back button */}
      <div className="relative z-10 pt-6 px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Înapoi</span>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">

        {currentStep !== 'success' && (
          <>
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-700">Pasul {currentStep} din 5</span>
                <span className="text-sm font-medium text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Prof. Investino mascot */}
            <div className="mb-8 flex items-start gap-3 animate-[fadeIn_0.5s_ease-out]">
              <div className="text-6xl flex-shrink-0 animate-[bounce_2s_ease-in-out_infinite]">
                🦉
              </div>
              <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-none shadow-lg border-2 border-purple-100 relative">
                <div className="absolute -left-2 top-0 w-4 h-4 bg-white border-l-2 border-t-2 border-purple-100 transform rotate-45"></div>
                <p className="text-gray-800 font-medium text-lg">{getMascotMessage()}</p>
              </div>
            </div>
          </>
        )}

        {/* Step content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-gray-100">

          {/* Step 1: Name */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-[slideIn_0.3s_ease-out]">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Cum te numești?</h2>
                <p className="text-gray-600">Să știm cum să te salutăm! 👋</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 ml-1">Numele tău</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  placeholder="ex: Alex Ionescu"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 2: Email */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-[slideIn_0.3s_ease-out]">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Care e emailul tău?</h2>
                <p className="text-gray-600">Pentru actualizări importante 📧</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 ml-1">Adresa de email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                  placeholder="ex: alex@email.com"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Step 3: Gender Selection */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-[slideIn_0.3s_ease-out]">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Cum vrei să apari?</h2>
                <p className="text-gray-600">Alege varianta care te reprezintă 👤</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 ml-1">Gen (pentru avatar implicit)</label>
                <div className="space-y-3">
                  {[
                    { value: 'MALE', label: 'Bărbat', icon: '👨', desc: 'Avatar masculin implicit' },
                    { value: 'FEMALE', label: 'Femeie', icon: '👩', desc: 'Avatar feminin implicit' },
                    { value: 'NEUTRAL', label: 'Prefer să nu spun', icon: '😊', desc: 'Avatar neutru' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: option.value as 'MALE' | 'FEMALE' | 'NEUTRAL' })}
                      className={`w-full p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${formData.gender === option.value
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{option.icon}</div>
                          <div>
                            <div className="font-bold text-gray-900 text-lg">{option.label}</div>
                            <div className="text-gray-600 text-sm">{option.desc}</div>
                          </div>
                        </div>
                        {formData.gender === option.value && (
                          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 ml-1 mt-2">
                  💡 Poți schimba avatarul mai târziu cu o fotografie personală
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Investment Level */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-[slideIn_0.3s_ease-out]">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">La ce nivel începi?</h2>
                <p className="text-gray-600">Alege pragul potrivit pentru tine 🎯</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 ml-1">Nivel investiție</label>
                <div className="space-y-3">
                  {[
                    { value: 'Entry Level', label: 'Entry Level', desc: '500 - 1.000 RON', color: 'green' },
                    { value: 'Investor', label: 'Investor', desc: '1.000 - 5.000 RON', color: 'blue' },
                    { value: 'Pro', label: 'Pro', desc: '5.000 - 10.000 RON', color: 'purple' },
                    { value: 'Whale', label: 'Whale', desc: '10.000+ RON', color: 'orange' }
                  ].map((tier) => (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, tier: tier.value })}
                      className={`w-full p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${formData.tier === tier.value
                        ? `border-${tier.color}-500 bg-${tier.color}-50 shadow-lg`
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{tier.label}</div>
                          <div className="text-gray-600 text-sm">{tier.desc}</div>
                        </div>
                        {formData.tier === tier.value && (
                          <div className={`w-8 h-8 bg-${tier.color}-500 rounded-full flex items-center justify-center`}>
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Invite Code */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-[slideIn_0.3s_ease-out]">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Ai un cod special?</h2>
                <p className="text-gray-600">Opțional - dacă ai primit un cod VIP 🔑</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 ml-1">Cod invitație (opțional)</label>
                <input
                  type="text"
                  value={formData.inviteCode}
                  onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-all font-mono tracking-widest text-center uppercase"
                  placeholder="PRO-2025"
                  autoFocus
                />
                {/* Demo hint */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-blue-900 mb-1">💡 Demo Hint</div>
                      <div className="text-sm text-blue-700">Încearcă codul: <span className="font-mono font-bold">PRO-2025</span> pentru acces instant!</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Screen */}
          {currentStep === 'success' && (
            <div className="text-center py-8 animate-[fadeIn_0.5s_ease-out]">
              {verificationStatus === 'approved' ? (
                <>
                  {/* Prof. Investino celebration */}
                  <div className="text-8xl mb-6 animate-[bounce_1s_ease-in-out]">
                    🦉🎉
                  </div>

                  <h2 className="text-4xl font-bold text-gray-900 mb-3">
                    Felicitări {formData.name.split(' ')[0]}! 🎊
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                    Ești oficial membru PRO!
                  </p>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between items-center py-2 border-b border-green-200">
                        <span className="text-gray-700 font-medium">Status cont</span>
                        <span className="text-green-600 font-bold flex items-center gap-2">
                          <Check className="w-5 h-5" /
                          >
                          ACTIV
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-green-200">
                        <span className="text-gray-700 font-medium">Nivel</span>
                        <span className="text-gray-900 font-bold">{formData.tier}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-700 font-medium">Email</span>
                        <span className="text-gray-600 text-sm">{formData.email}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onLoginSuccess}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-bold py-5 px-8 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    Explorează Dashboard-ul
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </>
              ) : (
                <>
                  {/* Pending approval */}
                  <div className="text-7xl mb-6">
                    <Clock className="w-20 h-20 text-yellow-500 mx-auto animate-pulse" />
                  </div>

                  <h2 className="text-4xl font-bold text-gray-900 mb-3">
                    Aproape gata, {formData.name.split(' ')[0]}! ⏳
                  </h2>
                  <p className="text-xl text-gray-600 mb-8">
                    Cererea ta este în proces de verificare
                  </p>

                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
                    <div className="space-y-3">
                      <p className="text-gray-700 text-left leading-relaxed">
                        Întrucât nu ai folosit un cod VIP, contul tău va fi verificat manual de echipa noastră.
                      </p>
                      <div className="bg-white rounded-xl p-4 text-left">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-gray-700">Ticket ID:</span>
                          <span className="text-sm font-mono text-gray-900">
                            {ticketId ? `#${ticketId}` : 'Se generează...'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-700">Timp estimat:</span>
                          <span className="text-sm font-bold text-yellow-600">24-48 ore</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 text-left">
                        📧 Vei primi un email la <span className="font-semibold">{formData.email}</span> când contul va fi aprobat.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onBack}
                    className="w-full bg-gray-200 text-gray-700 text-lg font-bold py-5 px-8 rounded-2xl hover:bg-gray-300 transition-all"
                  >
                    Înapoi la pagina principală
                  </button>
                </>
              )}

              {/* Switch to login */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={onSwitchToLogin}
                  className="text-purple-600 hover:text-purple-700 font-semibold underline decoration-purple-300 underline-offset-4"
                >
                  Ai deja cont? Conectează-te aici
                </button>
              </div>
            </div>
          )}

          {/* Navigation buttons (for steps 1-4) */}
          {currentStep !== 'success' && (
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Înapoi
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`flex-1 py-4 px-8 rounded-2xl font-bold text-lg transition-all transform flex items-center justify-center gap-3 ${isStepValid()
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {currentStep === 5 ? 'Finalizează' : 'Continuă'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer - already have account */}
        {currentStep !== 'success' && (
          <div className="text-center mt-6">
            <button
              onClick={onSwitchToLogin}
              className="text-gray-600 hover:text-gray-900 font-medium underline decoration-gray-300 underline-offset-4"
            >
              Ai deja cont? Conectează-te
            </button>
          </div>
        )}
      </div>
    </div>
  );
};