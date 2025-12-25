import React, { useState, useEffect } from 'react';
import { Wallet, Target, TrendingUp, Check } from 'lucide-react';
import { apiClient, type PublicMetrics } from '../lib/api';

export const HowItWorks: React.FC = () => {
  const [investorCount, setInvestorCount] = useState<number>(62);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await apiClient.getPublicMetrics();
        setInvestorCount(data.investorCount || 62);
      } catch (err) {
        console.error('Error fetching investor count:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const steps = [
    {
      icon: Wallet,
      title: "Înregistrează-te",
      desc: "Creează cont gratuit în doar 2 minute. Nici un card necesar pentru început!",
      color: "from-blue-400 to-cyan-500",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-500",
    },
    {
      icon: Target,
      title: "Alege Suma",
      desc: "Investește cât dorești, de la 10 EURO. Fondurile tale sunt în siguranță!",
      color: "from-purple-400 to-pink-500",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-500",
    },
    {
      icon: TrendingUp,
      title: "Privește-l Crește!",
      desc: "Sistemul nostru inteligent lucrează pentru tine. Vezi profitul live în dashboard!",
      color: "from-emerald-400 to-green-500",
      bgColor: "bg-emerald-50",
      iconBg: "bg-emerald-500",
    }
  ];

  return (
    <section id="how-it-works" className="py-24 relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 overflow-hidden">

      {/* Playful Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-200/40 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-cyan-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-purple-200/40 rounded-full blur-xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 border-2 border-cyan-300 shadow-lg mb-6">
            <span className="text-2xl">🚀</span>
            <span className="text-cyan-700 text-sm font-bold">Simplu ca 1-2-3</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
            Cum <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">Funcționează?</span>
          </h2>
          <p className="text-xl text-white drop-shadow-lg max-w-2xl mx-auto font-semibold">
            În doar 3 pași simpli începi să câștigi! Fără experiență necesară.
          </p>
        </div>

        {/* Progress Path - Desktop */}
        <div className="hidden md:block relative">
          {/* Connecting Line */}
          <div className="absolute top-24 left-0 right-0 h-2 bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200 rounded-full mx-32"></div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">

                  {/* Step Card */}
                  <div className={`${step.bgColor} rounded-3xl p-8 border-4 border-white shadow-playful-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300`}>

                    {/* Number Badge - Positioned On the connecting line */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                      <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-2xl border-4 border-white`}>
                        <span className="text-white font-black text-2xl">{index + 1}</span>
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="mt-8 mb-6 flex justify-center">
                      <div className={`${step.iconBg} w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-black text-slate-800 mb-3 text-center">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 text-center leading-relaxed">
                      {step.desc}
                    </p>

                    {/* Checkmark for completed feel */}
                    <div className="mt-6 flex justify-center">
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border-2 border-slate-200">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-slate-600">Super Simplu!</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Path - Mobile (Vertical) */}
        <div className="md:hidden space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">

                {/* Vertical connecting line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-20 bottom-0 w-1 bg-gradient-to-b from-blue-200 to-purple-200 -z-10"></div>
                )}

                <div className="flex gap-4">
                  {/* Number Badge */}
                  <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-xl border-4 border-white`}>
                    <span className="text-white font-black text-2xl">{index + 1}</span>
                  </div>

                  {/* Card */}
                  <div className={`flex-1 ${step.bgColor} rounded-2xl p-6 border-4 border-white shadow-playful`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`${step.iconBg} w-14 h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 pt-2">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Encouraging CTA */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-6 border-4 border-yellow-300 shadow-playful-lg">
            <p className="text-2xl font-black text-slate-800 mb-2">
              Gata să începi? 🎉
            </p>
            <p className="text-slate-600">
              Alătură-te celor <span className="font-bold text-cyan-600">{loading ? '...' : investorCount} investitori</span> care au făcut deja primul pas!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};