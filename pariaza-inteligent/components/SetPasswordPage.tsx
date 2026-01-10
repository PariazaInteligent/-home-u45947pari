
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle, XCircle, X } from 'lucide-react';

export const SetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Extract Token
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    // 2. Validate Token Presence on Mount
    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Link-ul este invalid (token lipsă).');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setErrorMessage('Parolele nu coincid.');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setErrorMessage('Parola trebuie să aibă minim 6 caractere.');
            return;
        }

        setStatus('loading');

        try {
            const response = await fetch('http://localhost:3001/auth/set-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Eroare la setarea parolei.');
            }

            setStatus('success');
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'A apărut o eroare neprevăzută.');
        }
    };

    // 3. Render Error State (Red Style)
    if (status === 'error' && !errorMessage.includes('Parolele')) {
        return (
            <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4 font-sans">
                <div className="bg-white w-full max-w-[480px] rounded-3xl shadow-[0_8px_0_#E5E5E5] border-2 border-[#E5E5E5] p-8 text-center animate-shake">
                    <div className="text-6xl mb-6">😢</div>
                    <h2 className="text-2xl font-black text-[#4B4B4B] mb-2">Ups! Ceva nu a mers</h2>
                    <p className="text-[#777] font-medium mb-8 text-lg">{errorMessage}</p>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-[#FF4B4B] hover:bg-[#FF3838] active:translate-y-[4px] active:shadow-none text-white font-extrabold uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_0_#EA2B2B] transition-all"
                    >
                        Înapoi la Start
                    </button>
                </div>
            </div>
        );
    }

    // 4. Render Success State (Celebration)
    if (status === 'success') {
        return (
            <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4 font-sans">
                <div className="bg-white w-full max-w-[480px] rounded-3xl shadow-[0_8px_0_#E5E5E5] border-2 border-[#E5E5E5] p-8 text-center">
                    <div className="text-6xl mb-6 animate-bounce">🎉</div>
                    <h2 className="text-2xl font-black text-[#58CC02] mb-2">Yeeey! Ai reușit!</h2>
                    <p className="text-[#777] font-medium mb-8 text-lg">Parola ta a fost setată cu succes. Ești gata de acțiune!</p>
                    <div className="w-16 h-16 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#AFAFAF] font-bold text-sm uppercase tracking-wide">Te redirecționăm...</p>
                </div>
            </div>
        );
    }

    // 5. Render Form (Playful Input)
    return (
        <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-[480px]">

                {/* Header Card */}
                <div className="text-center mb-8">
                    <div className="inline-block relative">
                        <div className="text-7xl mb-2 hover:scale-110 transition-transform cursor-default">🦉</div>
                        <div className="absolute -right-8 -top-2 bg-white px-3 py-1 rounded-xl border-2 border-[#E5E5E5] shadow-sm rotate-12">
                            <span className="text-xs font-black text-[#1CB0F6]">HOOT!</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-[#4B4B4B] mb-2">Setează Parola</h1>
                    <p className="text-[#777] font-medium text-lg">Alege o parolă puternică pentru contul tău de investitor.</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-[0_8px_0_#E5E5E5] border-2 border-[#E5E5E5] p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-[#4B4B4B] font-bold uppercase text-xs tracking-wider ml-1">Parolă Nouă</label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#F7F7F7] border-2 border-[#E5E5E5] text-[#4B4B4B] font-bold text-lg px-4 py-4 rounded-2xl focus:border-[#1CB0F6] focus:bg-white focus:outline-none transition-colors placeholder:text-[#D4D4D4]"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#AFAFAF] hover:text-[#1CB0F6] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label className="text-[#4B4B4B] font-bold uppercase text-xs tracking-wider ml-1">Confirmă Parola</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#F7F7F7] border-2 border-[#E5E5E5] text-[#4B4B4B] font-bold text-lg px-4 py-4 rounded-2xl focus:border-[#1CB0F6] focus:bg-white focus:outline-none transition-colors placeholder:text-[#D4D4D4]"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Validation Helpers with Playful Colors */}
                        <div className="flex gap-2 text-xs font-bold text-[#AFAFAF] px-1">
                            <span className={password.length >= 6 ? "text-[#58CC02] transition-colors" : ""}>• Min. 6 caractere</span>
                            <span className={password === confirmPassword && password.length > 0 ? "text-[#58CC02] transition-colors" : ""}>• Coincid</span>
                        </div>

                        {/* Error Bubble */}
                        {status === 'error' && errorMessage.includes('Parolele') && (
                            <div className="bg-[#FFDEDE] border-2 border-[#FF4B4B] rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                                <div className="bg-[#FF4B4B] rounded-full p-1 text-white">
                                    <X className="w-4 h-4" />
                                </div>
                                <span className="text-[#EA2B2B] font-bold text-sm tracking-wide">{errorMessage}</span>
                            </div>
                        )}

                        {/* Big Green Button */}
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-[#58CC02] hover:bg-[#46A302] active:translate-y-[4px] active:shadow-none text-white font-extrabold text-lg uppercase tracking-wider py-4 rounded-2xl shadow-[0_4px_0_#58A700] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_#58A700]"
                        >
                            {status === 'loading' ? 'SE SETEAZĂ...' : 'SETEAZĂ PAROLA'}
                        </button>
                    </form>
                </div>

                <button
                    onClick={() => navigate('/login')}
                    className="w-full mt-6 text-[#AFAFAF] font-bold uppercase tracking-widest text-sm hover:text-[#1CB0F6] transition-colors"
                >
                    NU ACUM, MERGI LA LOGIN
                </button>

            </div>
        </div>
    );
};

