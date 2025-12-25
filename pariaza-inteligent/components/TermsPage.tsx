import React from 'react';
import { ArrowLeft, FileText, CheckCircle, Shield } from 'lucide-react';

interface TermsPageProps {
    onBack: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 z-0 rounded-b-[50px] shadow-2xl"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 text-purple-200 hover:text-white transition-colors mb-6 font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/20"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Înapoi la Platformă
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-playful rotate-3">
                            <FileText className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                            Termeni și Condiții
                        </h1>
                    </div>
                    <p className="text-xl text-indigo-100 max-w-2xl font-medium">
                        Regulile jocului pentru o comunitate de investitori inteligenți și transparenți.
                    </p>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-b-8 border-indigo-100 animate-slide-up">
                    <div className="space-y-10 text-slate-700 leading-relaxed">

                        <section>
                            <h2 className="text-2xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                <span className="text-3xl">🤝</span> 1. Introducere
                            </h2>
                            <p className="mb-4">
                                Bine ai venit pe platforma <strong>Pariază Inteligent</strong>. Prin accesarea și utilizarea acestui site, ești de acord cu termenii și condițiile descrise mai jos. Scopul nostru este să oferim educație și transparență în domeniul investițiilor sportive.
                            </p>
                            <div className="bg-indigo-50 p-4 rounded-xl border-l-4 border-indigo-500 text-indigo-800 font-medium text-sm">
                                Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                <span className="text-3xl">🎓</span> 2. Natura Serviciilor
                            </h2>
                            <p className="mb-4">
                                Platforma oferă acces la strategii matematice, analize de date și un jurnal transparent al investițiilor. Nu suntem un site de jocuri de noroc și nu facilităm plasarea directă de pariuri.
                            </p>
                            <ul className="space-y-2 ml-2">
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                    <span>Oferim educație financiară aplicată în pariuri sportive.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                    <span>Toate datele prezentate sunt reale și verificate (ROI, Yield).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                    <span>Promovăm responsabilitatea și disciplina.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                <span className="text-3xl">⚠️</span> 3. Avertisment de Risc
                            </h2>
                            <p>
                                Investițiile în pariuri sportive implică riscuri financiare. Performanțele trecute nu garantează rezultate viitoare. Recomandăm utilizatorilor să aloce doar fonduri pe care își permit să le piardă și să trateze această activitate ca pe o invesție pe termen lung, nu o metodă de îmbogățire rapidă.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                <span className="text-3xl">💎</span> 4. Abonamente și Plăți
                            </h2>
                            <p>
                                Accesul la secțiunile premium și la comunitatea Telegram se face pe bază de abonament. Plățile sunt procesate securizat prin partenerii noștri (Stripe/Netopia). Politica de refund este valabilă timp de 14 zile conform legislației UE, cu condiția neutilizării serviciilor digitale.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                <span className="text-3xl">⚖️</span> 5. Drepturi de Autor
                            </h2>
                            <p>
                                Toate materialele (strategii, ghiduri, cod sursă, branding Prof. Investino) sunt proprietatea intelectuală a Pariază Inteligent. Reproducerea sau distribuirea neautorizată este strict interzisă.
                            </p>
                        </section>

                    </div>
                </div>

                {/* Footer Note */}
                <div className="text-center mt-12 text-slate-400 text-sm">
                    <p>© {new Date().getFullYear()} Pariază Inteligent. Toate drepturile rezervate.</p>
                </div>
            </div>
        </div>
    );
};
