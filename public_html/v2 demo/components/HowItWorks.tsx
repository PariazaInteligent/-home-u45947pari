import React from 'react';
import { PiggyBank, Crosshair, BarChart3, ChevronRight } from 'lucide-react';
import { TiltCard } from './ui/TiltCard';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: <PiggyBank className="w-10 h-10 text-cyan-400" />,
      title: "Depunere Capital",
      desc: "Transferi suma dorită în fondul comun. Banii tăi se alătură unui pool de lichiditate gestionat profesional."
    },
    {
      icon: <Crosshair className="w-10 h-10 text-violet-400" />,
      title: "Execuție Value",
      desc: "Algoritmii noștri identifică discrepanțe în cote. Plasăm pariuri doar când matematica este de partea noastră."
    },
    {
      icon: <BarChart3 className="w-10 h-10 text-emerald-400" />,
      title: "Profit & Retragere",
      desc: "Urmărești creșterea în dashboard-ul live. Soliciți retragerea profitului oricând, simplu și transparent."
    }
  ];

  return (
    <section id="how-it-works" className="py-32 relative bg-slate-950 overflow-hidden">
      {/* Background Circuitry */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,100 Q400,150 800,100 T1600,150" fill="none" stroke="url(#gradient-line)" strokeWidth="2" />
        <defs>
          <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
           <div className="inline-block mb-4">
              <span className="text-cyan-500 font-mono text-xs tracking-[0.2em] border border-cyan-500/30 px-3 py-1 rounded uppercase bg-cyan-950/30">
                 Workflow
              </span>
           </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Arhitectura <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Sistemului</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Un proces circular, automatizat și optimizat pentru randament maxim.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
           {/* Connector Lines for Desktop */}
           <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent -translate-y-1/2 -z-10"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Animated Connector Dot */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 -translate-y-1/2 z-20 text-slate-700 group-hover:text-cyan-400 transition-colors duration-300">
                 {index < 2 && <ChevronRight className="w-full h-full opacity-50" />}
              </div>

              <TiltCard className="h-full" glowColor={index === 1 ? 'purple' : 'cyan'}>
                <div className="flex flex-col items-center text-center h-full relative z-10">
                  <div className="mb-8 p-6 rounded-2xl bg-slate-950/50 border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300 relative">
                    <div className="absolute inset-0 bg-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                    {step.icon}
                  </div>
                  
                  <div className="absolute top-4 right-4 text-4xl font-display font-bold text-white/5 select-none pointer-events-none">
                    0{index + 1}
                  </div>

                  <h3 className="text-2xl font-display font-bold text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};