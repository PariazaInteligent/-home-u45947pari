import React, { useState } from 'react';
import { Search, CheckCircle2, User, Mail, Shield, Award, XCircle } from 'lucide-react';

interface SearchResult {
    success: boolean;
    data?: any;
    error?: string;
}

export const InvestorSearch: React.FC = () => {
    const [searchId, setSearchId] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);

    const handleSearch = async (investorId: string) => {
        console.log('🔍 [InvestorSearch] handleSearch called with ID:', investorId);

        if (!investorId.trim()) {
            console.warn('⚠️ [InvestorSearch] ID is empty, aborting search');
            setResult({ success: false, error: '⚠️ Introdu un ID valid' });
            return;
        }

        console.log('🔄 [InvestorSearch] Starting search...');
        setIsSearching(true);
        setResult(null);

        try {
            const token = localStorage.getItem('accessToken') ||
                localStorage.getItem('token') ||
                localStorage.getItem('auth_token');

            console.log('🔑 [InvestorSearch] Token:', token ? 'Present' : 'Missing');

            const url = `http://localhost:3001/admin/users/${investorId.trim()}`;
            console.log('📡 [InvestorSearch] Fetching:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('📥 [InvestorSearch] Response status:', response.status);

            if (response.ok) {
                const userData = await response.json();
                console.log('✅ [InvestorSearch] User found:', userData);
                setResult({
                    success: true,
                    data: userData
                });
            } else if (response.status === 404) {
                console.log('❌ [InvestorSearch] User not found');
                setResult({
                    success: false,
                    error: 'Investitor nu a fost găsit cu acest ID'
                });
            } else {
                const errorText = await response.text();
                console.error('❌ [InvestorSearch] Unexpected status:', response.status, errorText);
                setResult({
                    success: false,
                    error: `Eroare ${response.status}: ${errorText}`
                });
            }
        } catch (err) {
            console.error('❌ [InvestorSearch] Search error:', err);
            setResult({
                success: false,
                error: `Eroare la căutare: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        } finally {
            setIsSearching(false);
            console.log('🏁 [InvestorSearch] Search completed');
        }
    };

    const handleButtonClick = () => {
        console.log('🖱️ [InvestorSearch] Button clicked! searchId:', searchId);
        handleSearch(searchId);
    };

    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-2xl border-2 border-cyan-200">
                <label className="block text-sm font-bold text-cyan-800 mb-2 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Caută Investitor (ID)
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => {
                            setSearchId(e.target.value);
                            // Clear result when typing
                            if (result) setResult(null);
                        }}
                        placeholder="Inserează sau PASTE ID..."
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-cyan-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none font-mono text-sm"
                        onPaste={(e) => {
                            const pastedId = e.clipboardData.getData('text').trim();
                            console.log('📋 [InvestorSearch] Paste detected:', pastedId);
                            setTimeout(() => handleSearch(pastedId), 150);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                console.log('⏎ [InvestorSearch] Enter pressed');
                                handleSearch(searchId);
                            }
                        }}
                    />
                    <button
                        onClick={handleButtonClick}
                        disabled={isSearching || !searchId.trim()}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${isSearching || !searchId.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:scale-105'
                            }`}
                    >
                        {isSearching ? '🔄 Caută...' : 'CAUTĂ'}
                    </button>
                </div>
                <div className="text-xs text-cyan-700 mt-2 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    PASTE ID copiat din profil pentru verificare automată
                </div>
            </div>

            {/* RESULT CARD */}
            {result && result.success && result.data && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-green-800">✅ INVESTITOR GĂSIT!</h3>
                            <p className="text-sm text-green-600 font-bold">ID-ul este valid și funcțional</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-gray-500" />
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase">Nume</div>
                                <div className="text-lg font-bold text-gray-800">{result.data.name || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-500" />
                            <div>
                                <div className="text-xs text-gray-500 font-bold uppercase">Email</div>
                                <div className="text-sm font-mono text-gray-700">{result.data.email}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-gray-500" />
                                <div>
                                    <div className="text-xs text-gray-500 font-bold">STATUS</div>
                                    <div className={`text-sm font-black ${result.data.status === 'ACTIVE' ? 'text-green-600' : 'text-orange-600'}`}>
                                        {result.data.status}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-gray-500" />
                                <div>
                                    <div className="text-xs text-gray-500 font-bold">TIER</div>
                                    <div className="text-sm font-black text-purple-600">{result.data.tier || 'ENTRY'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-500 mb-1 font-bold">ID INVESTITOR</div>
                            <div className="font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded">{result.data.id}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ERROR CARD */}
            {result && !result.success && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-2xl p-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                            <XCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-red-800">❌ EROARE</h3>
                            <p className="text-sm text-red-600 font-bold">{result.error}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
