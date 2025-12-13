import React from 'react';
import { Search, BrainCircuit, Lock, Scale } from 'lucide-react';
import { TiltCard } from './ui/TiltCard';

export const Advantages: React.FC = () => {
  const benefits = [
    {
      icon: <Search className="w-8 h-8 text-cyan-400" />,
      title: "Transparență Radicală",
      desc: "Blockchain-style logging. Vezi istoricul fiecărui pariu plasat, timestamp-uri și cote originale."
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-violet-400" />,
      title: "Value Betting, nu Noroc",
      desc: "Software proprietar care scanează 50+ case de pariuri pentru a găsi cote greșite matematic."
    },
    {
      icon: <Scale className="w-8 h-8 text-emerald-400" />,
      title: "Management Risc",
      desc: "Sistem Kelly Criterion adaptat. Niciodată nu expunem mai mult de 3% din bancă pe un singur eveniment."
    },
    {
      icon: <Lock className="w-8 h-8 text-blue-400" />,
      title: "Disciplină Investițională",
      desc: "Eliminăm factorul uman și emoțional. Deciziile sunt luate strict pe baza datelor statistice."
    }
  ];

  return (
    <section id="benefits" className="py-32 bg-slate-900 relative overflow-hidden">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20">
           <div>
              <h2 className="text-4xl font-display font-bold text-white mb-2">Avantajele <span className="text-violet-400">Platformei</span></h2>
              <p className="text-slate-400">De ce suntem diferiți de orice grup de pariuri.</p>
           </div>
           <div className="hidden md:block w-32 h-1 bg-gradient-to-r from-violet-500 to-transparent"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((item, idx) => (
            <div key={idx} className="h-full">
               <TiltCard glowColor={idx % 2 === 0 ? 'cyan' : 'purple'} className="h-full">
                  <div className="flex flex-col items-center text-center h-full relative">
                    
                    {/* Floating Icon Container */}
                    <div className="relative mb-6 group-hover:-translate-y-2 transition-transform duration-500">
                       <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity"></div>
                       <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
                          {item.icon}
                       </div>
                    </div>

                    <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    
                    {/* Decorative Bottom Line */}
                    <div className="mt-auto pt-6 w-full">
                       <div className={`h-1 w-full rounded-full bg-gradient-to-r ${idx % 2 === 0 ? 'from-cyan-500/0 via-cyan-500/50 to-cyan-500/0' : 'from-violet-500/0 via-violet-500/50 to-violet-500/0'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    </div>
                  </div>
               </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};