import React from 'react';
import { ChevronRight, CheckCircle2, Lock } from 'lucide-react';
import { Button3D } from './ui/Button3D';
import { TiltCard } from './ui/TiltCard';

interface CTAProps {
  onJoin: () => void;
}

export const CTA: React.FC<CTAProps> = ({ onJoin }) => {
  return (
    <section id="start" className="py-32 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background Deep Tunnel */}
      <div className="absolute inset-0 bg-slate-950">
          <div className="absolute bottom-0 left-0 right-0 h-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]"></div>
          {/* Grid Floor */}
          <div className="absolute bottom-0 w-full h-1/2 bg-grid-pattern [transform:perspective(500px)_rotateX(60deg)] opacity-30 origin-bottom"></div>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 w-full text-center">
        <TiltCard glowColor="cyan" className="p-12 md:p-20 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl">
           <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-6">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              <span>Secure Gateway</span>
           </div>

           <h2 className="text-5xl md:text-6xl font-display font-bold text-white leading-tight mb-8">
              EȘTI PREGĂTIT SĂ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">INTRI ÎN PROTOCOL?</span>
           </h2>

           <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-12">
             Accesul este limitat și se face pe bază de înregistrare. Datele sunt procesate pe un server securizat, separat de interfața publică.
           </p>
           
           <div onClick={onJoin} className="cursor-pointer inline-block w-full sm:w-auto">
             <Button3D variant="cyan" className="w-full sm:min-w-[250px] text-lg py-5">
               <span className="flex items-center justify-center gap-3">
                 INIȚIAZĂ APLICAȚIA <ChevronRight className="w-5 h-5" />
               </span>
             </Button3D>
           </div>

           <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-slate-500 font-mono">
              <div className="flex items-center gap-2">
                 <Lock className="w-4 h-4" /> SSL Encrypted
              </div>
              <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4" /> Verified Only
              </div>
           </div>
        </TiltCard>
      </div>
    </section>
  );
};