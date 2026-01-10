/**
 * Tier Service - League/Tier Calculation & Management
 */

import { prisma } from '@pariaza/database';

export interface TierThresholds {
    minInvestment: number;
    minStreak: number;
    minLoyalty: number;
}

export interface UserStats {
    investmentValue: number;
    streakDays: number;
    loyaltyPoints: number;
}

/**
 * Calculate appropriate tier for user based on current stats
 */
export async function calculateUserTier(stats: UserStats): Promise<string> {
    // Get all tiers ordered by priority DESC (best tier first)
    const tiers = await prisma.leagueTier.findMany({
        orderBy: { priority: 'desc' }
    });

    // Find highest tier where user meets ALL thresholds
    for (const tier of tiers) {
        const meetsInvestment = stats.investmentValue >= Number(tier.minInvestment);
        const meetsStreak = stats.streakDays >= tier.minStreak;
        const meetsLoyalty = stats.loyaltyPoints >= tier.minLoyalty;

        if (meetsInvestment && meetsStreak && meetsLoyalty) {
            return tier.tierCode;
        }
    }

    // Default fallback
    return 'ENTRY';
}

/**
 * Get all tier definitions from database
 */
export async function getTierDefinitions() {
    return await prisma.leagueTier.findMany({
        orderBy: { priority: 'asc' }
    });
}

/**
 * Get specific tier details by code
 */
export async function getTierByCode(tierCode: string) {
    return await prisma.leagueTier.findUnique({
        where: { tierCode }
    });
}

/**
 * Manually assign tier to user (admin override)
 */
export async function assignTier(userId: string, tierCode: string): Promise<void> {
    // Validate tier exists
    const tier = await prisma.leagueTier.findUnique({
        where: { tierCode }
    });

    if (!tier) {
        throw new Error(`Invalid tier code: ${tierCode}`);
    }

    // Update user tier
    await prisma.user.update({
        where: { id: userId },
        data: { tier: tierCode }
    });
}

/**
 * Recalculate tier for specific user based on current stats
 */
export async function recalculateUserTier(userId: string): Promise<{ oldTier: string; newTier: string; changed: boolean }> {
    // Get user current tier
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true, streakDays: true, loyaltyPoints: true }
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Calculate investment value
    const depositsAgg = await prisma.deposit.aggregate({
        where: { userId, status: 'APPROVED' },
        _sum: { amount: true }
    });

    const withdrawalsAgg = await prisma.withdrawal.aggregate({
        where: { userId, status: 'APPROVED' },
        _sum: { amountPayout: true }
    });

    const investmentValue = Number(depositsAgg._sum?.amount ?? 0) - Number(withdrawalsAgg._sum?.amountPayout ?? 0);

    // Calculate new tier
    const stats: UserStats = {
        investmentValue,
        streakDays: user.streakDays || 0,
        loyaltyPoints: user.loyaltyPoints || 0
    };

    const newTier = await calculateUserTier(stats);
    const oldTier = user.tier || 'ENTRY';
    const changed = newTier !== oldTier;

    // Update if changed
    if (changed) {
        await prisma.user.update({
            where: { id: userId },
            data: { tier: newTier }
        });
    }

    return { oldTier, newTier, changed };
}

/**
 * Recalculate tiers for ALL active users
 */
export async function recalculateAllUserTiers(): Promise<{ total: number; upgraded: number; downgraded: number; unchanged: number }> {
    const users = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true }
    });

    let upgraded = 0;
    let downgraded = 0;
    let unchanged = 0;

    for (const user of users) {
        try {
            const result = await recalculateUserTier(user.id);

            if (!result.changed) {
                unchanged++;
            } else {
                // Compare priority
                const oldTierData = await getTierByCode(result.oldTier);
                const newTierData = await getTierByCode(result.newTier);

                if (oldTierData && newTierData) {
                    if (newTierData.priority > oldTierData.priority) {
                        upgraded++;
                    } else {
                        downgraded++;
                    }
                }
            }
        } catch (err) {
            console.error(`Error recalculating tier for user ${user.id}:`, err);
        }
    }

    return {
        total: users.length,
        upgraded,
        downgraded,
        unchanged
    };
}
