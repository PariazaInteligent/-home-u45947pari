import React from 'react';
import { ArrowLeft, Lock, Shield, Eye, Database } from 'lucide-react';

interface PrivacyPageProps {
    onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-emerald-50 relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 z-0 rounded-b-[50px] shadow-2xl"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 text-emerald-100 hover:text-white transition-colors mb-6 font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/20"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Înapoi la Platformă
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-playful rotate-3">
                            <Lock className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                            Confidențialitate
                        </h1>
                    </div>
                    <p className="text-xl text-emerald-100 max-w-2xl font-medium">
                        Datele tale sunt în siguranță. Transparență totală în privința a ceea ce colectăm.
                    </p>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-b-8 border-emerald-100 animate-slide-up">
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-slate-50 p-6 rounded-2xl text-center border-2 border-slate-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">👤</div>
                            <h3 className="font-bold text-slate-800 mb-2">Date Personale</h3>
                            <p className="text-sm text-slate-600">Nume, email și telefon pentru contul tău.</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl text-center border-2 border-slate-100">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">💳</div>
                            <h3 className="font-bold text-slate-800 mb-2">Plăți Securizate</h3>
                            <p className="text-sm text-slate-600">Nu stocăm datele cardului tău bancar.</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl text-center border-2 border-slate-100">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🍪</div>
                            <h3 className="font-bold text-slate-800 mb-2">Cookies</h3>
                            <p className="text-sm text-slate-600">Pentru o experiență de navigare fluidă.</p>
                        </div>
                    </div>

                    <div className="space-y-10 text-slate-700 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                                <Database className="w-6 h-6" /> 1. Ce date colectăm?
                            </h2>
                            <p>
                                Colectăm informații strict necesare pentru funcționarea contului tău: adresa de email (pentru autentificare și notificări legate de investiții), numele complet (pentru personalizarea experienței) și istoricul tranzacțiilor pe platformă.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                                <Shield className="w-6 h-6" /> 2. Cum protejăm datele?
                            </h2>
                            <p>
                                Utilizăm criptare SSL de ultimă generație pentru toate transmisiile de date. Parolele sunt stocate folosind hashing (bcrypt), iar baza de date este protejată de firewall-uri stricte și backup-uri regulate.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
                                <Eye className="w-6 h-6" /> 3. Cine are acces?
                            </h2>
                            <p>
                                Datele tale nu sunt vândute niciodată terților. Accesul la date este limitat doar administratorilor platformei în scopuri de suport tehnic și mentenanță.
                            </p>
                        </section>

                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mt-8">
                            <h3 className="font-bold text-emerald-800 mb-2">GDPR și Drepturile Tale</h3>
                            <p className="text-sm text-emerald-700">
                                Ai dreptul de a solicita oricând ștergerea completă a datelor tale ("Dreptul de a fi uitat"). Trimite un email la contact@pariazainteligent.ro și ne vom ocupa imediat.
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
