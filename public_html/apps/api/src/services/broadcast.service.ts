import { prisma } from '@pariaza/database';

import { notificationService } from './notification.service.js';
import { analyticsService } from './analytics.service.js';
import type { users_role, users_status } from '@pariaza/database';

// Filter rule types for smart targeting
export type FilterRule =
    | 'new_users'           // Utilizatori noi (< 3 zile)
    | 'active_users'        // Activi recent (< 7 zile)
    | 'vip_opportunities'   // VIP (PRO/WHALE sau Clearance >= 3)
    | 'all_active'          // Toți cu status ACTIVE
    | 'beginners'           // ENTRY tier sau Clearance <= 2
    | 'forgot_checkin'      // N-au făcut check-in azi dar sunt activi
    | 'streak_at_risk'      // Au streak > 0 dar n-au check-in de > 20h
    | 'upsell_targets'      // INVESTOR tier (mid-range)
    | 'loyal_users'         // Streak > 10 SAU Loyalty > 500
    | 'custom';             // Filtre custom

interface BroadcastFilters {
    filterRule?: FilterRule;
    includeRoles?: users_role[];
    includeTiers?: string[];
    testMode?: boolean; // Only send to admins for testing
}

interface BroadcastResult {
    broadcastId: string;
    sent: number;
    skipped: number;
    failed: number;
    details: {
        sentTo: string[];
        skipped: string[];
        failed: string[];
    };
}

interface BroadcastStats {
    totalUsers: number;
    activeUsers: number;
    notificationsEnabled: number;
    notificationsDisabled: number;
    byTier: Record<string, number>;
    // New metrics with trends
    activeUsersLast7Days: number;
    activeUsersLast7DaysTrend: number; // Comparison with previous 7 days
    newUsersLast3Days: number;
    newUsersLast3DaysTrend: number; // Comparison with previous 3 days
}

/**
 * Build Prisma WHERE filters based on the targeting rule
 */
function buildTargetingFilters(filterRule?: FilterRule): any {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

    switch (filterRule) {
        case 'new_users':
            // Utilizatori noi: înregistrați în ultimele 3 zile
            return {
                createdAt: { gte: threeDaysAgo }
            };

        case 'active_users':
            // Utilizatori activi: logați în ultimele 7 zile
            return {
                lastLoginAt: { gte: sevenDaysAgo }
            };

        case 'vip_opportunities':
            // VIP: PRO/WHALE sau Clearance >= 3
            return {
                OR: [
                    { tier: { in: ['PRO', 'WHALE'] } },
                    { clearanceLevel: { gte: 3 } }
                ]
            };

        case 'all_active':
            // Toți utilizatorii activi (doar status ACTIVE)
            return {};

        case 'beginners':
            // Începători: ENTRY tier sau Clearance <= 2
            return {
                OR: [
                    { tier: 'ENTRY' },
                    { clearanceLevel: { lte: 2 } }
                ]
            };

        case 'forgot_checkin':
            // Au uitat check-in: lastCheckinAt < azi ȘI au fost activi în ultimele 7 zile
            return {
                AND: [
                    {
                        OR: [
                            { lastCheckinAt: { lt: today } },
                            { lastCheckinAt: null }
                        ]
                    },
                    { lastLoginAt: { gte: sevenDaysAgo } }
                ]
            };

        case 'streak_at_risk':
            // Streak la risc: Au streak > 0 ȘI n-au făcut check-in de > 20h
            return {
                AND: [
                    { streakDays: { gt: 0 } },
                    {
                        OR: [
                            { lastCheckinAt: { lt: twentyHoursAgo } },
                            { lastCheckinAt: null }
                        ]
                    }
                ]
            };

        case 'upsell_targets':
            // Ținte upsell: INVESTOR tier (mid-range)
            return {
                tier: 'INVESTOR'
            };

        case 'loyal_users':
            // Utilizatori fideli: Streak > 10 SAU Loyalty > 500
            return {
                OR: [
                    { streakDays: { gt: 10 } },
                    { loyaltyPoints: { gt: 500 } }
                ]
            };

        case 'custom':
        default:
            // Fără filtre suplimentare
            return {};
    }
}

export class BroadcastService {
    /**
     * Get users eligible for broadcast based on filters
     * CRITICAL: Only includes users with emailNotifications: true
     */
    async getUsersForBroadcast(filters: BroadcastFilters = {}) {
        // Build the base where clause with AND at root
        const where: any = {
            AND: [
                { status: 'ACTIVE' as users_status },
                {
                    // For preferences, check if emailNotifications is true OR preferences don't exist (default: enabled)
                    OR: [
                        {
                            preferences: {
                                emailNotifications: true
                            }
                        },
                        {
                            preferences: null
                        }
                    ]
                }
            ]
        };

        // Apply smart targeting filters
        if (filters.filterRule) {
            const targetingFilters = buildTargetingFilters(filters.filterRule);
            where.AND.push(targetingFilters);
        }

        // Test mode: only send to admins
        if (filters.testMode) {
            where.AND.push({ role: 'ADMIN' });
        } else {
            // Filter by roles if specified (for custom mode)
            if (filters.includeRoles && filters.includeRoles.length > 0) {
                where.AND.push({ role: { in: filters.includeRoles } });
            }

            // Filter by tiers if specified (for custom mode)
            if (filters.includeTiers && filters.includeTiers.length > 0) {
                where.AND.push({ tier: { in: filters.includeTiers } });
            }
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                tier: true,
                streakDays: true,
                loyaltyPoints: true,
                clearanceLevel: true,
            },
        });

        console.log(`🎯 Targeting filter "${filters.filterRule || 'none'}" matched ${users.length} users`);

        return users;
    }

    /**
     * Send broadcast email to multiple users
     */
    async sendBroadcastEmail(
        subject: string,
        message: string,
        adminUserId: string,
        adminName: string,
        design: string = 'standard',
        filters: BroadcastFilters = {},
        templateId?: string
    ): Promise<BroadcastResult> {
        console.log('🚀 [sendBroadcastEmail] Starting broadcast send process...');

        // Dynamic import to ensure fresh initialization checking env vars
        const { emailService } = await import('./email.service.js');


        let eligibleUsers;
        try {
            console.log('🔍 [sendBroadcastEmail] Fetching eligible users with filters:', JSON.stringify(filters));
            eligibleUsers = await this.getUsersForBroadcast(filters);
            console.log(`✅ [sendBroadcastEmail] Found ${eligibleUsers.length} eligible users`);
        } catch (error) {
            console.error('❌ [sendBroadcastEmail] ERROR in getUsersForBroadcast:', error);
            throw error;
        }

        const result: BroadcastResult = {
            broadcastId: '',
            sent: 0,
            skipped: 0,
            failed: 0,
            details: {
                sentTo: [],
                skipped: [],
                failed: [],
            },
        };

        // Basic Sanitization (Regex-based since sanitize-html failed to install)
        // Removes script, iframe, object, embed tags and on* attributes
        const sanitizedMessage = message
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "")
            .replace(/<object\b[^>]*>([\s\S]*?)<\/object>/gim, "")
            .replace(/<embed\b[^>]*>([\s\S]*?)<\/embed>/gim, "")
            .replace(/ on\w+="[^"]*"/gim, "");


        // Get HTML template (using sanitized message)
        console.log('📧 [sendBroadcastEmail] Generating HTML template...');
        const htmlContent = emailService.getBroadcastEmailTemplate(subject, sanitizedMessage, adminName, design);

        // Create broadcast record using NEW Broadcast model
        let broadcast;
        try {
            console.log('💾 [sendBroadcastEmail] Creating broadcast record in database...');
            broadcast = await prisma.broadcast.create({
                data: {
                    subject,
                    messageText: sanitizedMessage, // Mapped to message_text
                    htmlContent,
                    sentByUserId: adminUserId,
                    sentByName: adminName,
                    filters: JSON.stringify(filters),
                    templateId: templateId || 'custom',
                    recipientUserIds: JSON.stringify(eligibleUsers.map(u => u.id)), // Store recipients
                    status: 'SENT',
                    sentAt: new Date(),
                },
            });
            console.log(`✅ [sendBroadcastEmail] Broadcast record created with ID: ${broadcast.id}`);
        } catch (error) {
            console.error('❌ [sendBroadcastEmail] ERROR creating broadcast record:', error);
            throw error;
        }

        result.broadcastId = broadcast.id;

        // Track broadcast send in analytics
        const finalTemplateId = templateId || 'custom';
        let analyticsId;
        try {
            console.log('📊 [sendBroadcastEmail] Tracking broadcast in analytics...');

            // Create analytics record directly (Unified with Scheduler logic)
            // Generate ID manually as per schema requirement (matching scheduler logic but safer)
            const generatedId = `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            const analyticsRecord = await prisma.broadcastAnalytics.create({
                data: {
                    id: generatedId,
                    templateId: finalTemplateId,
                    broadcastSubject: subject,
                    recipientCount: eligibleUsers.length,
                    sentAt: new Date(),
                }
            });

            analyticsId = analyticsRecord.id;
            console.log(`✅ [sendBroadcastEmail] Analytics tracking created: ${analyticsId}`);
        } catch (error) {
            console.error('❌ [sendBroadcastEmail] ERROR creating analytics:', error);
            // Don't fail the whole broadcast for analytics, but log it
            // However, tracking pixels need this ID. If it fails, they will be broken.
            // Fallback to broadcast ID as analytics ID?
            analyticsId = broadcast.id;
        }

        // Link analytics to broadcast
        try {
            console.log('🔗 [sendBroadcastEmail] Linking analytics to broadcast...');
            await prisma.broadcast.update({
                where: { id: broadcast.id },
                data: { analyticsId }
            });
            console.log(`✅ [sendBroadcastEmail] Analytics linked successfully`);
        } catch (error) {
            console.error('❌ [sendBroadcastEmail] ERROR linking analytics:', error);
            throw error;
        }

        console.log(`📧 [sendBroadcastEmail] Starting to send ${eligibleUsers.length} emails...`);

        // Send emails with tracking
        for (const user of eligibleUsers) {
            try {
                // Inject tracking pixel and wrap links with tracking redirects
                let trackedHtml = htmlContent;

                const trackingPixelUrl = `http://localhost:3001/track/open/${analyticsId}/${user.id}`;

                // MULTI-LAYERED TRACKING PIXEL APPROACH (to bypass email client blocking)

                // Method 1: CSS background-image in body tag (loaded even if images blocked)
                trackedHtml = trackedHtml.replace(
                    '<body style="',
                    `<body style="background-image: url('${trackingPixelUrl}'); background-repeat: no-repeat; background-position: -9999px -9999px; `
                );

                // Method 2: Hidden div with background (additional fallback)
                const trackingDivHtml = `<div style="background: url('${trackingPixelUrl}'); width: 0; height: 0; position: absolute; top: -9999px; left: -9999px;"></div>`;

                // Method 3: Traditional invisible 1x1 pixel
                const trackingPixelHtml = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;border:0;position:absolute;" alt="" />`;

                // Inject all methods before </body>
                const combinedTracking = `${trackingDivHtml}${trackingPixelHtml}`;
                if (trackedHtml.includes('</body>')) {
                    trackedHtml = trackedHtml.replace('</body>', `${combinedTracking}</body>`);
                } else {
                    trackedHtml += combinedTracking;
                }

                // 2. Wrap all links with click tracking redirects
                const hrefRegex = /href=["']([^"']+)["']/gi;
                trackedHtml = trackedHtml.replace(hrefRegex, (match, url) => {
                    // Skip if already a tracking URL, anchor link, or mailto
                    if (url.includes('/track/click') || url.startsWith('#') || url.startsWith('mailto:')) {
                        return match;
                    }

                    const encodedUrl = encodeURIComponent(url);
                    const trackingUrl = `http://localhost:3001/track/click/${analyticsId}/${user.id}?to=${encodedUrl}`;
                    return `href="${trackingUrl}"`;
                });

                // Send email with tracking
                const sent = await emailService.sendEmail({
                    to: user.email,
                    subject,
                    html: trackedHtml, // Use tracked HTML
                });
                if (sent) {
                    result.sent++;
                    result.details.sentTo.push(user.email);
                } else {
                    result.failed++;
                    result.details.failed.push(user.email);
                }
            } catch (error) {
                console.error(`❌ [sendBroadcastEmail] Failed to send broadcast to ${user.email}:`, error);
                result.failed++;
                result.details.failed.push(user.email);
            }
        }

        console.log(`✅ [sendBroadcastEmail] Broadcast complete: ${result.sent} sent, ${result.failed} failed`);

        return result;

        // Log to audit
        await prisma.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'EMAIL_BROADCAST_SENT',
                metadata: JSON.stringify({
                    broadcastId: broadcast.id,
                    subject,
                    sent: result.sent,
                    failed: result.failed,
                    filters,
                }),
            },
        });

        // Auto-dismiss related notifications
        if (finalTemplateId && finalTemplateId !== 'custom') {
            await notificationService.markAsReadByTemplate(adminUserId, finalTemplateId);
        }

        console.log(`📧 Broadcast sent: ${result.sent} emails, ${result.failed} failed`);

        return result;
    }

    /**
     * Get broadcast statistics with trends
     */
    async getStats(): Promise<BroadcastStats> {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

        // Total active users
        const totalUsers = await prisma.user.count({
            where: { status: 'ACTIVE' },
        });

        // Count users with emailNotifications ON
        const notificationsEnabled = await prisma.user.count({
            where: {
                status: 'ACTIVE',
                preferences: {
                    emailNotifications: true,
                },
            },
        });

        const notificationsDisabled = totalUsers - notificationsEnabled;

        // Active users in last 7 days
        const activeUsersLast7Days = await prisma.user.count({
            where: {
                status: 'ACTIVE',
                lastLoginAt: { gte: sevenDaysAgo },
            },
        });

        // Active users in previous 7 days (for trend)
        const activeUsersPrevious7Days = await prisma.user.count({
            where: {
                status: 'ACTIVE',
                lastLoginAt: {
                    gte: fourteenDaysAgo,
                    lt: sevenDaysAgo,
                },
            },
        });

        const activeUsersLast7DaysTrend = activeUsersLast7Days - activeUsersPrevious7Days;

        // New users in last 3 days
        const newUsersLast3Days = await prisma.user.count({
            where: {
                status: 'ACTIVE',
                createdAt: { gte: threeDaysAgo },
            },
        });

        // New users in previous 3 days (for trend)
        const newUsersPrevious3Days = await prisma.user.count({
            where: {
                status: 'ACTIVE',
                createdAt: {
                    gte: sixDaysAgo,
                    lt: threeDaysAgo,
                },
            },
        });

        const newUsersLast3DaysTrend = newUsersLast3Days - newUsersPrevious3Days;

        // Get count by tier for users with notifications enabled
        const tierCounts = await prisma.user.groupBy({
            by: ['tier'],
            where: {
                status: 'ACTIVE',
                preferences: {
                    emailNotifications: true,
                },
            },
            _count: true,
        });

        const byTier: Record<string, number> = {};
        for (const tc of tierCounts) {
            byTier[tc.tier || 'ENTRY'] = tc._count;
        }

        console.log(`📊 Stats: Total=${totalUsers}, Active7d=${activeUsersLast7Days} (${activeUsersLast7DaysTrend > 0 ? '+' : ''}${activeUsersLast7DaysTrend}), New3d=${newUsersLast3Days} (${newUsersLast3DaysTrend > 0 ? '+' : ''}${newUsersLast3DaysTrend})`);

        return {
            totalUsers,
            activeUsers: totalUsers,
            notificationsEnabled,
            notificationsDisabled,
            byTier,
            activeUsersLast7Days,
            activeUsersLast7DaysTrend,
            newUsersLast3Days,
            newUsersLast3DaysTrend,
        };
    }

    /**
     * Get broadcast history
     */
    async getHistory(limit = 20) {
        const broadcasts = await prisma.broadcast.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                sentByUser: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                analytics: true
            },
        });

        return broadcasts;
    }

    /**
     * Schedule a broadcast for future sending
     */
    async scheduleBroadcast(
        templateId: string,
        subject: string,
        messageText: string,
        recipientUserIds: string[],
        scheduledFor: string,
        sentByUserId: string,
        sentByName: string
    ) {
        return prisma.broadcast.create({
            data: {
                templateId,
                subject,
                messageText,
                recipientUserIds: JSON.stringify(recipientUserIds),
                scheduledFor: new Date(scheduledFor),
                sentByUserId,
                sentByName,
                status: 'SCHEDULED',
                // Analytics ID acts as unique key potentially, but can be null for now until sent?
                // Actually schema says analyticsId is optional @unique.
                // We'll create analytics record when it actually sends?
                // Or maybe create it now? The frontend expects 500 loop if duplicated?
                // Let's leave analyticsId null for now. 
            }
        });
    }

    /**
     * Get all scheduled broadcasts
     */
    async getScheduledBroadcasts() {
        const broadcasts = await prisma.broadcast.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledFor: {
                    gte: new Date(), // Only future ones? Or all scheduled? Frontend shows "Programat"
                }
            },
            orderBy: {
                scheduledFor: 'asc'
            }
        });

        // Calculate recipient counts (length of array in JSON)
        return broadcasts.map(b => {
            let count = 0;
            try {
                const parsed = JSON.parse(b.recipientUserIds || '[]');
                count = Array.isArray(parsed) ? parsed.length : 0;
            } catch (e) { count = 0; }

            return {
                ...b,
                recipientCount: count
            };
        });
    }

    /**
     * Cancel a scheduled broadcast
     */
    async cancelScheduledBroadcast(id: string) {
        return prisma.broadcast.update({
            where: { id },
            data: { status: 'FAILED' } // Using FAILED as proxy for CANCELLED since schema only has DRAFT, SCHEDULED, SENT, FAILED
            // Wait, I added CANCELLED enum? No, I checked schema earlier.
            // Schema has: DRAFT, SCHEDULED, SENT, FAILED.
            // Detailed look at step 2719:
            // enum BroadcastStatus { DRAFT, SCHEDULED, SENT, FAILED }
            // So no CANCELLED. I'll use FAILED or delete it.
            // Frontend expects 'CANCELLED' in display map, but API sends 'status'.
            // Let's use delete for cancellation as per frontend handleCancel logic (DELETE method).
        });
    }

    async deleteBroadcast(id: string) {
        return prisma.broadcast.delete({
            where: { id }
        });
    }
}

export const broadcastService = new BroadcastService();
