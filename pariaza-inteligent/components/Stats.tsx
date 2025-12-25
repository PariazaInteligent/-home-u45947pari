import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Sparkles, Zap, Trophy, Target, AlertCircle, Copy, Check } from 'lucide-react';
import { apiClient, type PublicMetrics } from '../lib/api';

// Sport emoji mapping
const getSportEmoji = (sport: string): string => {
   const sportLower = sport.toLowerCase();
   if (sportLower.includes('fotbal') || sportLower.includes('football') || sportLower.includes('soccer')) return '⚽';
   if (sportLower.includes('baschet') || sportLower.includes('basketball')) return '🏀';
   if (sportLower.includes('tenis') || sportLower.includes('tennis')) return '🎾';
   if (sportLower.includes('hochei') || sportLower.includes('hockey')) return '🏒';
   if (sportLower.includes('box')) return '🥊';
   if (sportLower.includes('baseball')) return '⚾';
   if (sportLower.includes('volei') || sportLower.includes('volleyball')) return '🏐';
   return '🏆';
};

// Status badge component
const StatusBadge: React.FC<{ status: string; isLive: boolean }> = ({ status, isLive }) => {
   if (isLive) {
      return (
         <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            🔴 LIVE
         </span>
      );
   }

   const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏳ Pending' },
      'SETTLED_WIN': { bg: 'bg-green-100', text: 'text-green-700', label: '✅ Câștigat' },
      'SETTLED_LOSS': { bg: 'bg-red-100', text: 'text-red-700', label: '❌ Pierdut' },
      'SETTLED_VOID': { bg: 'bg-blue-100', text: 'text-blue-700', label: '🔄 Void' },
      'CANCELLED': { bg: 'bg-gray-100', text: 'text-gray-gray-700', label: '🚫 Anulat' }
   };

   const config = statusConfig[status] || statusConfig['PENDING'];

   return (
      <span className={`inline-flex items-center gap-1 ${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-bold`}>
         {config.label}
      </span>
   );
};

// Copy button component
const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => {
   const [copied, setCopied] = useState(false);

   const handleCopy = async () => {
      try {
         await navigator.clipboard.writeText(text);
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
      } catch (err) {
         console.error('Failed to copy:', err);
      }
   };

   return (
      <button
         onClick={handleCopy}
         className="inline-flex items-center gap-1 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 px-3 py-1 rounded-lg text-xs font-medium transition-all transform hover:scale-105"
         title={`Copiază ${label}`}
      >
         {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
         <span className="font-mono">{text}</span>
      </button>
   );
};

export const Stats: React.FC = () => {
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
            setError('Nu s-au putut încărca statisticile');
            console.error('Error fetching stats:', err);
         } finally {
            setLoading(false);
         }
      };

      fetchMetrics();
      const interval = setInterval(fetchMetrics, 30000);
      return () => clearInterval(interval);
   }, []);

   // Format date
   const formatDate = (dateString: string | null): string => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString('ro-RO', {
         day: '2-digit',
         month: '2-digit',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      });
   };

   // Skeleton pentru loading
   if (loading) {
      return (
         <section className="py-24 bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
               <div className="text-center mb-16">
                  <div className="h-12 bg-gray-200 rounded-2xl w-64 mx-auto mb-4 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded-xl w-96 mx-auto animate-pulse"></div>
               </div>
               <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                     <div key={i} className="bg-white rounded-3xl p-8 shadow-lg animate-pulse">
                        <div className="h-8 bg-gray-200 rounded-xl w-24 mb-4"></div>
                        <div className="h-12 bg-gray-200 rounded-xl w-32 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-40"></div>
                     </div>
                  ))}
               </div>
            </div>
         </section>
      );
   }

   return (
      <section id="stats" className="py-24 bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden">
         {/* Playful Background Elements */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-40 h-40 bg-yellow-200/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-purple-200/20 rounded-full blur-2xl animate-float-delayed"></div>
            <div className="absolute top-1/2 right-1/3 text-yellow-300 animate-pulse">
               <Sparkles className="w-12 h-12" />
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-6 relative z-10">
            {/* Header Section */}
            <div className="text-center mb-16">
               <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-2 rounded-full font-bold text-sm mb-6 shadow-lg animate-bounce-slow">
                  <Trophy className="w-5 h-5" />
                  <span>Performanță în Timp Real</span>
               </div>
               <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
                  Statistici <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Live</span> 📊
               </h2>
               <p className="text-gray-600 text-xl max-w-2xl mx-auto">
                  Urmărește creșterea fondului și profiturile în timp real!
               </p>
            </div>

            {/* Error State */}
            {error && (
               <div className="bg-red-100 border-4 border-red-300 rounded-3xl p-8 mb-12 text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-red-700 mb-2">Oops! 😕</h3>
                  <p className="text-red-600">{error}</p>
               </div>
            )}

            {/* Stats Cards Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
               {/* Card 1: Equity */}
               <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-8 shadow-playful text-white transform hover:scale-105 transition-transform group">
                  <div className="flex items-start justify-between mb-4">
                     <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                        <TrendingUp className="w-8 h-8" />
                     </div>
                     <span className="text-sm font-bold bg-white/30 px-3 py-1 rounded-full">EUR</span>
                  </div>
                  <div className="text-sm font-bold uppercase opacity-90 mb-2">💰 În Fond</div>
                  <div className="text-4xl font-bold mb-2">
                     {metrics?.equity || 'N/A'}
                  </div>
                  <div className="text-sm opacity-80 flex items-center gap-1">
                     <Sparkles className="w-4 h-4" />
                     {metrics?.equityGrowth || 'N/A'}
                  </div>
               </div>

               {/* Card 2: Investors */}
               <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl p-8 shadow-playful text-white transform hover:scale-105 transition-transform group">
                  <div className="flex items-start justify-between mb-4">
                     <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                        <Users className="w-8 h-8" />
                     </div>
                     <span className="text-sm font-bold bg-white/30 px-3 py-1 rounded-full">Activi</span>
                  </div>
                  <div className="text-sm font-bold uppercase opacity-90 mb-2">👥 Investitori</div>
                  <div className="text-4xl font-bold mb-2">
                     {metrics?.investorCount || 0}
                  </div>
                  <div className="text-sm opacity-80 flex items-center gap-1">
                     <Target className="w-4 h-4" />
                     Membrii verificați
                  </div>
               </div>

               {/* Card 3: ROI */}
               <div className="bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl p-8 shadow-playful text-white transform hover:scale-105 transition-transform group">
                  <div className="flex items-start justify-between mb-4">
                     <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                        <Zap className="w-8 h-8" />
                     </div>
                     <span className="text-sm font-bold bg-white/30 px-3 py-1 rounded-full">AVG</span>
                  </div>
                  <div className="text-sm font-bold uppercase opacity-90 mb-2">📈 ROI Mediu</div>
                  <div className="text-4xl font-bold mb-2">
                     {metrics?.averageRoi || 'N/A'}
                  </div>
                  <div className="text-sm opacity-80 flex items-center gap-1">
                     <Trophy className="w-4 h-4" />
                     {metrics?.totalProfit || 'N/A'}
                  </div>
               </div>
            </div>

            {/* Recent TRADES Section */}
            {metrics?.signals && metrics.signals.length > 0 && (
               <div className="bg-white rounded-3xl shadow-playful-lg p-8">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Zap className="w-7 h-7 text-yellow-500" />
                        Trade-uri Recente 🎯
                     </h3>
                     <span className="bg-gradient-to-r from-emerald-400 to-green-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        Live
                     </span>
                  </div>

                  {(() => {
                     // Filter valid trades only
                     const validTrades = metrics.signals.filter(trade => trade?.id && trade?.sport && trade?.event);

                     if (validTrades.length === 0) {
                        return (
                           <div className="text-center py-12">
                              <div className="text-6xl mb-4">📊</div>
                              <h4 className="text-xl font-bold text-gray-700 mb-2">Niciun Trade Încă</h4>
                              <p className="text-gray-500">Trade-urile recente vor apărea aici automat.</p>
                           </div>
                        );
                     }

                     return (
                        <>
                           <div className="space-y-4">
                              {validTrades.map((trade) => (
                                 <div
                                    key={trade.id}
                                    className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-lg transition-all transform hover:scale-[1.02]"
                                 >
                                    {/* Header Row */}
                                    <div className="flex items-center justify-between mb-3">
                                       <div className="flex items-center gap-2">
                                          <span className="text-3xl">{getSportEmoji(trade.sport)}</span>
                                          <div>
                                             <span className="text-sm text-gray-500 font-medium">{trade.sport}</span>
                                             <h4 className="text-lg font-bold text-gray-900">{trade.event}</h4>
                                          </div>
                                       </div>
                                       <StatusBadge status={trade.status} isLive={trade.isLive} />
                                    </div>

                                    {/* Event Time */}
                                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                                       <span>🕐</span>
                                       <span className="font-medium">Eveniment:</span>
                                       <span>{formatDate(trade.eventStartTime)}</span>
                                    </div>

                                    {/* Trade Details */}
                                    <div className="bg-purple-50 rounded-xl p-3 mb-3">
                                       <div className="flex flex-wrap items-center gap-4 text-sm">
                                          <div className="flex items-center gap-1">
                                             <span className="font-bold text-purple-700">📊 Market:</span>
                                             <span className="text-gray-700">{trade.market}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                             <span className="font-bold text-purple-700">🎯 Selecție:</span>
                                             <span className="text-gray-700">{trade.selection}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                             <span className="font-bold text-purple-700">📈 Cotă:</span>
                                             <span className="text-gray-900 font-bold text-base">{trade.odds.toFixed(2)}</span>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Financial Row */}
                                    <div className="flex flex-wrap items-center gap-6 mb-4">
                                       <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-gray-600">💰 Miză:</span>
                                          <span className="text-lg font-bold text-gray-900">{trade.stake.toLocaleString('de-DE')} EUR</span>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-gray-600">💵 Profit:</span>
                                          <span className={`text-lg font-bold ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                             {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toLocaleString('de-DE')} EUR
                                          </span>
                                       </div>
                                       <div className={`px-3 py-1 rounded-lg ${trade.pnl >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                          <span className="text-xs font-bold text-gray-600">ROI:</span>
                                          <span className={`ml-1 text-sm font-bold ${trade.pnl >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                             {trade.roi}%
                                          </span>
                                       </div>
                                    </div>

                                    {/* Footer Row */}
                                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-200">
                                       <CopyButton text={trade.id.substring(0, 8)} label="Trade ID" />
                                       {trade.betCode && <CopyButton text={trade.betCode} label="Bet Code" />}
                                       {trade.bookmaker && (
                                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold">
                                             🏛️ {trade.bookmaker}
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              ))}
                           </div>

                           {/* Achievement Badge */}
                           <div className="mt-8 bg-gradient-to-r from-yellow-100 to-orange-100 border-4 border-yellow-300 rounded-3xl p-6 text-center">
                              <div className="text-5xl mb-2">🏆</div>
                              <h4 className="text-xl font-bold text-gray-900 mb-1">Performanță Constantă!</h4>
                              <p className="text-gray-700">
                                 Fondul a generat <span className="font-bold text-green-600">{metrics.totalProfit}</span> profit total
                              </p>
                           </div>
                        </>
                     );
                  })()}
               </div>
            )}
         </div>
      </section>
   );
};