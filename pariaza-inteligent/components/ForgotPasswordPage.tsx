import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3001/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                // Even on error (like 429), we might want to show a generic message or handle accordingly
                // But specifically for 429 we might want to tell the user to wait
                if (response.status === 429) {
                    throw new Error('Prea multe încercări. Te rugăm să aștepți 15 minute.');
                }
            }

            // Always show success to prevent email enumeration (unless rate limited)
            setIsSent(true);
        } catch (err: any) {
            setError(err.message || 'A apărut o eroare. Încearcă din nou.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-[480px]">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-block relative group">
                        <div className="text-7xl mb-2 hover:scale-110 transition-transform cursor-default select-none">🤔</div>
                    </div>
                    <h1 className="text-3xl font-black text-[#4B4B4B] mb-2">Ai Uitat Parola?</h1>
                    <p className="text-[#777] font-medium text-lg">Nu e panică! O rezolvăm imediat.</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-[0_8px_0_#E5E5E5] border-2 border-[#E5E5E5] p-6 sm:p-8 animate-[fadeIn_0.5s_ease-out]">

                    {isSent ? (
                        <div className="text-center py-4">
                            <div className="w-20 h-20 bg-[#58CC02]/20 text-[#58CC02] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-[#4B4B4B] mb-2">Email Trimis!</h3>
                            <p className="text-[#777] font-medium mb-8">
                                Dacă există un cont asociat cu <strong>{email}</strong>, vei primi instrucțiunile de resetare în câteva momente.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-[#1CB0F6] hover:bg-[#1899D6] active:translate-y-[4px] active:shadow-none text-white font-extrabold text-lg uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_0_#1899D6] transition-all"
                            >
                                ÎNAPOI LA LOGIN
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="space-y-2">
                                <label className="text-[#4B4B4B] font-bold uppercase text-xs tracking-wider ml-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#F7F7F7] border-2 border-[#E5E5E5] text-[#4B4B4B] font-bold text-lg px-4 py-4 rounded-2xl focus:border-[#1CB0F6] focus:bg-white focus:outline-none transition-colors placeholder:text-[#D4D4D4]"
                                    placeholder="nume@exemplu.ro"
                                    disabled={isLoading}
                                />
                            </div>

                            {error && (
                                <div className="bg-[#FFDEDE] border-2 border-[#FF4B4B] rounded-2xl p-4 flex items-center gap-3 animate-shake">
                                    <div className="bg-[#FF4B4B] rounded-full p-1 text-white flex-shrink-0">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <span className="text-[#EA2B2B] font-bold text-sm tracking-wide">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#1CB0F6] hover:bg-[#1899D6] active:translate-y-[4px] active:shadow-none text-white font-extrabold text-lg uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_0_#1899D6] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        SE TRIMITE...
                                    </>
                                ) : (
                                    <>
                                        TRIMITE LINK-UL <Send className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer Actions */}
                {!isSent && (
                    <div className="mt-8">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full text-[#AFAFAF] font-bold uppercase tracking-widest text-sm hover:text-[#4B4B4B] transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Înapoi la Autentificare
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
