import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Target, Zap, AlertCircle } from 'lucide-react';
import { apiClient, type PublicMetrics } from '../lib/api';

interface HeroProps {
  onJoin: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onJoin }) => {
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await apiClient.getPublicMetrics();
        setMetrics(data);
        setError('');
      } catch (err) {
        setError('Nu s-au putut încărca datele din baza de date');
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-16 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* Playful Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Circles */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-200/30 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-32 right-20 w-40 h-40 bg-purple-200/30 rounded-full blur-2xl animate-float-delayed"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-emerald-200/30 rounded-full blur-xl animate-pulse"></div>

        {/* Decorative Stars/Sparkles */}
        <div className="absolute top-32 right-32 text-yellow-400 animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute bottom-40 left-1/4 text-cyan-400 animate-bounce" style={{ animationDuration: '3s' }}>
          <Sparkles className="w-6 h-6" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">

        {/* Left Content - Friendly Messaging */}
        <div className="space-y-8 text-center lg:text-left">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 border-2 border-cyan-300 shadow-lg">
            <Zap className="w-4 h-4 text-cyan-600 animate-pulse" />
            <span className="text-cyan-700 text-sm font-bold">Învață. Investește. Câștigă.</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
            <span className="text-slate-800">Investește</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500">
              Inteligent
            </span>
            <br />
            <span className="text-slate-700 text-4xl md:text-5xl">cu Fiecare Pariu!</span>
          </h1>

          {/* Friendly Description */}
          <p className="text-xl text-slate-600 max-w-lg leading-relaxed mx-auto lg:mx-0">
            Transformă pasiunea pentru sport în <span className="font-bold text-blue-600">profit real</span>.
            Sistemul nostru inteligent te ghidează pas cu pas spre succes! 🎯
          </p>

          {/* CTA Button - Duolingo Style */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={onJoin}
              className="group relative px-8 py-4 bg-gradient-to-r from-emerald-400 to-cyan-500 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-b-4 border-emerald-600 hover:border-emerald-700 active:border-b-0 active:mt-1"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Începe Acum - E Gratuit!
                <Sparkles className="w-5 h-5 animate-pulse" />
              </span>
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>

            <button className="px-8 py-4 bg-white text-cyan-600 font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl border-2 border-cyan-200 hover:border-cyan-400 transition-all duration-300">
              Cum Funcționează?
            </button>
          </div>

          {/* Trust Badges with REAL DATA */}
          <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-6">
            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl shadow-md border border-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-500 font-medium">Precizie</div>
                <div className="text-sm font-bold text-slate-800">AI Smart Bets</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl shadow-md border border-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-500 font-medium">Performanță</div>
                {loading ? (
                  <div className="text-sm font-bold text-slate-400">Se încarcă...</div>
                ) : error ? (
                  <div className="text-sm font-bold text-red-500">Eroare</div>
                ) : (
                  <div className="text-sm font-bold text-slate-800">{metrics?.averageRoi || 'N/A'} ROI</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl shadow-md border border-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-500 font-medium">Rulaj</div>
                {loading ? (
                  <div className="text-sm font-bold text-slate-400">Se încarcă...</div>
                ) : error ? (
                  <div className="text-sm font-bold text-red-500">Eroare</div>
                ) : (
                  <div className="text-sm font-bold text-slate-800">{metrics?.totalStake || 'N/A'}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl shadow-md border border-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-500 font-medium">Profit</div>
                {loading ? (
                  <div className="text-sm font-bold text-slate-400">Se încarcă...</div>
                ) : error ? (
                  <div className="text-sm font-bold text-red-500">Eroare</div>
                ) : (
                  <div className="text-sm font-bold text-slate-800">{metrics?.totalProfit || 'N/A'}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl shadow-md border border-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-500 font-medium">Trades</div>
                {loading ? (
                  <div className="text-sm font-bold text-slate-400">Se încarcă...</div>
                ) : error ? (
                  <div className="text-sm font-bold text-red-500">Eroare</div>
                ) : (
                  <div className="text-sm font-bold text-slate-800">{metrics?.totalTrades || '0'}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl shadow-md border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-200 overflow-hidden">
                <img
                  src="https://yt3.googleusercontent.com/ytc/AIdro_mDPIl6elIWdI3OY39VPc0NOphdlol35EMVYXXnhL4KXA=s160-c-k-c0x00ffffff-no-rj"
                  alt="TradeMate Sports"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-500 font-medium">Partener</div>
                <div className="text-xs font-bold text-cyan-600">TradeMate Sports</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Playful Mascot & Illustration with REAL DATA */}
        <div className="relative hidden lg:block">

          {/* Main Character Card */}
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-4 border-slate-100 transform hover:scale-105 transition-all duration-500">

            {/* Error State */}
            {error && (
              <div className="absolute inset-0 bg-red-50/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-20 p-8">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-700 font-bold text-center">{error}</p>
                <p className="text-red-600 text-sm mt-2 text-center">Verifică conexiunea la baza de date</p>
              </div>
            )}

            {/* Mascot Owl Character */}
            <div className="text-center mb-6">
              <div className="inline-block relative">
                {/* Owl Face */}
                <div className="w-48 h-48 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mx-auto relative shadow-2xl">
                  {/* Eyes */}
                  <div className="absolute top-14 left-10 w-16 h-20 bg-white rounded-full shadow-inner"></div>
                  <div className="absolute top-14 right-10 w-16 h-20 bg-white rounded-full shadow-inner"></div>
                  {/* Pupils */}
                  <div className="absolute top-20 left-16 w-8 h-8 bg-slate-800 rounded-full animate-pulse"></div>
                  <div className="absolute top-20 right-16 w-8 h-8 bg-slate-800 rounded-full animate-pulse"></div>
                  {/* Beak */}
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-yellow-400"></div>
                  {/* Ear tufts */}
                  <div className="absolute -top-4 left-8 w-8 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full transform -rotate-12"></div>
                  <div className="absolute -top-4 right-8 w-8 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full transform rotate-12"></div>
                </div>

                {/* Graduation Cap */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-lg"></div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-28 h-2 bg-slate-700 rounded-full"></div>
                <div className="absolute -top-10 right-8 w-12 h-12 border-2 border-yellow-400"></div>
                <div className="absolute -top-8 right-10 w-2 h-2 bg-yellow-400 rounded-full"></div>

                {/* Floating coins */}
                <div className="absolute -right-4 top-8 w-10 h-10 bg-yellow-400 rounded-full shadow-lg flex items-center justify-center font-bold text-yellow-900 animate-bounce" style={{ animationDuration: '2s' }}>
                  €
                </div>
                <div className="absolute -left-4 bottom-8 w-12 h-12 bg-emerald-400 rounded-full shadow-lg flex items-center justify-center font-bold text-emerald-900 animate-float">
                  $
                </div>
              </div>

              {/* Name Badge */}
              <div className="mt-6 inline-block bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-2 rounded-full border-2 border-purple-300 shadow-md">
                <p className="text-purple-700 font-bold">Prof. Investino 🦉</p>
              </div>
            </div>

            {/* Stats Preview with REAL DATA */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-2xl border-2 border-emerald-200 text-center">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-emerald-300/50 rounded mb-2"></div>
                    <div className="h-3 bg-emerald-200/50 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-black text-emerald-600">{metrics?.equity || 'N/A'}</div>
                    <div className="text-xs text-emerald-700 font-medium mt-1">EUR în Fond</div>
                  </>
                )}
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-2xl border-2 border-cyan-200 text-center">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-cyan-300/50 rounded mb-2"></div>
                    <div className="h-3 bg-cyan-200/50 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-black text-cyan-600">{metrics?.investorCount || '0'}</div>
                    <div className="text-xs text-cyan-700 font-medium mt-1">Investitori</div>
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar with REAL DATA */}
            <div className="mt-6">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-medium text-slate-700">📈 Profit Luna Curentă</span>
                {loading ? (
                  <div className="h-3 w-16 bg-slate-300 rounded animate-pulse"></div>
                ) : (
                  <span className="font-bold text-emerald-600">{metrics?.monthProfitPct || 'N/A'}</span>
                )}
              </div>
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                {loading ? (
                  <div className="h-full bg-gradient-to-r from-slate-300 to-slate-400 rounded-full w-1/2 animate-pulse"></div>
                ) : (
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-green-500 to-cyan-500 rounded-full transition-all duration-1000"
                    style={{
                      width: metrics?.monthProfitPct
                        ? `${Math.min(parseFloat(metrics.monthProfitPct.replace('%', '').replace('+', '')), 100)}%`
                        : '0%',
                    }}
                  ></div>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 text-center">
                Progres față de obiectivul lunar (100%)
              </div>
            </div>
          </div>

          {/* Floating Achievement Badge */}
          <div className="absolute -top-6 -right-6 bg-yellow-400 rounded-2xl p-4 shadow-2xl border-4 border-yellow-500 transform rotate-12 hover:rotate-0 transition-transform duration-300">
            <div className="text-center">
              <div className="text-3xl">🏆</div>
              <div className="text-xs font-bold text-yellow-900 mt-1">TOP ROI</div>
            </div>
          </div>

          {/* Streak Badge - REPOSITIONED AGAIN to avoid text overlap */}
          <div className="absolute bottom-14 -left-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-4 shadow-2xl border-4 border-orange-600 animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="text-center">
              <div className="text-2xl">🔥</div>
              <div className="text-xs font-bold text-white mt-1">Live Data</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};