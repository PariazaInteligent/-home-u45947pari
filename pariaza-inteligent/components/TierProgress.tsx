import React from 'react';
import { TrendingUp, Calendar, Award, ArrowRight, Lock } from 'lucide-react';

interface TierProgressProps {
    currentTier: {
        code: string;
        name: string;
        iconEmoji: string;
    };
    nextTier: {
        code: string;
        name: string;
        iconEmoji: string;
        thresholds: {
            minInvestment: number;
            minStreak: number;
            minLoyalty: number;
        };
    } | null;
    currentProgress: {
        totalInvestment: number;
        currentStreak: number;
        loyaltyPoints: number;
    };
}

export const TierProgress: React.FC<TierProgressProps> = ({ currentTier, nextTier, currentProgress }) => {
    if (!nextTier) {
        // Already at max tier
        return (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border-4 border-purple-200">
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-6xl">{currentTier.iconEmoji}</div>
                    <div>
                        <h3 className="text-2xl font-black text-purple-600">🏆 Nivel Maxim Atins!</h3>
                        <p className="text-[#4B4B4B] font-bold">Ești în {currentTier.name} - cel mai înalt tier!</p>
                    </div>
                </div>
                <p className="text-[#AFAFAF]">Continui să beneficiezi de toate avantajele premium.</p>
            </div>
        );
    }

    const investmentProgress = Math.min((currentProgress.totalInvestment / nextTier.thresholds.minInvestment) * 100, 100);
    const streakProgress = Math.min((currentProgress.currentStreak / nextTier.thresholds.minStreak) * 100, 100);
    const loyaltyProgress = Math.min((currentProgress.loyaltyPoints / nextTier.thresholds.minLoyalty) * 100, 100);

    const investmentRemaining = Math.max(nextTier.thresholds.minInvestment - currentProgress.totalInvestment, 0);
    const streakRemaining = Math.max(nextTier.thresholds.minStreak - currentProgress.currentStreak, 0);
    const loyaltyRemaining = Math.max(nextTier.thresholds.minLoyalty - currentProgress.loyaltyPoints, 0);

    const allComplete = investmentProgress >= 100 && streakProgress >= 100 && loyaltyProgress >= 100;

    return (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border-4 border-blue-200 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="text-4xl">{currentTier.iconEmoji}</div>
                    <ArrowRight className="w-6 h-6 text-[#AFAFAF]" />
                    <div className="text-4xl opacity-50">{nextTier.iconEmoji}</div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-[#AFAFAF] font-bold">URMEAZĂ</p>
                    <p className="text-xl font-black text-[#1CB0F6]">{nextTier.name}</p>
                </div>
            </div>

            {/* Progress Title */}
            <h3 className="text-lg font-black text-[#4B4B4B] mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1CB0F6]" />
                Progresul Tău spre {nextTier.name}
            </h3>

            {/* Progress Bars */}
            <div className="space-y-4 mb-6">
                {/* Investment Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-bold text-[#4B4B4B]">Investiție Totală</span>
                        </div>
                        <span className="text-sm font-bold text-[#4B4B4B]">
                            {currentProgress.totalInvestment.toFixed(0)} / {nextTier.thresholds.minInvestment} EUR
                        </span>
                    </div>
                    <div className="h-3 bg-[#E5E5E5] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 rounded-full"
                            style={{ width: `${investmentProgress}%` }}
                        />
                    </div>
                    {investmentRemaining > 0 && (
                        <p className="text-xs text-[#AFAFAF] mt-1">
                            Mai lipsesc <span className="font-bold text-green-600">{investmentRemaining.toFixed(0)} EUR</span>
                        </p>
                    )}
                </div>

                {/* Streak Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-bold text-[#4B4B4B]">Streak Activitate</span>
                        </div>
                        <span className="text-sm font-bold text-[#4B4B4B]">
                            {currentProgress.currentStreak} / {nextTier.thresholds.minStreak} zile
                        </span>
                    </div>
                    <div className="h-3 bg-[#E5E5E5] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500 rounded-full"
                            style={{ width: `${streakProgress}%` }}
                        />
                    </div>
                    {streakRemaining > 0 && (
                        <p className="text-xs text-[#AFAFAF] mt-1">
                            Mai lipsesc <span className="font-bold text-orange-600">{streakRemaining} zile</span>
                        </p>
                    )}
                </div>

                {/* Loyalty Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-bold text-[#4B4B4B]">Puncte Loialitate</span>
                        </div>
                        <span className="text-sm font-bold text-[#4B4B4B]">
                            {currentProgress.loyaltyPoints} / {nextTier.thresholds.minLoyalty} pts
                        </span>
                    </div>
                    <div className="h-3 bg-[#E5E5E5] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500 rounded-full"
                            style={{ width: `${loyaltyProgress}%` }}
                        />
                    </div>
                    {loyaltyRemaining > 0 && (
                        <p className="text-xs text-[#AFAFAF] mt-1">
                            Mai lipsesc <span className="font-bold text-purple-600">{loyaltyRemaining} puncte</span>
                        </p>
                    )}
                </div>
            </div>

            {/* CTA / Status */}
            {allComplete ? (
                <div className="bg-green-100 border-2 border-green-500 rounded-xl p-4 text-center">
                    <p className="text-green-700 font-black text-lg">🎉 Felicitări! Ești eligibil pentru {nextTier.name}!</p>
                    <p className="text-sm text-green-600 mt-1">Tier-ul tău va fi actualizat automat în curând.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                    <p className="text-[#4B4B4B] font-bold text-sm mb-2">💡 Pentru a avansa la {nextTier.name}:</p>
                    <ul className="text-xs text-[#AFAFAF] space-y-1">
                        {investmentRemaining > 0 && (
                            <li>• Investește încă <span className="font-bold text-green-600">{investmentRemaining.toFixed(0)} EUR</span></li>
                        )}
                        {streakRemaining > 0 && (
                            <li>• Păstrează streak-ul activ pentru <span className="font-bold text-orange-600">{streakRemaining} zile</span></li>
                        )}
                        {loyaltyRemaining > 0 && (
                            <li>• Acumulează <span className="font-bold text-purple-600">{loyaltyRemaining} puncte loialitate</span></li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};
