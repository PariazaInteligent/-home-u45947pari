import { PrismaClient } from '@pariaza/database';

const prisma = new PrismaClient();

export class LoyaltyService {
    /**
     * Evaluate and award points for a specific event
     */
    async evaluateAndAwardPoints(userId: string, eventType: string, context: any) {
        console.log(`[Loyalty] Evaluating ${eventType} for user ${userId}`);

        // Get active rules for this event type
        const rules = await prisma.loyaltyRule.findMany({
            where: {
                eventType,
                isActive: true,
                OR: [
                    { validFrom: null },
                    { validFrom: { lte: new Date() } }
                ]
            },
            orderBy: { priority: 'desc' }
        });

        console.log(`[Loyalty] Found ${rules.length} active rules for ${eventType}`);

        for (const rule of rules) {
            // Check if rule is still valid (validUntil)
            if (rule.validUntil && rule.validUntil < new Date()) {
                continue;
            }

            const isEligible = await this.checkEligibility(userId, rule, context);

            if (isEligible) {
                await this.awardPoints(userId, rule, context);
            }
        }
    }

    /**
     * Check if user is eligible for a specific rule
     */
    private async checkEligibility(userId: string, rule: any, context: any): Promise<boolean> {
        // Check if user already claimed (if not repeatable)
        if (!rule.isRepeatable) {
            const existing = await prisma.loyaltyEvent.findFirst({
                where: { userId, ruleId: rule.id }
            });
            if (existing) {
                console.log(`[Loyalty] User ${userId} already claimed non-repeatable rule ${rule.ruleName}`);
                return false;
            }
        }

        // Check max occurrences
        if (rule.maxOccurrences) {
            const count = await prisma.loyaltyEvent.count({
                where: { userId, ruleId: rule.id }
            });
            if (count >= rule.maxOccurrences) {
                console.log(`[Loyalty] User ${userId} reached max occurrences for rule ${rule.ruleName}`);
                return false;
            }
        }

        // Evaluate conditions JSON
        if (rule.conditionsJson) {
            try {
                const conditions = JSON.parse(rule.conditionsJson);
                const meetsConditions = this.evaluateConditions(conditions, context);
                if (!meetsConditions) {
                    console.log(`[Loyalty] User ${userId} does not meet conditions for rule ${rule.ruleName}`);
                    return false;
                }
            } catch (error) {
                console.error(`[Loyalty] Error parsing conditions for rule ${rule.ruleName}:`, error);
                return false;
            }
        }

        return true;
    }

    /**
     * Evaluate JSON conditions against context
     */
    private evaluateConditions(conditions: any, context: any): boolean {
        for (const [key, value] of Object.entries(conditions)) {
            if (key === 'minStreak' && (context.streak || 0) < value) return false;
            if (key === 'minInvestment' && (context.investment || 0) < value) return false;
            if (key === 'minHoldDays' && (context.holdDays || 0) < value) return false;
            if (key === 'minROI' && (context.roi || 0) < value) return false;
            if (key === 'minAccountAgeDays' && (context.accountAgeDays || 0) < value) return false;
            // Add more condition types as needed
        }

        return true;
    }

    /**
     * Award points to user and create event record
     */
    private async awardPoints(userId: string, rule: any, context: any) {
        try {
            // Create event record
            await prisma.loyaltyEvent.create({
                data: {
                    userId,
                    ruleId: rule.id,
                    pointsAwarded: rule.pointsAwarded,
                    triggerData: JSON.stringify(context)
                }
            });

            // Update user total
            await prisma.user.update({
                where: { id: userId },
                data: {
                    loyaltyPoints: { increment: rule.pointsAwarded }
                }
            });

            console.log(`[Loyalty] ✅ Awarded ${rule.pointsAwarded} points to user ${userId} for rule "${rule.ruleName}"`);
        } catch (error) {
            console.error(`[Loyalty] Error awarding points:`, error);
        }
    }

    /**
     * Get loyalty breakdown for a user
     */
    async getUserLoyaltyBreakdown(userId: string) {
        const events = await prisma.loyaltyEvent.groupBy({
            by: ['ruleId'],
            where: { userId },
            _sum: { pointsAwarded: true },
            _count: true
        });

        const breakdown = await Promise.all(
            events.map(async (item) => {
                const rule = await prisma.loyaltyRule.findUnique({
                    where: { id: item.ruleId },
                    select: { ruleName: true, eventType: true }
                });

                const lastEvent = await prisma.loyaltyEvent.findFirst({
                    where: { userId, ruleId: item.ruleId },
                    orderBy: { awardedAt: 'desc' }
                });

                return {
                    ruleName: rule?.ruleName || 'Unknown',
                    eventType: rule?.eventType || 'UNKNOWN',
                    totalPoints: item._sum.pointsAwarded || 0,
                    occurrences: item._count,
                    lastAwarded: lastEvent?.awardedAt
                };
            })
        );

        return breakdown;
    }
}
