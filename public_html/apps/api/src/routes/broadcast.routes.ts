import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { broadcastService } from '../services/broadcast.service.js';

export async function broadcastRoutes(app: FastifyInstance) {
    /**
     * GET /admin/broadcast/stats
     * Get broadcast recipient statistics
     */
    app.get('/admin/broadcast/stats', {
        schema: {
            tags: ['Admin', 'Broadcast'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        try {
            const stats = await broadcastService.getStats();
            reply.send({ success: true, stats });
        } catch (error) {
            console.error('❌ Error fetching broadcast stats:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to fetch broadcast statistics',
            });
        }
    });

    /**
     * POST /admin/broadcast/preview
     * Preview email before sending (returns HTML + recipient count)
     */
    app.post('/admin/broadcast/preview', {
        schema: {
            tags: ['Admin', 'Broadcast'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['subject', 'message'],
                properties: {
                    subject: { type: 'string', maxLength: 255 },
                    message: { type: 'string', maxLength: 2000 },
                    design: { type: 'string' },
                    filters: {
                        type: 'object',
                        properties: {
                            filterRule: { type: 'string' },
                            includeRoles: { type: 'array', items: { type: 'string' } },
                            includeTiers: { type: 'array', items: { type: 'string' } },
                            testMode: { type: 'boolean' },
                        },
                    },
                },
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { subject, message, design, filters } = request.body as {
            subject: string;
            message: string;
            design?: string;
            filters?: any;
        };

        const user = (request as any).user;

        try {
            // Get recipient count
            const eligibleUsers = await broadcastService.getUsersForBroadcast(filters || {});

            // Generate HTML preview
            const { emailService } = await import('../services/email.service.js');
            const htmlPreview = emailService.getBroadcastEmailTemplate(
                subject,
                message,
                user.name || user.email,
                design || 'standard'
            );

            reply.send({
                success: true,
                preview: {
                    html: htmlPreview,
                    recipientCount: eligibleUsers.length,
                    recipients: eligibleUsers.map(u => ({
                        email: u.email,
                        name: u.name,
                        tier: u.tier,
                    })),
                },
            });
        } catch (error) {
            console.error('❌ Error generating preview:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to generate preview',
            });
        }
    });

    /**
     * POST /admin/broadcast/send
     * Send broadcast email to users
     */
    app.post('/admin/broadcast/send', {
        schema: {
            tags: ['Admin', 'Broadcast'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['subject', 'message'],
                properties: {
                    subject: { type: 'string', maxLength: 255 },
                    message: { type: 'string', maxLength: 2000 },
                    design: { type: 'string' },
                    templateId: { type: 'string' },
                    filters: {
                        type: 'object',
                        properties: {
                            filterRule: { type: 'string' },
                            includeRoles: { type: 'array', items: { type: 'string' } },
                            includeTiers: { type: 'array', items: { type: 'string' } },
                            testMode: { type: 'boolean' },
                        },
                    },
                },
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { subject, message, design, filters, templateId } = request.body as {
            subject: string;
            message: string;
            design?: string;
            filters?: any;
            templateId?: string;
        };

        const user = (request as any).user;

        try {
            console.log(`📧 [Broadcast] Admin ${user.email} sending broadcast: "${subject}"`);

            const result = await broadcastService.sendBroadcastEmail(
                subject,
                message,
                user.id,
                user.name || user.email,
                design || 'standard',
                filters || {},
                templateId
            );

            reply.send({
                success: true,
                broadcast: {
                    id: result.broadcastId,
                    sent: result.sent,
                    skipped: result.skipped,
                    failed: result.failed,
                },
                message: `Broadcast trimis cu succes! ${result.sent} emails trimise.`,
            });
        } catch (error) {
            console.error('❌ Error sending broadcast:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to send broadcast',
            });
        }
    });

    /**
     * POST /admin/broadcast/schedule
     * Schedule a broadcast for future sending
     */
    app.post('/admin/broadcast/schedule', {
        schema: {
            tags: ['Admin', 'Broadcast'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['template_id', 'subject', 'message_text', 'recipient_user_ids', 'scheduled_for'],
                properties: {
                    template_id: { type: 'string' },
                    subject: { type: 'string' },
                    message_text: { type: 'string' },
                    recipient_user_ids: { type: 'array', items: { type: 'string' } },
                    scheduled_for: { type: 'string' },
                    sent_by_name: { type: 'string' }
                }
            }
        },
        preHandler: [authenticate, requireAdmin]
    }, async (request, reply) => {
        const { template_id, subject, message_text, recipient_user_ids, scheduled_for, sent_by_name } = request.body as any;
        const user = (request as any).user;

        try {
            const scheduledDate = new Date(scheduled_for);
            if (scheduledDate <= new Date()) {
                return reply.status(400).send({ error: 'scheduled_for must be a future date/time' });
            }

            const result = await broadcastService.scheduleBroadcast(
                template_id,
                subject,
                message_text,
                recipient_user_ids,
                scheduledDate.toISOString(),
                user.id,
                sent_by_name || user.name || 'Admin'
            );
            reply.send({ success: true, broadcast: result });
        } catch (error) {
            console.error('Error scheduling broadcast:', error);
            reply.code(500).send({ success: false, error: 'Failed to schedule broadcast' });
        }
    });

    /**
     * GET /admin/broadcast/scheduled
     * Get all scheduled broadcasts
     */
    app.get('/admin/broadcast/scheduled', {
        schema: {
            tags: ['Admin', 'Broadcast'],
            security: [{ bearerAuth: [] }]
        },
        preHandler: [authenticate, requireAdmin]
    }, async (request, reply) => {
        try {
            const broadcasts = await broadcastService.getScheduledBroadcasts();
            reply.send({ success: true, broadcasts });
        } catch (error) {
            console.error('Error fetching scheduled broadcasts:', error);
            reply.code(500).send({ success: false, error: 'Failed to fetch scheduled broadcasts' });
        }
    });

    /**
     * DELETE /admin/broadcast/scheduled/:id
     * Cancel/Delete a scheduled broadcast
     */
    app.delete('/admin/broadcast/scheduled/:id', {
        schema: {
            tags: ['Admin', 'Broadcast'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                }
            }
        },
        preHandler: [authenticate, requireAdmin]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        try {
            await broadcastService.deleteBroadcast(id);
            reply.send({ success: true });
        } catch (error) {
            console.error('Error cancelling broadcast:', error);
            reply.code(500).send({ success: false, error: 'Failed to cancel broadcast' });
        }
    });
}

