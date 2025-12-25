import React from 'react';
import { TrendingUp, ShieldCheck, Crosshair, Cpu } from 'lucide-react';
import { Button3D } from './ui/Button3D';
import { usePublicStats } from '../hooks/usePublicStats';

interface HeroProps {
  onJoin: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onJoin }) => {
  const { metrics, loading, error } = usePublicStats();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden">
      {/* 3D Environment Background */}
      <div className="absolute inset-0 bg-slate-950">
        {/* Animated Perspective Grid Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[linear-gradient(to_bottom,transparent,rgba(6,182,212,0.1))]">
          <div className="w-full h-full bg-[size:4rem_4rem] bg-grid-pattern [transform:perspective(1000px)_rotateX(60deg)] origin-bottom animate-pulse-slow"></div>
        </div>

        {/* Rotating Orbital Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-cyan-500/10 rounded-full animate-spin-slow pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-violet-500/10 rounded-full animate-spin-reverse-slow pointer-events-none"></div>

        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] -z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-12 gap-12 items-center relative z-10">

        {/* Left Content (Text) */}
        <div className="lg:col-span-7 space-y-10">
          <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-cyan-300 text-xs font-display font-bold tracking-widest uppercase">Protocol Investițional v2.0</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <span className="text-white">PARIAZĂ</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">INTELIGENT</span>
          </h1>

          <div className="flex items-start gap-4 p-4 border-l-2 border-cyan-500/30 bg-gradient-to-r from-cyan-900/10 to-transparent">
            <p className="text-lg text-slate-300 max-w-xl leading-relaxed font-light">
              Primul <strong>Fond Descentralizat de Investiții</strong> în pariuri sportive.
              Algoritmi de <span className="text-cyan-300">Value Betting</span>, execuție disciplinată, zero emoții.
              Transformăm jocul de noroc într-o știință exactă.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Primary Action now triggers navigation via prop */}
            <div onClick={onJoin} className="cursor-pointer w-full sm:w-auto">
              <Button3D variant="cyan" className="w-full">Începe Investiția</Button3D>
            </div>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button3D variant="purple" className="w-full">Protocolul Nostru</Button3D>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-sm">
                <div className="text-slate-400 text-xs uppercase">Security</div>
                <div className="text-white font-bold">Transparență 100%</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded border border-cyan-500/20">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-sm">
                <div className="text-slate-400 text-xs uppercase">Technology</div>
                <div className="text-white font-bold">AI & Value Data</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Holographic HUD */}
        <div className="lg:col-span-5 relative perspective-1000 hidden lg:block">
          <div className="relative transform rotate-y-[-10deg] rotate-x-[5deg] transition-all duration-700 hover:rotate-0 hover:scale-105">

            {/* Holographic Container */}
            <div className="relative bg-slate-900/60 backdrop-blur-md border border-cyan-500/20 rounded-3xl p-1">
              {/* Decorative Lines */}
              <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-xl"></div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-violet-500/50 rounded-br-xl"></div>

              <div className="bg-slate-950/80 rounded-[1.4rem] p-6 border border-white/5 relative overflow-hidden">
                {/* Scanline */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] z-10 pointer-events-none opacity-50"></div>

                {/* Header HUD */}
                <div className="flex justify-between items-center mb-8 border-b border-cyan-500/20 pb-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <div className="text-xs font-mono text-cyan-400">LIVE_DATA_STREAM</div>
                  </div>
                  <div className="text-xs font-mono text-slate-500">ID: #8392-AX</div>
                </div>

                {/* Main Stats with Glow */}
                <div className="mb-8 relative">
                  <div className="absolute -inset-4 bg-cyan-500/10 blur-xl rounded-full"></div>
                  <div className="text-slate-400 text-xs uppercase mb-1 font-display tracking-widest">Balanță Fond</div>
                  <div className="text-4xl font-display font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {loading ? '...' : (metrics?.equity || "---")} <span className="text-lg text-cyan-400">EUR</span>
                  </div>
                  <div className="flex items-center mt-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 w-fit px-2 py-1 rounded border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4 mr-1" /> {metrics?.monthProfitPct || "N/A"} Profit Luna Curentă
                  </div>
                </div>

                {/* Secondary Data Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-900 p-3 rounded-lg border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-cyan-500/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <div className="text-[10px] text-slate-500 uppercase">Profit Total</div>
                    <div className="text-xl font-bold text-cyan-300">
                      {loading ? '...' : (metrics?.totalProfit || "---")}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-violet-500/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <div className="text-[10px] text-slate-500 uppercase">ROI Mediu</div>
                    <div className="text-xl font-bold text-violet-300">
                      {loading ? '...' : (metrics?.averageRoi || "N/A")}
                    </div>
                  </div>
                </div>

                {/* Live Feed */}
                <div className="space-y-2">
                  <div className="text-[10px] text-cyan-500/70 uppercase tracking-widest mb-2 border-b border-cyan-500/10 pb-1">Incoming Signals</div>
                  {(metrics?.signals?.slice(0, 3) || []).map((signal, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded border border-white/5 hover:border-cyan-500/30 transition-colors cursor-default">
                      <span className="text-slate-300 flex items-center gap-2">
                        <Crosshair className="w-3 h-3 text-cyan-500" />
                        {signal.label}
                      </span>
                      <span className="font-mono text-emerald-400">CONFIRMED</span>
                    </div>
                  ))}
                  {(!metrics?.signals || metrics.signals.length === 0) && (
                    <div className="text-xs text-slate-500 p-2 italic">Awaiting signals...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -right-8 top-20 bg-slate-800/90 border border-violet-500/40 p-3 rounded-xl shadow-lg backdrop-blur text-center animate-float-delayed">
              <div className="text-xs text-slate-400 uppercase">Investitori</div>
              <div className="text-xl font-bold text-violet-300">
                {loading ? '...' : (metrics?.investorCount || "---")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};