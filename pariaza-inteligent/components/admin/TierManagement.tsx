import React, { useState, useEffect } from 'react';
import { Button3D } from '../ui/Button3D';
import { TierEditModal } from './TierEditModal';

interface Tier {
    id: string;
    tierCode: string;
    tierName: string;
    minInvestment: number;
    minStreak: number;
    minLoyalty: number;
    feeDiscountPct: number;
    priority: number;
    benefitsUrl: string | null;
    iconEmoji: string | null;
    benefitsJson: string | null;
    benefitsVersion: number;
}

export const TierManagement: React.FC = () => {
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchTiers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:3001/admin/tiers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setTiers(data.tiers);
            }
        } catch (error) {
            console.error('Error fetching tiers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTiers();
    }, []);

    const handleEdit = (tier: Tier) => {
        setSelectedTier(tier);
        setShowEditModal(true);
    };

    const handleSave = async (updates: any) => {
        if (!selectedTier) return;

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:3001/admin/tiers/${selectedTier.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            const data = await response.json();
            if (data.success) {
                await fetchTiers(); // Refresh list
                setShowEditModal(false);
                setSelectedTier(null);
            }
        } catch (error) {
            console.error('Error updating tier:', error);
            throw error;
        }
    };

    const getBenefitsCount = (tier: Tier): number => {
        if (!tier.benefitsJson) return 0;
        try {
            const parsed = JSON.parse(tier.benefitsJson);
            // Check if i18n structure
            if (parsed.ro) return Array.isArray(parsed.ro) ? parsed.ro.length : 0;
            if (Array.isArray(parsed)) return parsed.length;
            return 0;
        } catch {
            return 0;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-[#AFAFAF] text-xl font-bold">Se încarcă tier-urile...</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-black text-[#4B4B4B] mb-2">Tier Management</h1>
                    <p className="text-[#AFAFAF]">Gestionare league tiers și beneficii</p>
                </div>
            </div>

            {/* Tiers Table */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#4B4B4B] to-[#6B6B6B] text-white">
                        <tr>
                            <th className="px-6 py-4 text-left font-black">Tier</th>
                            <th className="px-6 py-4 text-left font-black">Nume</th>
                            <th className="px-6 py-4 text-center font-black">Prioritate</th>
                            <th className="px-6 py-4 text-center font-black">Discount</th>
                            <th className="px-6 py-4 text-center font-black">Min. Investment</th>
                            <th className="px-6 py-4 text-center font-black">Beneficii</th>
                            <th className="px-6 py-4 text-center font-black">Versiune</th>
                            <th className="px-6 py-4 text-center font-black">Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tiers.map((tier, index) => (
                            <tr
                                key={tier.id}
                                className={`border-b border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
                                    }`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl">{tier.iconEmoji || '🌱'}</span>
                                        <span className="font-bold text-[#4B4B4B]">{tier.tierCode}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-[#4B4B4B]">{tier.tierName}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-[#E5E5E5] px-3 py-1 rounded-full text-sm font-bold">
                                        {tier.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-green-600">
                                    {Number(tier.feeDiscountPct)}%
                                </td>
                                <td className="px-6 py-4 text-center font-bold">
                                    {Number(tier.minInvestment)} EUR
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
                                        {getBenefitsCount(tier)} items
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-bold">
                                        v{tier.benefitsVersion}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <Button3D
                                        onClick={() => handleEdit(tier)}
                                        variant="secondary"
                                        className="text-sm"
                                    >
                                        EDIT
                                    </Button3D>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {tiers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-[#AFAFAF] text-lg">Nu există tier-uri create.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && selectedTier && (
                <TierEditModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedTier(null);
                    }}
                    tier={selectedTier}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};
