import React, { useState, useEffect } from 'react';
import { Button3D } from '../ui/Button3D';
import { BenefitsModal } from '../modals/BenefitsModal';

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

interface TierEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    tier: Tier | null;
    onSave: (updates: any) => Promise<void>;
}

export const TierEditModal: React.FC<TierEditModalProps> = ({ isOpen, onClose, tier, onSave }) => {
    const [tierName, setTierName] = useState('');
    const [iconEmoji, setIconEmoji] = useState('');
    const [feeDiscount, setFeeDiscount] = useState(0);
    const [minInvestment, setMinInvestment] = useState(0);
    const [minStreak, setMinStreak] = useState(0);
    const [minLoyalty, setMinLoyalty] = useState(0);
    const [benefitsJson, setBenefitsJson] = useState('');
    const [jsonError, setJsonError] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (tier) {
            setTierName(tier.tierName);
            setIconEmoji(tier.iconEmoji || '');
            setFeeDiscount(Number(tier.feeDiscountPct));
            setMinInvestment(Number(tier.minInvestment));
            setMinStreak(tier.minStreak);
            setMinLoyalty(tier.minLoyalty);
            setBenefitsJson(tier.benefitsJson || '{"ro": []}');
        }
    }, [tier]);

    const validateJSON = (jsonStr: string): boolean => {
        try {
            JSON.parse(jsonStr);
            setJsonError('');
            return true;
        } catch (error) {
            setJsonError(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return false;
        }
    };

    const handleSave = async () => {
        if (!validateJSON(benefitsJson)) {
            return;
        }

        setIsSaving(true);
        try {
            await onSave({
                tierName,
                iconEmoji,
                feeDiscountPct: feeDiscount,
                minInvestment,
                minStreak,
                minLoyalty,
                benefitsJson
            });
            onClose();
        } catch (error) {
            alert(`Error saving tier: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const getPreviewLeague = () => {
        try {
            const parsed = JSON.parse(benefitsJson);
            const benefits = Array.isArray(parsed.ro) ? parsed.ro : [];
            return {
                name: tierName,
                iconEmoji,
                feeDiscountPercent: feeDiscount,
                thresholds: { minInvestment, minStreak, minLoyalty },
                benefits
            };
        } catch {
            return null;
        }
    };

    if (!isOpen || !tier) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-black text-[#4B4B4B]">Edit Tier: {tier.tierCode}</h2>
                    <button onClick={onClose} className="text-[#AFAFAF] hover:text-[#4B4B4B] text-3xl font-bold">&times;</button>
                </div>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[#4B4B4B] mb-2">Tier Name</label>
                            <input
                                type="text"
                                value={tierName}
                                onChange={e => setTierName(e.target.value)}
                                className="w-full p-3 border-2 border-[#E5E5E5] rounded-xl font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#4B4B4B] mb-2">Icon Emoji</label>
                            <input
                                type="text"
                                value={iconEmoji}
                                onChange={e => setIconEmoji(e.target.value)}
                                className="w-full p-3 border-2 border-[#E5E5E5] rounded-xl font-bold text-3xl"
                            />
                        </div>
                    </div>

                    {/* Thresholds */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[#4B4B4B] mb-2">Min Investment (EUR)</label>
                            <input
                                type="number"
                                value={minInvestment}
                                onChange={e => setMinInvestment(Number(e.target.value))}
                                className="w-full p-3 border-2 border-[#E5E5E5] rounded-xl font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#4B4B4B] mb-2">Min Streak (days)</label>
                            <input
                                type="number"
                                value={minStreak}
                                onChange={e => setMinStreak(Number(e.target.value))}
                                className="w-full p-3 border-2 border-[#E5E5E5] rounded-xl font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#4B4B4B] mb-2">Min Loyalty Points</label>
                            <input
                                type="number"
                                value={minLoyalty}
                                onChange={e => setMinLoyalty(Number(e.target.value))}
                                className="w-full p-3 border-2 border-[#E5E5E5] rounded-xl font-bold"
                            />
                        </div>
                    </div>

                    {/* Fee Discount */}
                    <div>
                        <label className="block text-sm font-bold text-[#4B4B4B] mb-2">Fee Discount (%)</label>
                        <input
                            type="number"
                            value={feeDiscount}
                            onChange={e => setFeeDiscount(Number(e.target.value))}
                            className="w-full p-3 border-2 border-[#E5E5E5] rounded-xl font-bold"
                        />
                    </div>

                    {/* Benefits JSON Editor */}
                    <div>
                        <label className="block text-sm font-bold text-[#4B4B4B] mb-2">Benefits JSON (i18n)</label>
                        <textarea
                            value={benefitsJson}
                            onChange={e => {
                                setBenefitsJson(e.target.value);
                                validateJSON(e.target.value);
                            }}
                            className="w-full p-3 border-2 border-[#E5E5E5] rounded-xl font-mono text-sm"
                            rows={15}
                        />
                        {jsonError && <p className="text-red-500 text-sm mt-2">{jsonError}</p>}
                        <p className="text-xs text-[#AFAFAF] mt-2">
                            Format: {`{"ro": [{"icon": "✓", "category": "access", "description": "...", "order": 1}]}`}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button3D
                            variant="secondary"
                            onClick={() => setShowPreview(true)}
                            disabled={!!jsonError}
                        >
                            PREVIEW MODAL
                        </Button3D>
                        <Button3D
                            onClick={handleSave}
                            disabled={!!jsonError || isSaving}
                            className="flex-1"
                        >
                            {isSaving ? 'SALVARE...' : 'SAVE CHANGES'}
                        </Button3D>
                    </div>
                </div>

                {/* Preview Modal */}
                {showPreview && getPreviewLeague() && (
                    <BenefitsModal
                        isOpen={true}
                        onClose={() => setShowPreview(false)}
                        league={getPreviewLeague()}
                    />
                )}
            </div>
        </div>
    );
};
