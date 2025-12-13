import React from 'react';
import { Users, MessageSquare, Mic } from 'lucide-react';
import { TiltCard } from './ui/TiltCard';

export const Community: React.FC = () => {
  return (
    <section id="community" className="py-32 bg-slate-950 relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-violet-600/10 blur-[150px] -translate-y-1/2 rounded-full"></div>
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-cyan-600/10 blur-[150px] -translate-y-1/2 rounded-full"></div>

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        
        <div>
           <div className="inline-flex items-center gap-2 text-violet-400 font-mono text-xs mb-4 border border-violet-500/30 px-3 py-1 rounded-full bg-violet-900/10">
              <Users className="w-3 h-3" />
              COMMUNITY_HUB
           </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">
            Inteligență <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Colectivă</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed border-l-4 border-violet-500/30 pl-6">
            Pariurile nu trebuie să fie o activitate solitară. Accesul în comunitate îți oferă suport psihologic, educație financiară și validarea strategiilor.
          </p>
          
          <div className="flex items-center gap-8 mb-10">
             <div className="text-center">
                <div className="text-3xl font-bold text-white font-display">150+</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Investitori</div>
             </div>
             <div className="w-px h-12 bg-white/10"></div>
             <div className="text-center">
                <div className="text-3xl font-bold text-white font-display">24/7</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Suport Activ</div>
             </div>
          </div>
        </div>

        {/* Holographic Chat Interface */}
        <div className="relative">
            {/* Base Stand for Hologram */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-slate-900 rounded-[100%] blur-xl opacity-80"></div>
            
            <TiltCard glowColor="purple" noPadding className="min-h-[500px] flex flex-col">
               {/* Window Header */}
               <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                     <span className="font-display font-bold text-sm text-slate-200">INVESTORS_LOBBY</span>
                  </div>
                  <div className="flex gap-2">
                     <div className="w-8 h-1 bg-white/10 rounded-full"></div>
                     <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                  </div>
               </div>

               {/* Chat Area */}
               <div className="flex-1 p-6 space-y-6 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/20 pointer-events-none"></div>

                  {/* Message 1 */}
                  <div className="flex items-start gap-4 animate-float">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-cyan-400 shadow-lg">IM</div>
                    <div className="bg-slate-800/80 backdrop-blur border border-white/10 p-4 rounded-2xl rounded-tl-none shadow-xl max-w-[80%]">
                      <div className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-1">Investitor M.</div>
                      <p className="text-slate-300 text-sm">Strategia pe tenis de ieri a fost incredibilă. Disciplina chiar face diferența.</p>
                    </div>
                  </div>

                  {/* Message 2 */}
                  <div className="flex items-start gap-4 flex-row-reverse animate-float-delayed">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/50 flex items-center justify-center text-xs font-bold text-violet-300 shadow-lg">AD</div>
                    <div className="bg-violet-900/20 backdrop-blur border border-violet-500/20 p-4 rounded-2xl rounded-tr-none shadow-xl max-w-[80%] text-right">
                      <div className="text-violet-300 text-[10px] font-bold uppercase tracking-wider mb-1">Admin</div>
                      <p className="text-slate-200 text-sm">Corect. Cheia este volumul de pariuri, nu rezultatul unui singur bilet. Rămâneți concentrați pe termen lung.</p>
                    </div>
                  </div>
               </div>

               {/* Input Area */}
               <div className="p-4 border-t border-white/5 bg-slate-900/30">
                  <div className="flex gap-2 items-center bg-slate-950/50 border border-white/10 rounded-lg p-2 px-4">
                     <Mic className="w-4 h-4 text-slate-600" />
                     <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-violet-500/30 animate-pulse"></div>
                     </div>
                     <MessageSquare className="w-4 h-4 text-slate-600" />
                  </div>
               </div>
            </TiltCard>
        </div>
      </div>
    </section>
  );
};