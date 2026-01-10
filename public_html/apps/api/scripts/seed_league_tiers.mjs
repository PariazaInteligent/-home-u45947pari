#!/usr/bin/env node

/**
 * Seed League Tiers (ENTRY, SILVER, GOLD, PRO)
 * 
 * Creates tier definitions with thresholds and benefits.
 * Run: node apps/api/scripts/seed_league_tiers.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLeagueTiers() {
    console.log('🏆 [SEED] Starting league tiers seed...');

    try {
        // Check if already seeded
        const existingTiers = await prisma.leagueTier.count();

        if (existingTiers > 0) {
            console.log(`✅ [SEED] League tiers already seeded (${existingTiers} tiers). Skipping.`);
            return;
        }

        // Create tiers with benefits
        const tiers = [
            {
                id: 'lt_entry',
                tierCode: 'ENTRY',
                tierName: 'Entry League',
                minInvestment: 0,
                minStreak: 0,
                minLoyalty: 0,
                feeDiscountPct: 0,
                priority: 1,
                iconEmoji: '🌱',
                benefitsUrl: '/benefits/entry',
                benefitsJson: JSON.stringify([
                    { icon: '✓', category: 'access', description: 'Acces la dashboard investitor', order: 1 },
                    { icon: '📊', category: 'analytics', description: 'Statistici lunare bază', order: 2 },
                    { icon: '💬', category: 'support', description: 'Suport email standard', order: 3 }
                ])
            },
            {
                id: 'lt_silver',
                tierCode: 'SILVER',
                tierName: 'Silver League',
                minInvestment: 5000,
                minStreak: 7,
                minLoyalty: 500,
                feeDiscountPct: 5,
                priority: 2,
                iconEmoji: '🥈',
                benefitsUrl: '/benefits/silver',
                benefitsJson: JSON.stringify([
                    { icon: '⚡', category: 'fees', description: 'Discount 5% la comisioane retragere', order: 1 },
                    { icon: '📊', category: 'analytics', description: 'Rapoarte săptămânale detaliate', order: 2 },
                    { icon: '💬', category: 'support', description: 'Suport prioritar chat live', order: 3 },
                    { icon: '🎯', category: 'priority', description: 'Acces prioritar la oportunități noi', order: 4 }
                ])
            },
            {
                id: 'lt_gold',
                tierCode: 'GOLD',
                tierName: 'Gold League',
                minInvestment: 25000,
                minStreak: 30,
                minLoyalty: 2000,
                feeDiscountPct: 10,
                priority: 3,
                iconEmoji: '🥇',
                benefitsUrl: '/benefits/gold',
                benefitsJson: JSON.stringify([
                    { icon: '💰', category: 'fees', description: 'Discount 10% la toate comisioanele', order: 1 },
                    { icon: '📈', category: 'analytics', description: 'Dashboard personalizat cu predicții AI', order: 2 },
                    { icon: '👨‍💼', category: 'support', description: 'Account manager dedicat', order: 3 },
                    { icon: '🚀', category: 'priority', description: 'Early access la produse noi', order: 4 },
                    { icon: '🎁', category: 'rewards', description: 'Bonus lunar pe bază de performance', order: 5 }
                ])
            },
            {
                id: 'lt_pro',
                tierCode: 'PRO',
                tierName: 'Pro League',
                minInvestment: 100000,
                minStreak: 90,
                minLoyalty: 10000,
                feeDiscountPct: 20,
                priority: 4,
                iconEmoji: '💎',
                benefitsUrl: '/benefits/pro',
                benefitsJson: JSON.stringify([
                    { icon: '💎', category: 'fees', description: 'Discount 20% + cashback lunar 2%', order: 1 },
                    { icon: '🤖', category: 'analytics', description: 'AI trading signals în timp real', order: 2 },
                    { icon: '📞', category: 'support', description: 'Hotline 24/7 + WhatsApp direct', order: 3 },
                    { icon: '🏆', category: 'priority', description: 'Acces VIP la evenimente exclusive', order: 4 },
                    { icon: '💼', category: 'consulting', description: 'Consultanță strategică trimestrială', order: 5 },
                    { icon: '🎖️', category: 'rewards', description: 'Programe de loialitate premium', order: 6 }
                ])
            }
        ];

        for (const tier of tiers) {
            await prisma.leagueTier.create({ data: tier });
            console.log(`✅ [SEED] Created tier: ${tier.tierName} (${tier.tierCode})`);
        }

        console.log('');
        console.log('🏆 [SEED] League tiers seeded successfully!');
        console.log('📊 [SEED] Tiers Summary:');
        console.log('   ENTRY:  0 EUR, 0 streak, 0 loyalty → 0% discount');
        console.log('   SILVER: 5K EUR, 7 streak, 500 loyalty → 5% discount');
        console.log('   GOLD:   25K EUR, 30 streak, 2K loyalty → 10% discount');
        console.log('   PRO:    100K EUR, 90 streak, 10K loyalty → 20% discount');
        console.log('');

    } catch (error) {
        console.error('❌ [SEED] Error seeding league tiers:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run seed
seedLeagueTiers()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
