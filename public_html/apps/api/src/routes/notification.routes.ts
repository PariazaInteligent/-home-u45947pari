import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { notificationService } from '../services/notification.service.js';

export async function notificationRoutes(app: FastifyInstance) {
    /**
     * GET /admin/broadcast-notifications
     * Get all broadcast notifications for the admin (FIFO order)
     */
    app.get('/admin/broadcast-notifications', {
        schema: {
            tags: ['Admin', 'Notifications'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    includeRead: { type: 'boolean' },
                },
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { includeRead } = request.query as { includeRead?: boolean };
        const user = (request as any).user;

        try {
            const notifications = await notificationService.getNotificationsForAdmin(
                user.id,
                includeRead || false
            );

            const unreadCount = await notificationService.getUnreadCount(user.id);

            reply.send({
                success: true,
                notifications,
                unreadCount,
            });
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to fetch notifications',
            });
        }
    });

    /**
     * POST /admin/broadcast-notifications/mark-read/:id
     * Mark a broadcast notification as read
     */
    app.post('/admin/broadcast-notifications/mark-read/:id', {
        schema: {
            tags: ['Admin', 'Notifications'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            const notification = await notificationService.markAsRead(id);

            reply.send({
                success: true,
                notification,
            });
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to mark notification as read',
            });
        }
    });

    /**
     * POST /admin/broadcast-notifications/create-manual
     * Create manual broadcast notification for Opportunity/Offer templates
     */
    app.post('/admin/broadcast-notifications/create-manual', {
        schema: {
            tags: ['Admin', 'Notifications'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['templateId', 'title', 'message', 'recipientCount'],
                properties: {
                    templateId: { type: 'string' },
                    title: { type: 'string', maxLength: 255 },
                    message: { type: 'string', maxLength: 500 },
                    recipientCount: { type: 'number', minimum: 0 },
                },
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { templateId, title, message, recipientCount } = request.body as {
            templateId: string;
            title: string;
            message: string;
            recipientCount: number;
        };
        const user = (request as any).user;

        try {
            const notification = await notificationService.createBroadcastNotification(
                user.id,
                templateId,
                title,
                message,
                recipientCount,
                true // isManual
            );

            reply.send({
                success: true,
                notification,
                message: 'Manual notification created successfully',
            });
        } catch (error) {
            console.error('❌ Error creating manual notification:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to create manual notification',
            });
        }
    });

    /**
     * DELETE /admin/broadcast-notifications/:id
     * Delete broadcast notification from history
     */
    app.delete('/admin/broadcast-notifications/:id', {
        schema: {
            tags: ['Admin', 'Notifications'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            await notificationService.deleteNotification(id);

            reply.send({
                success: true,
                message: 'Notification deleted successfully',
            });
        } catch (error) {
            console.error('❌ Error deleting notification:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to delete notification',
            });
        }
    });

    /**
     * POST /admin/broadcast-notifications/seed-test
     * Create sample notifications for testing (ALL template types)
     * ONLY FOR DEVELOPMENT/TESTING - Creates fake notifications
     */
    app.post('/admin/broadcast-notifications/seed-test', {
        schema: {
            tags: ['Admin', 'Notifications', 'Testing'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const user = (request as any).user;

        const testNotifications = [
            {
                templateId: 'welcome',
                title: '🎉 Investitori noi te așteaptă!',
                message: 'Trimite mesajul de bun venit acum',
                count: 5
            },
            {
                templateId: 'streak_loss',
                title: '⚠️ Salvează streak-urile investitorilor!',
                message: 'Utilizatori riscă să-și piardă streak-ul',
                count: 12
            },
            {
                templateId: 'daily_checkin',
                title: '🔥 Utilizatori au uitat check-in-ul!',
                message: 'Amintește-le să facă check-in astăzi',
                count: 8
            },
            {
                templateId: 'weekly_recap',
                title: '📊 Trimite rezultatele săptămânale!',
                message: 'Investitori activi așteaptă raportul',
                count: 20
            },
            {
                templateId: 'opportunity',
                title: '🚀 Oportunitate de investiție nouă!',
                message: 'Anunță investitorii despre oportunitatea specială',
                count: 15
            },
        ];

        try {
            const created = [];
            for (const notif of testNotifications) {
                const notification = await notificationService.createBroadcastNotification(
                    user.id,
                    notif.templateId,
                    notif.title,
                    notif.message,
                    notif.count,
                    true // manual
                );
                created.push(notification);
            }

            reply.send({
                success: true,
                message: `Created ${created.length} test notifications`,
                notifications: created,
            });
        } catch (error) {
            console.error('❌ Error creating test notifications:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to create test notifications',
            });
        }
    });

    /**
     * DELETE /admin/broadcast-notifications/cleanup-test
     * Delete ALL test notifications (where isManual=true)
     * Use after testing to clean up demo data
     */
    app.delete('/admin/broadcast-notifications/cleanup-test', {
        schema: {
            tags: ['Admin', 'Notifications', 'Testing'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const user = (request as any).user;

        try {
            const { prisma } = await import('@pariaza/database');

            const deleted = await prisma.broadcastNotification.deleteMany({
                where: {
                    userId: user.id,
                    isManual: true, // Only delete test/manual notifications
                },
            });

            reply.send({
                success: true,
                message: `Deleted ${deleted.count} test notifications`,
                count: deleted.count,
            });
        } catch (error) {
            console.error('❌ Error cleaning up test notifications:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to clean up test notifications',
            });
        }
    });
}
