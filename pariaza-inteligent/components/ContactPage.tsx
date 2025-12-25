import React, { useState } from 'react';
import { ArrowLeft, Mail, Send, Clock, MapPin, MessageCircle, AlertCircle, Loader } from 'lucide-react';
import { apiClient } from '../lib/api';

interface ContactPageProps {
    onBack: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'Suport General',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.sendContactMessage(formData);

            if (response.success) {
                setSubmitted(true);
                setFormData({ name: '', email: '', subject: 'Suport General', message: '' });
            } else {
                setError(response.message || 'Eroare la trimiterea mesajului');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'A apărut o eroare. Te rugăm să încerci din nou.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cyan-50 relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-900 z-0 rounded-b-[50px] shadow-2xl"></div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 text-cyan-100 hover:text-white transition-colors mb-6 font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/20"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Înapoi la Platformă
                    </button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-playful rotate-3">
                            <Mail className="w-8 h-8 text-cyan-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                            Contactează-ne
                        </h1>
                    </div>
                    <p className="text-xl text-cyan-100 max-w-2xl font-medium">
                        Ai o întrebare sau vrei să colaborăm? Prof. Investino și echipa sunt aici pentru tine.
                    </p>
                </div>

                <div className="grid md:grid-cols-5 gap-8">

                    {/* Contact Form Card */}
                    <div className="md:col-span-3 bg-white rounded-3xl shadow-xl p-8 border-b-8 border-cyan-100 animate-slide-up">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Trimite un Mesaj</h2>

                        {submitted ? (
                            <div className="bg-green-50 border-2 border-green-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center h-80">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <Send className="w-10 h-10 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Mesaj Trimis!</h3>
                                <p className="text-slate-600 mb-2">Mulțumim! 🎉 Mesajul tău a fost trimis cu succes.</p>
                                <p className="text-slate-500 text-sm mb-4">📧 Verifică-ți emailul pentru confirmare.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-6 text-cyan-600 font-bold hover:underline"
                                >
                                    Trimite alt mesaj
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-red-700 text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Numele Tău</label>
                                    <input
                                        type="text"
                                        placeholder="ex: Andrei Popescu"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:border-cyan-400 focus:outline-none transition-colors"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Adresa de Email</label>
                                    <input
                                        type="email"
                                        placeholder="nume@exemplu.ro"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:border-cyan-400 focus:outline-none transition-colors"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Subiect</label>
                                    <select
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:border-cyan-400 focus:outline-none transition-colors"
                                        disabled={loading}
                                    >
                                        <option>Suport General</option>
                                        <option>Întrebări despre Investiții</option>
                                        <option>Abonamente și Plăți</option>
                                        <option>Parteneriate</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Mesajul Tău</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Salut! Aș vrea să știu mai multe despre..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:border-cyan-400 focus:outline-none transition-colors resize-none"
                                        required
                                        disabled={loading}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-300 text-white font-black text-lg py-4 rounded-xl shadow-playful active:translate-y-1 active:shadow-none transition-all uppercase tracking-wide flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Se trimite...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Trimite Mesajul
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Info Sidebar */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Quick Info */}
                        <div className="bg-white rounded-3xl shadow-lg p-6 border-b-4 border-slate-100">
                            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-4">Informații Directe</h3>
                            <ul className="space-y-6">
                                <li className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-cyan-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">Email</div>
                                        <a href="mailto:contact@pariazainteligent.ro" className="text-cyan-600 hover:underline">contact@pariazainteligent.ro</a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">Program Suport</div>
                                        <p className="text-slate-600 text-sm">Luni - Vineri: 09:00 - 18:00</p>
                                        <p className="text-slate-400 text-xs mt-1">Sâmbătă - Duminică: Urgențe doar</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">Locație</div>
                                        <p className="text-slate-600 text-sm">București, România</p>
                                        <p className="text-slate-400 text-xs mt-1">100% Digital Office</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Social Card */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-lg p-6 text-white border-b-4 border-indigo-800">
                            <h3 className="font-bold mb-2 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" /> Comunitate
                            </h3>
                            <p className="text-indigo-100 text-sm mb-6">
                                Cel mai rapid răspuns îl primești direct în comunitatea noastră de Telegram.
                            </p>
                            <a
                                href="https://t.me/pariazainteligent"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-center bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
                            >
                                Intră pe Telegram
                            </a>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
