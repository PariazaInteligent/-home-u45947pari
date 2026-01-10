import { PrismaClient } from '@pariaza/database';

const prisma = new PrismaClient();

export class DailySnapshotService {
    /**
     * Create daily snapshot + update profit-based streaks
     * Runs via cron at 00:05 daily
     */
    async createDailySnapshot() {
        console.log('[DailySnapshot] Starting daily snapshot creation...');

        try {
            // 1. Calculate total fund value from ledger
            const totalFundValue = await this.getTotalFundValue();
            console.log(`[DailySnapshot] Total fund value: ${totalFundValue} EUR`);

            // 2. Get yesterday's snapshot
            const yesterday = await prisma.dailySnapshot.findFirst({
                orderBy: { snapshotDate: 'desc' }
            });

            // 3. Determine profit flag
            const profitFlag = yesterday
                ? Number(totalFundValue) > Number(yesterday.totalFundValue)
                : false;

            console.log(`[DailySnapshot] Profit flag: ${profitFlag} (prev: ${yesterday?.totalFundValue || 0})`);

            // 4. Create snapshot
            const snapshot = await prisma.dailySnapshot.create({
                data: {
                    snapshotDate: new Date(),
                    totalFundValue,
                    profitFlag
                }
            });

            console.log(`[DailySnapshot] Snapshot created: ${snapshot.id}`);

            // 5. Update user streaks based on config
            await this.updateProfitStreaks(profitFlag);

            return snapshot;
        } catch (error) {
            console.error('[DailySnapshot] Error:', error);
            throw error;
        }
    }

    /**
     * Calculate total fund value from all user balances
     */
    private async getTotalFundValue(): Promise<number> {
        const result = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COALESCE(SUM(
        (SELECT COALESCE(SUM(amount), 0) FROM ledger_lines WHERE creditAccountId = a.id) -
        (SELECT COALESCE(SUM(amount), 0) FROM ledger_lines WHERE debitAccountId = a.id)
      ), 0) as total
      FROM accounts a
      WHERE a.type = 'ASSET' AND a.isSystem = false
    `;

        return Number(result[0]?.total || 0);
    }

    /**
     * Update profit-based streaks for all users
     */
    private async updateProfitStreaks(isProfitable: boolean) {
        const config = await prisma.streakConfig.findFirst();

        if (!config || !config.enabled) {
            console.log('[DailySnapshot] Streak config disabled, skipping updates');
            return;
        }

        // PROFIT_BASED or HYBRID
        if (config.streakType === 'PROFIT_BASED' || config.streakType === 'HYBRID') {
            if (isProfitable) {
                // Increment all user streaks
                const result = await prisma.user.updateMany({
                    data: {
                        streakDays: { increment: 1 }
                    }
                });
                console.log(`[DailySnapshot] Incremented streak for ${result.count} users`);
            } else {
                // Loss day
                if (config.fallbackToCheckIn) {
                    // Keep check-in streaks, reset others
                    console.log('[DailySnapshot] Loss day - keeping check-in streaks via fallback');
                } else {
                    // Reset all profit-based streaks
                    const result = await prisma.user.updateMany({
                        data: {
                            streakDays: 0
                        }
                    });
                    console.log(`[DailySnapshot] Reset streak for ${result.count} users (no profit)`);
                }
            }
        }

        // CHECKIN_BASED uses existing check-in logic, no changes here
    }

    /**
     * Manual trigger for testing
     */
    async manualTrigger() {
        console.log('[DailySnapshot] Manual trigger requested');
        return await this.createDailySnapshot();
    }
}
