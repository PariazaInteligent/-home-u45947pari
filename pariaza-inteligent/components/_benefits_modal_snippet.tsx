{/* Benefits Modal */ }
{
    showBenefitsModal && league && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBenefitsModal(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl">{league.iconEmoji}</span>
                        <div>
                            <h2 className="text-3xl font-black text-[#4B4B4B]">{league.name}</h2>
                            <p className="text-[#AFAFAF] font-bold">Nivelul tău de investitor</p>
                        </div>
                    </div>
                    <button onClick={() => setShowBenefitsModal(false)} className="text-[#AFAFAF] hover:text-[#4B4B4B] text-3xl font-bold">&times;</button>
                </div>

                <div className="space-y-6">
                    {/* Fee Discount */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
                        <h3 className="text-xl font-black text-green-800 mb-2 flex items-center gap-2">
                            <span>💰</span> Discount la Comisioane
                        </h3>
                        <p className="text-3xl font-black text-green-600">{league.feeDiscountPercent}%</p>
                        <p className="text-sm text-green-700 mt-2">Economisești la fiecare retragere!</p>
                    </div>

                    {/* Thresholds */}
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
                        <h3 className="text-xl font-black text-purple-800 mb-4 flex items-center gap-2">
                            <span>🎯</span> Cerințe Nivel Curent
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-purple-700 font-bold">Investiție minimă:</span>
                                <span className="font-black text-purple-900">{new Intl.NumberFormat('ro-RO').format(league.thresholds.minInvestment)} EUR</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-purple-700 font-bold">Streak minim:</span>
                                <span className="font-black text-purple-900">{league.thresholds.minStreak} zile</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-purple-700 font-bold">Puncte loialitate:</span>
                                <span className="font-black text-purple-900">{league.thresholds.minLoyalty} puncte</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Benefits */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                        <h3 className="text-xl font-black text-blue-800 mb-3 flex items-center gap-2">
                            <span>⭐</span> Avantaje Exclusive
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-700">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 font-black">✓</span>
                                <span>Acces prioritar la rapoarte zilnice</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 font-black">✓</span>
                                <span>Dashboard personalizat cu statistici avansate</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500 font-black">✓</span>
                                <span>Suport dedicat pentru investitori {league.name}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-6">
                    <Button3D variant="secondary" className="w-full" onClick={() => setShowBenefitsModal(false)}>
                        ÎNCHIDE
                    </Button3D>
                </div>
            </div>
        </div>
    )
}
