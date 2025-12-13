import React from 'react';
import { Clock } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  Icon: React.ElementType;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, Icon }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border border-white/10 mb-6 shadow-2xl relative group">
         <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/30 transition-all"></div>
         <Icon className="w-10 h-10 text-cyan-400 relative z-10" />
      </div>
      <h2 className="text-3xl font-display font-bold text-white mb-3">{title}</h2>
      <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed mb-8">{description}</p>
      
      <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full text-yellow-500 text-sm font-bold animate-pulse">
         <Clock className="w-4 h-4" /> Coming Soon
      </div>
      
      <div className="mt-4 flex items-center gap-2 text-xs font-mono text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded border border-cyan-500/20">
           <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
           MODULE_UNDER_CONSTRUCTION
      </div>
    </div>
  );
};