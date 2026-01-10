import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn } from 'lucide-react';

export const SessionExpiredPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-[480px]">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-block relative group">
                        <div className="text-8xl mb-4 hover:scale-110 transition-transform cursor-default select-none animate-bounce">🦉✋</div>
                    </div>
                    <h1 className="text-3xl font-black text-[#4B4B4B] mb-2 uppercase tracking-wide">Acces Interzis!</h1>
                    <p className="text-[#777] font-medium text-lg">Ai fost prins de Bufnița de Securitate.</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-[0_8px_0_#E5E5E5] border-2 border-[#E5E5E5] p-6 sm:p-8 animate-[fadeIn_0.5s_ease-out]">

                    <div className="text-center">
                        <div className="w-20 h-20 bg-[#FF4B4B]/20 text-[#FF4B4B] rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert className="w-10 h-10" />
                        </div>

                        <h3 className="text-2xl font-black text-[#4B4B4B] mb-4">Sesiune Expirată</h3>

                        <div className="bg-[#FFF2F2] border-2 border-[#FFCACA] rounded-2xl p-4 mb-8 text-left">
                            <p className="text-[#EA2B2B] font-bold text-sm leading-relaxed">
                                Pentru siguranța ta, te-am deconectat. Sesiunea ta a expirat sau ai încercat să accesezi o zonă restricționată fără permisiuni valide.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-[#1CB0F6] hover:bg-[#1899D6] active:translate-y-[4px] active:shadow-none text-white font-extrabold text-lg uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_0_#1899D6] transition-all flex items-center justify-center gap-3"
                        >
                            RE-AUTENTIFICARE <LogIn className="w-5 h-5" />
                        </button>
                    </div>

                </div>

                {/* Footer Message */}
                <div className="mt-8 text-center px-4">
                    <p className="text-[#AFAFAF] font-bold text-sm">
                        Securitatea platformei este prioritatea noastră.
                    </p>
                </div>
            </div>
        </div>
    );
};
