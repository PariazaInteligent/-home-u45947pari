import React from 'react';
import { Users, MessageCircle, Heart, Sparkles } from 'lucide-react';

export const Community: React.FC = () => {
   return (
      <section id="community" className="py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 relative overflow-hidden">
         {/* Playful Background */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-10 right-20 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl animate-float-delayed"></div>
            <div className="absolute top-1/3 right-10 text-yellow-400 animate-pulse">
               <Sparkles className="w-12 h-12" />
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
               {/* Left Side: Content */}
               <div>
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-bold text-sm mb-6 shadow-lg">
                     <Users className="w-5 h-5" />
                     <span>Comunitate Activă</span>
                  </div>

                  <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                     Inteligență{' '}
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        Colectivă
                     </span>
                     {' '}🧠
                  </h2>

                  <p className="text-gray-700 text-xl mb-8 leading-relaxed border-l-4 border-purple-400 pl-6">
                     Investițiile nu trebuie să fie solitare! Comunitatea noastră oferă suport psihologic, educație financiară și validare strategică.
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-8 mb-10">
                     <div className="text-center bg-white rounded-2xl p-6 shadow-playful flex-1">
                        <div className="text-4xl font-bold text-purple-600 font-display mb-1">62+</div>
                        <div className="text-sm text-gray-600 font-bold">Investitori Activi</div>
                     </div>
                     <div className="text-center bg-white rounded-2xl p-6 shadow-playful flex-1">
                        <div className="text-4xl font-bold text-pink-600 font-display mb-1">24/7</div>
                        <div className="text-sm text-gray-600 font-bold">Suport Live</div>
                     </div>
                  </div>

                  {/* Bottom Benefits */}
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border-4 border-purple-200">
                     <div className="flex items-center gap-3 mb-3">
                        <Heart className="w-6 h-6 text-pink-500" />
                        <h4 className="font-bold text-gray-900">Ce primești în comunitate:</h4>
                     </div>
                     <ul className="space-y-2 text-gray-700">
                        <li className="flex items-center gap-2">
                           <span className="text-green-500 font-bold">✓</span>
                           <span>Acces la strategii validate de comunitate</span>
                        </li>
                        <li className="flex items-center gap-2">
                           <span className="text-green-500 font-bold">✓</span>
                           <span>Suport psihologic în perioade grele</span>
                        </li>
                        <li className="flex items-center gap-2">
                           <span className="text-green-500 font-bold">✓</span>
                           <span>Educație financiară continuă</span>
                        </li>
                     </ul>
                  </div>
               </div>

               {/* Right Side: Playful Chat Interface */}
               <div className="relative">
                  <div className="bg-white rounded-[2.5rem] shadow-playful-lg p-2 border-4 border-purple-200">
                     <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-[2rem] overflow-hidden">
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 text-white">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-3 h-3 rounded-full bg-white shadow-lg animate-pulse"></div>
                                 <span className="font-bold">💬 Lobby Investitori</span>
                              </div>
                              <div className="text-sm bg-white/20 px-3 py-1 rounded-full">Online: 24</div>
                           </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="p-6 space-y-4 min-h-[400px] bg-white/50">
                           {/* Message 1 */}
                           <div className="flex items-start gap-3 animate-slide-in-bottom">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg text-lg">
                                 🦉
                              </div>
                              <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-md max-w-[80%] border-2 border-blue-100">
                                 <div className="text-blue-600 text-xs font-bold mb-1">Prof. Investino</div>
                                 <p className="text-gray-800 text-sm">
                                    Bună dimineața! Astăzi avem 3 value bets identificate pe tenis 🎾
                                 </p>
                              </div>
                           </div>

                           {/* Message 2 */}
                           <div className="flex items-start gap-3 flex-row-reverse animate-slide-in-bottom" style={{ animationDelay: '0.2s' }}>
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                                 IM
                              </div>
                              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl rounded-tr-none p-4 shadow-md max-w-[80%] border-2 border-purple-200 text-right">
                                 <div className="text-purple-600 text-xs font-bold mb-1">Investor M.</div>
                                 <p className="text-gray-800 text-sm">
                                    Perfect! Strategia de ieri a adus +8.5% ROI 📈
                                 </p>
                              </div>
                           </div>

                           {/* Message 3 */}
                           <div className="flex items-start gap-3 animate-slide-in-bottom" style={{ animationDelay: '0.4s' }}>
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white font-bold shadow-lg">
                                 AD
                              </div>
                              <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-md max-w-[80%] border-2 border-green-100">
                                 <div className="text-green-600 text-xs font-bold mb-1">Admin</div>
                                 <p className="text-gray-800 text-sm">
                                    Rămâneți concentrați pe termen lung! 💪 Disciplina face diferența.
                                 </p>
                              </div>
                           </div>

                           {/* Typing Indicator */}
                           <div className="flex items-center gap-2 text-gray-500 text-sm animate-pulse">
                              <MessageCircle className="w-4 h-4" />
                              <span>3 persoane scriu...</span>
                           </div>
                        </div>

                        {/* Chat Input */}
                        <div className="px-6 pb-6">
                           <div className="bg-white rounded-2xl border-2 border-purple-200 p-4 flex items-center gap-3 shadow-md">
                              <span className="text-2xl">😊</span>
                              <div className="flex-1 text-gray-400 text-sm">Scrie un mesaj prietenos...</div>
                              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:shadow-lg transition-all">
                                 Trimite
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Floating Achievement Badge */}
                  <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-playful-lg px-4 py-3 flex items-center gap-2 border-4 border-yellow-300 animate-bounce-slow">
                     <div className="text-3xl">🎉</div>
                     <div>
                        <div className="text-xs text-gray-600 font-bold">Comunitate Activă</div>
                        <div className="text-sm font-bold text-purple-600">24/7 Support</div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
   );
};