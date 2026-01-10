import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { ToastManager } from '../../utils/ToastManager';
import confetti from 'canvas-confetti';
import { getApiUrl } from '../../config';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password strength validation
    const validations = {
        minLength: newPassword.length >= 8,
        hasUppercase: /[A-Z]/.test(newPassword),
        hasLowercase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword)
    };

    const allValid = Object.values(validations).every(v => v);
    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!allValid) {
            ToastManager.showWithSound('error', 'Parola nouă nu respectă cerințele');
            return;
        }

        if (!passwordsMatch) {
            ToastManager.showWithSound('error', '❌ Parolele nu coincid');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(getApiUrl('/api/users/change-password'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {            // SUCCESS! 🎉
                ToastManager.showWithSound('achievement', '🎉 Parola schimbată! Cont mai sigur!');

                // Confetti celebration
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#58CC02', '#FF9600', '#7C3AED', '#1CB0F6']
                });

                // Trigger success callback
                onSuccess();

                // Close modal
                setTimeout(() => {
                    onClose();
                    // Reset form
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                }, 500);
            } else {
                // API error
                ToastManager.showWithSound('error', data.error || 'Eroare la schimbare parolă');
            }
        } catch (err) {
            ToastManager.showWithSound('error', 'Eroare de rețea. Încearcă din nou.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative animate-[slideIn_0.3s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-[#FF9600]/10 rounded-full flex items-center justify-center">
                            <Key className="w-6 h-6 text-[#FF9600]" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900">Schimbă Parola</h2>
                    </div>
                    <div className="flex items-start gap-2 bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                        <div className="text-2xl">🦉</div>
                        <div>
                            <div className="text-sm font-bold text-blue-900">Prof. Investino spune:</div>
                            <div className="text-xs text-blue-700">
                                "Hai să facem contul și mai sigur! Folosește o parolă puternică."
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Current Password */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Parola Curentă
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF9600] focus:outline-none font-medium text-gray-900 placeholder:text-gray-500"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Parola Nouă
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF9600] focus:outline-none font-medium text-gray-900 placeholder:text-gray-500"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Confirmă Parola
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#FF9600] focus:outline-none font-medium text-gray-900 placeholder:text-gray-500"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Validation Checklist */}
                    {newPassword.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <div className="text-xs font-bold text-gray-700 mb-2">Cerințe parolă:</div>

                            <div className="flex items-center gap-2 text-sm">
                                {validations.minLength ?
                                    <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                                    <XCircle className="w-4 h-4 text-gray-400" />
                                }
                                <span className={validations.minLength ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                    Minim 8 caractere
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                {validations.hasUppercase ?
                                    <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                                    <XCircle className="w-4 h-4 text-gray-400" />
                                }
                                <span className={validations.hasUppercase ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                    Cel puțin o majusculă
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                {validations.hasLowercase ?
                                    <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                                    <XCircle className="w-4 h-4 text-gray-400" />
                                }
                                <span className={validations.hasLowercase ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                    Cel puțin o minusculă
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                {validations.hasNumber ?
                                    <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                                    <XCircle className="w-4 h-4 text-gray-400" />
                                }
                                <span className={validations.hasNumber ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                    Cel puțin un număr
                                </span>
                            </div>

                            {confirmPassword.length > 0 && (
                                <div className="flex items-center gap-2 text-sm pt-2 border-t border-gray-200">
                                    {passwordsMatch ?
                                        <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                                        <XCircle className="w-4 h-4 text-red-600" />
                                    }
                                    <span className={passwordsMatch ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                        {passwordsMatch ? 'Parolele coincid' : 'Parolele nu coincid'}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            disabled={isSubmitting}
                        >
                            Înapoi
                        </button>
                        <button
                            type="submit"
                            disabled={!allValid || !passwordsMatch || isSubmitting}
                            className={`flex-1 px-6 py-3 font-bold rounded-xl transition-all shadow-[0_4px_0_#CC7700] active:shadow-none active:translate-y-1 ${!allValid || !passwordsMatch || isSubmitting
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-[0_4px_0_#CCCCCC]'
                                : 'bg-[#FF9600] text-white hover:bg-[#E08600]'
                                }`}
                        >
                            {isSubmitting ? 'Se schimbă...' : 'SCHIMBĂ PAROLA →'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
            @keyframes slideIn {
               from {
                  opacity: 0;
                  transform: translateY(-20px);
               }
               to {
                  opacity: 1;
                  transform: translateY(0);
               }
            }
         `}</style>
        </div>
    );
};
