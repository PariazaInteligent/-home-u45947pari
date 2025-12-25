import React from 'react';
import { Hexagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  return (
    <footer className="bg-slate-950 pt-24 pb-12 relative overflow-hidden">
      {/* 3D Floor Grid Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-[linear-gradient(to_bottom,transparent_0%,#020617_100%),linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] [transform:perspective(500px)_rotateX(60deg)] origin-bottom opacity-50"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <Hexagon className="w-6 h-6 text-cyan-500" />
              <span className="font-display font-bold text-xl text-white">PARIAZĂ INTELIGENT</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Infrastructură profesională pentru investiții sportive.
              Transformăm haosul în ordine prin matematică, disciplină și transparență radicală.
            </p>
          </div>

          <div>
            <h4 className="text-cyan-400 font-bold mb-6 uppercase text-xs tracking-widest">Platformă</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><div onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer"><span className="w-1 h-1 bg-cyan-500 rounded-full"></span> Dashboard</div></li>
              <li><div onClick={() => navigate('/metodologie')} className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer"><span className="w-1 h-1 bg-cyan-500 rounded-full"></span> Metodologie</div></li>
              <li><div onClick={() => navigate('/rapoarte')} className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer"><span className="w-1 h-1 bg-cyan-500 rounded-full"></span> Rapoarte</div></li>
            </ul>
          </div>

          <div>
            <h4 className="text-cyan-400 font-bold mb-6 uppercase text-xs tracking-widest">Legal & Suport</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><div onClick={() => navigate('/termeni')} className="hover:text-white transition-colors cursor-pointer">Termeni și Condiții</div></li>
              <li><div onClick={() => navigate('/confidentialitate')} className="hover:text-white transition-colors cursor-pointer">Politica de Confidențialitate</div></li>
              <li><div onClick={() => navigate('/joc-responsabil')} className="hover:text-white transition-colors cursor-pointer">Joc Responsabil (18+)</div></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Pariază Inteligent. Toate drepturile rezervate.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-emerald-500 text-xs font-mono">SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};