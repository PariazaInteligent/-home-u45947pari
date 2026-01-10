import { FastifyInstance } from 'fastify';
import { prisma } from '@pariaza/database';

export async function broadcastHistoryRoutes(app: FastifyInstance) {


    /**
     * GET /admin/broadcast/history
     * Get paginated list of all broadcasts for transparency dashboard
     */
    app.get('/admin/broadcast/history', async (request, reply) => {
        const { page = '1', limit = '20', templateId, startDate, endDate } = request.query as {
            page?: string;
            limit?: string;
            templateId?: string;
            startDate?: string;
            endDate?: string;
        };

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        try {
            // Build WHERE clause
            const where: any = {};
            if (templateId) where.templateId = templateId;
            if (startDate || endDate) {
                where.sentAt = {};
                if (startDate) where.sentAt.gte = new Date(startDate);
                if (endDate) where.sentAt.lte = new Date(endDate);
            }

            // Get broadcasts with analytics
            const broadcastsData = await prisma.broadcast.findMany({
                where,
                include: {
                    analytics: true
                },
                orderBy: {
                    sentAt: 'desc'
                },
                skip: offset,
                take: limitNum
            });

            // Map to response format
            const broadcasts = broadcastsData.map(b => {
                const a = b.analytics;
                const recipientCount = a?.recipientCount || 0;
                const openedCount = a?.openedCount || 0;
                const clickedCount = a?.clickedCount || 0;

                return {
                    id: b.id,
                    analyticsId: a?.id,
                    subject: b.subject,
                    templateId: b.templateId,
                    sentAt: b.sentAt,
                    sentBy: b.sentByName,
                    recipientCount,
                    openedCount,
                    clickedCount,
                    clickRate: recipientCount > 0 ? Number((clickedCount / recipientCount * 100).toFixed(1)) : 0,
                    openRate: recipientCount > 0 ? Number((openedCount / recipientCount * 100).toFixed(1)) : 0,
                    engagementScore: Number(a?.engagementScore || 0)
                };
            });

            // Get total count
            const total = await prisma.broadcast.count({ where });
            const totalPages = Math.ceil(total / limitNum);

            return reply.code(200).send({
                success: true,
                data: broadcasts,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    totalPages,
                    totalBroadcasts: total,
                },
            });
        } catch (error) {
            console.error('❌ Error fetching broadcast history:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to fetch broadcast history',
            });
        }
    });

    /**
     * GET /admin/broadcast/history/:id
     * Get detailed broadcast info with recipient list and engagement
     */
    app.get('/admin/broadcast/history/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            // Get broadcast details
            const broadcast = await prisma.broadcast.findUnique({
                where: { id },
                include: {
                    analytics: {
                        include: {
                            events: true
                        }
                    }
                }
            });

            if (!broadcast) {
                return reply.code(404).send({
                    success: false,
                    error: 'Broadcast not found',
                });
            }

            // Safe JSON parse for recipient IDs
            let recipientIds: string[] = [];
            try {
                if (typeof broadcast.recipientUserIds === 'string') {
                    // Try to parse as JSON
                    recipientIds = JSON.parse(broadcast.recipientUserIds);
                } else if (Array.isArray(broadcast.recipientUserIds)) {
                    // Already an array
                    recipientIds = broadcast.recipientUserIds;
                }
            } catch (parseError) {
                console.warn('⚠️ Failed to parse recipientIds, using empty array:', parseError);
                recipientIds = [];
            }

            const analytics = broadcast.analytics;

            // Get users data (only if recipients exist)
            let users: any[] = [];
            if (recipientIds.length > 0) {
                // Since this list could be huge, in a real app we'd paginate this too
                // For now, capping it or assuming reasonable size
                users = await prisma.user.findMany({
                    where: {
                        id: { in: recipientIds }
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                });
            }

            // Build engagement map from analytics events
            const engagementMap = new Map<string, { opened: boolean; clicked: boolean; openedAt?: Date; clickedAt?: Date }>();

            if (analytics?.events) {
                analytics.events.forEach(event => {
                    if (!engagementMap.has(event.userId)) {
                        engagementMap.set(event.userId, { opened: false, clicked: false });
                    }
                    const userEngagement = engagementMap.get(event.userId)!;

                    if (event.eventType === 'OPENED') {
                        userEngagement.opened = true;
                        userEngagement.openedAt = event.occurredAt;
                    }
                    if (event.eventType === 'CLICKED') {
                        userEngagement.clicked = true;
                        userEngagement.clickedAt = event.occurredAt;
                    }
                });
            }

            // Build recipient list with engagement
            const recipients = users.map(user => {
                const engagement = engagementMap.get(user.id) || { opened: false, clicked: false };
                return {
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    opened: engagement.opened,
                    clicked: engagement.clicked,
                    openedAt: engagement.openedAt,
                    clickedAt: engagement.clickedAt,
                };
            });

            const rCount = analytics?.recipientCount || 0;
            const oCount = analytics?.openedCount || 0;
            const cCount = analytics?.clickedCount || 0;

            return reply.code(200).send({
                success: true,
                broadcast: {
                    id: broadcast.id,
                    subject: broadcast.subject,
                    message: broadcast.messageText,
                    templateId: broadcast.templateId,
                    sentAt: broadcast.sentAt,
                    sentBy: broadcast.sentByName,
                },
                analytics: {
                    recipientCount: recipients.length, // use actual fetched recipients count for display list
                    openedCount: oCount,
                    clickedCount: cCount,
                    convertedCount: analytics?.convertedCount || 0,
                    openRate: rCount > 0 ? Number((oCount / rCount * 100).toFixed(1)) : 0,
                    clickRate: rCount > 0 ? Number((cCount / rCount * 100).toFixed(1)) : 0,
                    engagementScore: Number(analytics?.engagementScore || 0),
                },
                recipients,
            });
        } catch (error) {
            console.error('❌ Error fetching broadcast details:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to fetch broadcast details',
            });
        }
    });
}
