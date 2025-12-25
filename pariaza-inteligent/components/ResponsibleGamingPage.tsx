import React from 'react';
import { ArrowLeft, AlertTriangle, Heart, Scale, ShieldCheck } from 'lucide-react';

interface ResponsibleGamingPageProps {
    onBack: () => void;
}

export const ResponsibleGamingPage: React.FC<ResponsibleGamingPageProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-amber-50 relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-amber-700 via-orange-800 to-red-900 z-0 rounded-b-[50px] shadow-2xl"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 text-amber-100 hover:text-white transition-colors mb-6 font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/20"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Înapoi la Platformă
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-playful rotate-3">
                            <Heart className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                            Joc Responsabil
                        </h1>
                    </div>
                    <p className="text-xl text-amber-100 max-w-2xl font-medium">
                        Pariurile trebuie să rămână o formă de investiție controlată, nu o problemă.
                    </p>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-b-8 border-amber-100 animate-slide-up">

                    <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 mb-10 flex items-start gap-4">
                        <div className="bg-red-100 p-3 rounded-full">
                            <span className="text-2xl">🔞</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-800 mb-1">Interzis Minorilor</h3>
                            <p className="text-red-700 text-sm">
                                Accesul pe această platformă și participarea la activități de pariere sunt strict interzise persoanelor sub 18 ani.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-10 text-slate-700 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Scale className="w-6 h-6 text-amber-600" /> 1. Disciplină și Control
                            </h2>
                            <p className="mb-4">
                                Filozofia <strong>Pariază Inteligent</strong> se bazează pe disciplină matematică. Jocul responsabil înseamnă:
                            </p>
                            <ul className="grid gap-3 font-medium text-slate-600">
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Pariază doar banii pe care îți permiți să îi pierzi.
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Nu paria niciodată pentru a recupera pierderile ("Chase").
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Stabilește limite de timp și de buget clare.
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Nu paria sub influența alcoolului sau a stărilor emoționale puternice.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-amber-600" /> 2. Semne ale Dependenței
                            </h2>
                            <p className="mb-4">
                                Dacă observi următoarele comportamente la tine sau la cineva drag, este timpul să iei măsuri:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <span className="text-2xl block mb-2">😰</span>
                                    <p className="text-sm font-bold text-slate-700">Anxietate sau iritabilitate când nu poți paria.</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <span className="text-2xl block mb-2">🤥</span>
                                    <p className="text-sm font-bold text-slate-700">Ascunderea pierderilor față de familie.</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <span className="text-2xl block mb-2">💸</span>
                                    <p className="text-sm font-bold text-slate-700">Împrumutarea banilor pentru a paria.</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <span className="text-2xl block mb-2">📉</span>
                                    <p className="text-sm font-bold text-slate-700">Neglijarea muncii sau a familiei.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-amber-600" /> 3. Unde ceri ajutor?
                            </h2>
                            <p className="mb-4">
                                Nu ești singur. Există organizații specializate care oferă ajutor gratuit și confidențial:
                            </p>
                            <div className="flex flex-col gap-3">
                                <a href="https://jocresponsabil.ro" target="_blank" rel="noopener noreferrer" className="block bg-blue-50 hover:bg-blue-100 transition-colors p-4 rounded-xl border border-blue-200 text-blue-800 font-bold flex items-center justify-between group">
                                    <span>🔵 JocResponsabil.ro (România)</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </a>
                                <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer" className="block bg-slate-50 hover:bg-slate-100 transition-colors p-4 rounded-xl border border-slate-200 text-slate-800 font-bold flex items-center justify-between group">
                                    <span>🌍 GamCare (International)</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </a>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};
