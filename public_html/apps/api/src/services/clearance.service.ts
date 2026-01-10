/**
 * Clearance Service - Auto-calculating clearance level based on user stats
 * Pattern: users.clearance_level is CACHED/DENORMALIZED - source of truth is config + service logic
 * 
 * CORRECTIONS APPLIED:
 * 1. Tier as ENUM (users_tier) not string
 * 2. Investment from unified ledger (same as Dashboard)
 * 3. Idempotent triggers with transaction (no audit if unchanged)
 * 4. Config caching with TTL (performance optimization)
 */

import { prisma } from '@pariaza/database';

// Type for tier (MySQL enum values)
type Users_Tier = 'ENTRY' | 'INVESTOR' | 'PRO' | 'WHALE';

export interface UserClearanceStats {
    streakDays: number;
    loyaltyPoints: number;
    tier: Users_Tier; // CORRECTION 1: ENUM not string
    investmentValue: number;
}

// CORRECTION 4: Config cache with TTL
class ClearanceConfigCache {
    private cache: any[] | null = null;
    private lastFetch: number = 0;
    private TTL = 5 * 60 * 1000; // 5 minutes (same as TierCacheService pattern)

    async getConfigs(): Promise<any[]> {
        const now = Date.now();
        if (this.cache && (now - this.lastFetch) < this.TTL) {
            return this.cache;
        }

        this.cache = await prisma.clearanceLevelConfig.findMany({
            orderBy: { level: 'desc' }
        });
        this.lastFetch = now;
        return this.cache;
    }

    invalidate() {
        this.cache = null;
    }
}

const configCache = new ClearanceConfigCache();

export class ClearanceService {
    /**
     * Calculate appropriate clearance level based on user stats
     * @returns level (1-5)
     */
    async calculateClearanceLevel(stats: UserClearanceStats): Promise<number> {
        const configs = await configCache.getConfigs();

        for (const config of configs) {
            const meetsStreak = stats.streakDays >= config.requiredStreak;
            const meetsLoyalty = stats.loyaltyPoints >= config.requiredLoyalty;
            const meetsTier = this.compareTier(stats.tier, config.requiredTier as Users_Tier);
            const meetsInvestment = stats.investmentValue >= Number(config.requiredInvestment);

            if (meetsStreak && meetsLoyalty && meetsTier && meetsInvestment) {
                return config.level;
            }
        }

        return 1; // Default fallback
    }

    /**
     * Compare tier priority (WHALE > PRO > INVESTOR > ENTRY)
     * CORRECTION 1: Accept ENUM type
     */
    private compareTier(userTier: Users_Tier, requiredTier: Users_Tier): boolean {
        const tierPriority: Record<Users_Tier, number> = {
            'ENTRY': 1,
            'INVESTOR': 2,
            'PRO': 3,
            'WHALE': 4
        };

        return tierPriority[userTier] >= tierPriority[requiredTier];
    }

    /**
     * Calculate investment value from deposits and withdrawals
     * CORRECTION 2: Use same source as Investor Dashboard (deposits - withdrawals)
     */
    private async calculateInvestmentValue(userId: string): Promise<number> {
        // Get APPROVED deposits sum
        const userDepositsAgg = await prisma.deposit.aggregate({
            where: { userId, status: 'APPROVED' },
            _sum: { amount: true }
        });

        // Get APPROVED withdrawals sum (using amountPayout)
        const userWithdrawalsAgg = await prisma.withdrawal.aggregate({
            where: { userId, status: 'APPROVED' },
            _sum: { amountPayout: true }
        });

        const userDepositsSum = Number(userDepositsAgg._sum?.amount ?? 0);
        const userWithdrawalsSum = Number(userWithdrawalsAgg._sum?.amountPayout ?? 0);
        const investmentValue = userDepositsSum - userWithdrawalsSum;

        return Math.max(0, investmentValue); // Investment value can't be negative
    }

    /**
     * Update user's clearance level (cached value) with audit logging
     * CORRECTION 3: Idempotent + Transaction (no audit if unchanged)
     * 
     * @param userId - User ID
     * @param triggerReason - Why recalc was triggered
     */
    async updateUserClearance(
        userId: string,
        triggerReason?: string
    ): Promise<{ oldLevel: number; newLevel: number; changed: boolean }> {
        // Get user data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                clearanceLevel: true,
                streakDays: true,
                loyaltyPoints: true,
                tier: true
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // CORRECTION 2: Calculate investment from unified ledger
        const investmentValue = await this.calculateInvestmentValue(userId);

        // Calculate new clearance level
        const stats: UserClearanceStats = {
            streakDays: user.streakDays || 0,
            loyaltyPoints: user.loyaltyPoints || 0,
            tier: user.tier as Users_Tier,
            investmentValue
        };

        const newLevel = await this.calculateClearanceLevel(stats);
        const oldLevel = user.clearanceLevel || 1;
        const changed = newLevel !== oldLevel;

        // CORRECTION 3: Only update + audit if changed (idempotent)
        if (changed) {
            // Use transaction for atomicity
            await prisma.$transaction([
                // Update cached value
                prisma.user.update({
                    where: { id: userId },
                    data: { clearanceLevel: newLevel }
                }),

                // Create audit log
                prisma.auditLog.create({
                    data: {
                        userId,
                        action: 'CLEARANCE_LEVEL_UPDATE',
                        metadata: JSON.stringify({
                            oldLevel,
                            newLevel,
                            triggerReason: triggerReason || 'MANUAL_RECALC',
                            stats
                        }),
                        ipAddress: null
                    }
                })
            ]);

            console.log(`âœ… Clearance updated: User ${userId}: ${oldLevel} â†’ ${newLevel} (${triggerReason})`);
        }

        return { oldLevel, newLevel, changed };
    }

    /**
     * Get config for specific level (cached)
     * CORRECTION 4: Use cache
     */
    async getConfig(level: number) {
        const configs = await configCache.getConfigs();
        return configs.find(c => c.level === level) || null;
    }

    /**
     * Get all configs (cached)
     * CORRECTION 4: Use cache
     */
    async getAllConfigs() {
        return await configCache.getConfigs();
    }

    /**
     * Update config thresholds (admin only)
     * Invalidates cache
     */
    async updateConfig(level: number, data: any) {
        const updated = await prisma.clearanceLevelConfig.update({
            where: { level },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });

        // CORRECTION 4: Invalidate cache after update
        configCache.invalidate();

        return updated;
    }

    /**
     * Get next level requirements for user
     */
    async getNextLevelRequirements(currentLevel: number) {
        const configs = await configCache.getConfigs();
        // Already sorted desc, so find first with level > currentLevel
        return configs.find(c => c.level === currentLevel + 1) || null;
    }

    /**
     * Get user's progress toward next level
     * CORRECTION 2: Use unified ledger for investment
     */
    async getUserProgress(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { clearanceLevel: true, streakDays: true, loyaltyPoints: true, tier: true }
        });

        if (!user) return null;

        const nextLevel = await this.getNextLevelRequirements(user.clearanceLevel || 1);
        if (!nextLevel) return null; // Already at max level

        // CORRECTION 2: Calculate investment from unified ledger
        const investmentValue = await this.calculateInvestmentValue(userId);

        return {
            currentLevel: user.clearanceLevel || 1,
            nextLevel: nextLevel.level,
            progress: {
                streak: {
                    current: user.streakDays || 0,
                    required: nextLevel.requiredStreak,
                    percentage: Math.min(100, ((user.streakDays || 0) / (nextLevel.requiredStreak || 1)) * 100)
                },
                loyalty: {
                    current: user.loyaltyPoints || 0,
                    required: nextLevel.requiredLoyalty,
                    percentage: Math.min(100, ((user.loyaltyPoints || 0) / (nextLevel.requiredLoyalty || 1)) * 100)
                },
                investment: {
                    current: investmentValue,
                    required: Number(nextLevel.requiredInvestment),
                    percentage: Math.min(100, (investmentValue / (Number(nextLevel.requiredInvestment) || 1)) * 100)
                },
                tier: {
                    current: user.tier || 'ENTRY',
                    required: nextLevel.requiredTier,
                    met: this.compareTier(user.tier as Users_Tier, nextLevel.requiredTier as Users_Tier)
                }
            }
        };
    }
}
