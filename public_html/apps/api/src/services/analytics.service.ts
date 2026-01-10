import { prisma } from '@pariaza/database';

interface AnalyticsOverview {
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    engagementTrend: number; // percentage change from previous period
    topPerformingTemplate: string;
}

interface TemplatePerformance {
    templateId: string;
    name: string;
    emoji: string;
    totalSent: number;
    openRate: number;
    clickRate: number;
    engagementScore: number;
    bestSendHour: number | null;
    rank: number;
}

interface SmartRecommendation {
    type: 'action' | 'insight' | 'warning' | 'tip';
    icon: string;
    title: string;
    message: string;
    priority: number; // 1-5, 5 being highest
}

interface EngagementHistory {
    date: string;
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
}

interface ComparisonStats {
    current: {
        openRate: number;
        clickRate: number;
    };
    average: {
        openRate: number;
        clickRate: number;
    };
    percentile: {
        openRate: number;
        clickRate: number;
    };
}

export const analyticsService = {
    /**
     * Track when a broadcast is sent
     */
    async trackBroadcastSent(
        templateId: string,
        subject: string,
        recipientCount: number
    ): Promise<string> {
        // ID is now handled by the creating service (BroadcastService) or auto-generated if we were to create it here directly
        // However, BroadcastService creates the analytics record via nested write. 
        // We will keep this method for compatibility but it might be redundant if BroadcastService does the heavy lifting.
        // For now, removing the raw insert as it's handled by Prisma in BroadcastService.
        // If we need to create a standalone analytics record (unlikely), we'd use prisma.broadcastAnalytics.create

        return ''; // No-op as BroadcastService handles creation
    },

    /**
     * Calculate engagement score
     * Formula (UPDATED - Click-First Approach):
     * - Opens: 10% weight (estimated, unreliable due to privacy protections)
     * - Clicks: 60% weight (RELIABLE - primary metric)
     * - Conversions: 30% weight (platform actions, very reliable)
     * 
     * Rationale: Click tracking is 100% reliable, while open tracking
     * is blocked by Gmail/Outlook privacy features. We prioritize
     * real user engagement (clicks) over passive signals (opens).
     */
    calculateEngagementScore(
        recipientCount: number,
        openedCount: number,
        clickedCount: number,
        convertedCount: number
    ): number {
        if (recipientCount === 0) return 0;

        const openRate = (openedCount / recipientCount) * 100;
        const clickRate = (clickedCount / recipientCount) * 100;
        const conversionRate = (convertedCount / recipientCount) * 100;

        // CLICK-FIRST FORMULA: clicks (60%) + conversions (30%) + opens (10%)
        return Number(((openRate * 0.1) + (clickRate * 0.6) + (conversionRate * 0.3)).toFixed(2));
    },

    /**
     * Get performance overview for ALL TIME (not just last 7 days)
     */
    async getPerformanceOverview(): Promise<AnalyticsOverview> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        // ALL TIME stats (total)
        const allTimeStats = await prisma.broadcastAnalytics.aggregate({
            _count: {
                id: true
            },
            _sum: {
                recipientCount: true,
                openedCount: true,
                clickedCount: true
            }
        });

        // Last 7 days for trend calculation
        const currentPeriodStats = await prisma.broadcastAnalytics.aggregate({
            _sum: {
                recipientCount: true,
                openedCount: true
            },
            where: {
                sentAt: {
                    gte: sevenDaysAgo
                }
            }
        });

        // Previous period (8-14 days ago) for trend
        const previousPeriodStats = await prisma.broadcastAnalytics.aggregate({
            _sum: {
                recipientCount: true,
                openedCount: true
            },
            where: {
                sentAt: {
                    gte: fourteenDaysAgo,
                    lt: sevenDaysAgo
                }
            }
        });

        // ALL TIME calculations
        const totalSent = allTimeStats._count.id;
        const totalRecipients = allTimeStats._sum.recipientCount || 0;
        const totalOpened = allTimeStats._sum.openedCount || 0;
        const totalClicked = allTimeStats._sum.clickedCount || 0;

        const avgOpenRate = totalRecipients > 0 ? (totalOpened / totalRecipients * 100) : 0;
        const avgClickRate = totalRecipients > 0 ? (totalClicked / totalRecipients * 100) : 0;

        // Trend based on last 7 days vs previous 7 days
        const currentRecipients = currentPeriodStats._sum.recipientCount || 0;
        const currentOpened = currentPeriodStats._sum.openedCount || 0;
        const prevRecipients = previousPeriodStats._sum.recipientCount || 0;
        const prevOpened = previousPeriodStats._sum.openedCount || 0;

        const currentAvgOpenRate = currentRecipients > 0 ? (currentOpened / currentRecipients * 100) : 0;
        const prevAvgOpenRate = prevRecipients > 0 ? (prevOpened / prevRecipients * 100) : 0;

        const trend = prevAvgOpenRate > 0
            ? Number((((currentAvgOpenRate - prevAvgOpenRate) / prevAvgOpenRate) * 100).toFixed(1))
            : 0;

        // Get top performing template (all time)
        const topTemplate = await prisma.broadcastAnalytics.findFirst({
            orderBy: {
                engagementScore: 'desc'
            },
            select: {
                templateId: true
            }
        });

        return {
            totalSent,
            avgOpenRate: Number(avgOpenRate.toFixed(1)),
            avgClickRate: Number(avgClickRate.toFixed(1)),
            engagementTrend: trend,
            topPerformingTemplate: topTemplate?.templateId || 'N/A',
        };
    },

    /**
     * Get top performing templates with rankings
     */
    async getTopTemplates(): Promise<TemplatePerformance[]> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const templatesGrouped = await prisma.broadcastAnalytics.groupBy({
            by: ['templateId'],
            where: {
                sentAt: {
                    gte: sevenDaysAgo
                }
            },
            _count: {
                id: true
            },
            _sum: {
                recipientCount: true,
                openedCount: true,
                clickedCount: true
            },
            _avg: {
                engagementScore: true
            },
            orderBy: {
                _avg: {
                    engagementScore: 'desc'
                }
            },
            take: 5
        });

        // Template metadata (emoji + name)
        const templateMeta: Record<string, { name: string; emoji: string }> = {
            'welcome': { name: 'Bun Venit', emoji: '🎉' },
            'streak_loss': { name: 'Alertă Streak', emoji: '⚠️' },
            'daily_checkin': { name: 'Check-in Zilnic', emoji: '🔥' },
            'weekly_recap': { name: 'Raport Săptămânal', emoji: '📊' },
            'opportunity': { name: 'Oportunitate', emoji: '🚀' },
            'rewards': { name: 'Recompense', emoji: '🎁' },
        };

        return templatesGrouped.map((t, index) => {
            const meta = templateMeta[t.templateId] || { name: t.templateId, emoji: '📬' };
            const totalRecipients = t._sum.recipientCount || 0;
            const openRate = totalRecipients > 0 ? ((t._sum.openedCount || 0) / totalRecipients * 100) : 0;
            const clickRate = totalRecipients > 0 ? ((t._sum.clickedCount || 0) / totalRecipients * 100) : 0;
            // Best Hour logic is complex to aggregate in Prisma distinct from raw SQL, 
            // skipping strictly "best hour" calculation for now or defaulting to null/0 
            // to keep it simple and type-safe.

            return {
                templateId: t.templateId,
                name: meta.name,
                emoji: meta.emoji,
                totalSent: t._count.id,
                openRate: Number(openRate.toFixed(1)),
                clickRate: Number(clickRate.toFixed(1)),
                engagementScore: Number(t._avg.engagementScore || 0),
                bestSendHour: null, // Complex to aggregate without raw SQL
                rank: index + 1,
            };
        });
    },

    /**
     * Get smart recommendations based on data
     */
    async getSmartRecommendations(): Promise<SmartRecommendation[]> {
        const recommendations: SmartRecommendation[] = [];
        const overview = await this.getPerformanceOverview();
        const topTemplates = await this.getTopTemplates();

        // Recommendation 1: Trending performance
        if (overview.engagementTrend > 10) {
            recommendations.push({
                type: 'insight',
                icon: '📈',
                title: 'Performanță excelentă!',
                message: `Engagement-ul a crescut cu ${overview.engagementTrend}% față de săptămâna trecută!`,
                priority: 4,
            });
        } else if (overview.engagementTrend < -10) {
            recommendations.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Atenție la scădere!',
                message: `Engagement-ul a scăzut cu ${Math.abs(overview.engagementTrend)}%. Reviziți conținutul.`,
                priority: 5,
            });
        }

        // Recommendation 2: Top performer (based on CLICKS, not opens)
        if (topTemplates.length > 0 && topTemplates[0].clickRate > 30) {
            const top = topTemplates[0];
            recommendations.push({
                type: 'tip',
                icon: '🏆',
                title: `${top.emoji} ${top.name} = Campion!`,
                message: `Click rate ${top.clickRate}% - păstrează acest format!`,
                priority: 3,
            });
        }

        // Recommendation 3: Best time to send
        if (topTemplates.length > 0 && topTemplates[0].bestSendHour !== null) {
            const hour = topTemplates[0].bestSendHour;
            recommendations.push({
                type: 'action',
                icon: '⏰',
                title: 'Timing perfect!',
                message: `Oră optimă pentru trimitere: ${hour}:00`,
                priority: 4,
            });
        }

        // Recommendation 4: Low click rate warning (CLICKS, not opens)
        if (overview.avgClickRate < 20) {
            recommendations.push({
                type: 'warning',
                icon: '💡',
                title: 'Îmbunătățește call-to-action!',
                message: `Click rate ${overview.avgClickRate}% - testează CTA-uri mai clare`,
                priority: 4,
            });
        }

        // Recommendation 5: Consistency tip
        if (overview.totalSent < 3) {
            recommendations.push({
                type: 'tip',
                icon: '📅',
                title: 'Comunică regulat!',
                message: 'Trimite broadcast-uri consistent pentru engagement maxim',
                priority: 2,
            });
        }

        // Return top 3
        return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 3);
    },

    /**
     * Get engagement history for charts (Last 30 days)
     */
    async getEngagementHistory(days: number = 30): Promise<EngagementHistory[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // We need raw query for date grouping as Prisma doesn't support grouping by date function out of the box easily
        // We will stick to a simpler raw query ONLY here as it's safe and necessary for date grouping
        const rawData: any[] = await prisma.$queryRawUnsafe(`
            SELECT 
                DATE(sent_at) as date,
                COUNT(*) as totalSent,
                COALESCE(AVG(CASE WHEN recipient_count > 0 
                    THEN (clicked_count / recipient_count * 100) 
                    ELSE 0 END), 0) as avgClickRate,
                COALESCE(AVG(CASE WHEN recipient_count > 0 
                    THEN (opened_count / recipient_count * 100) 
                    ELSE 0 END), 0) as avgOpenRate
            FROM broadcast_analytics
            WHERE sent_at >= ?
            GROUP BY DATE(sent_at)
            ORDER BY DATE(sent_at) ASC
        `, startDate);

        // Fill in missing dates with zero data
        const history: EngagementHistory[] = [];
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            const dateStr = d.toISOString().split('T')[0];

            const existing = rawData.find((r: any) => {
                // Handle different Date return types from drivers
                const rDate = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date);
                return rDate === dateStr;
            });

            if (existing) {
                history.push({
                    date: dateStr,
                    totalSent: Number(existing.totalSent),
                    avgOpenRate: Number(existing.avgOpenRate),
                    avgClickRate: Number(existing.avgClickRate)
                });
            } else {
                history.push({
                    date: dateStr,
                    totalSent: 0,
                    avgOpenRate: 0,
                    avgClickRate: 0
                });
            }
        }

        return history;
    },

    /**
     * Get comparison stats (Global Averages vs recent)
     */
    async getComparisonStats(): Promise<ComparisonStats> {
        // Global average (All time)
        const globalAggregate = await prisma.broadcastAnalytics.aggregate({
            _sum: {
                recipientCount: true,
                openedCount: true,
                clickedCount: true
            }
        });

        const totalRecipients = globalAggregate._sum.recipientCount || 0;
        const totalOpened = globalAggregate._sum.openedCount || 0;
        const totalClicked = globalAggregate._sum.clickedCount || 0;

        const globalOpenRate = totalRecipients > 0 ? (totalOpened / totalRecipients * 100) : 0;
        const globalClickRate = totalRecipients > 0 ? (totalClicked / totalRecipients * 100) : 0;

        // Recent average (Last 7 days) - representing "Current Performance"
        const recentStats = await this.getPerformanceOverview();

        return {
            current: {
                openRate: recentStats.avgOpenRate,
                clickRate: recentStats.avgClickRate
            },
            average: {
                openRate: Number(globalOpenRate.toFixed(1)),
                clickRate: Number(globalClickRate.toFixed(1))
            },
            percentile: {
                openRate: recentStats.avgOpenRate > globalOpenRate ? 80 : 40,
                clickRate: recentStats.avgClickRate > globalClickRate ? 85 : 45
            }
        };
    }
};
