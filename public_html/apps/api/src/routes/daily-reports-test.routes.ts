import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { dailyReportsService } from '../services/daily-reports.service.js';

/**
 * Admin routes pentru testarea și gestionarea rapoartelor zilnice
 */
export async function dailyReportsTestRoutes(fastify: FastifyInstance) {

    /**
     * POST /api/admin/daily-reports/send-now
     * Trimite manual rapoartele zilnice către toți utilizatorii eligibili
     * Util pentru testare și rulare manuală
     */
    fastify.post('/api/admin/daily-reports/send-now', {
        onRequest: [authenticate, requireAdmin],
        schema: {
            tags: ['Admin - Daily Reports'],
            summary: 'Send daily reports manually (for testing)',
            description: 'Triggers the daily reports sending process immediately for all eligible users',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        result: {
                            type: 'object',
                            properties: {
                                totalEligible: { type: 'number' },
                                sent: { type: 'number' },
                                failed: { type: 'number' },
                                skipped: { type: 'number' },
                                details: {
                                    type: 'object',
                                    properties: {
                                        sentTo: { type: 'array', items: { type: 'string' } },
                                        failed: { type: 'array', items: { type: 'string' } },
                                        skipped: { type: 'array', items: { type: 'string' } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            fastify.log.info('📧 [Admin] Manual trigger: sending daily reports...');

            const result = await dailyReportsService.sendDailyReports();

            fastify.log.info(`✅ [Admin] Daily reports sent: ${result.sent}/${result.totalEligible}`);

            return reply.send({
                success: true,
                message: `Rapoarte trimise: ${result.sent}/${result.totalEligible} (${result.failed} eșuate, ${result.skipped} sărite)`,
                result
            });

        } catch (error) {
            fastify.log.error('❌ [Admin] Error sending daily reports:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to send daily reports',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    /**
     * POST /api/admin/daily-reports/test/:userId
     * Trimite un raport de test către un utilizator specific
     */
    fastify.post<{
        Params: { userId: string };
    }>('/api/admin/daily-reports/test/:userId', {
        onRequest: [authenticate, requireAdmin],
        schema: {
            tags: ['Admin - Daily Reports'],
            summary: 'Send test daily report to specific user',
            description: 'Sends a daily report email to the specified user ID for testing purposes',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        userId: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { userId } = request.params;

            fastify.log.info(`🧪 [Admin] Test daily report for user: ${userId}`);

            const sent = await dailyReportsService.sendTestReport(userId);

            if (sent) {
                return reply.send({
                    success: true,
                    message: `Raport de test trimis cu succes către utilizatorul ${userId}`,
                    userId
                });
            } else {
                return reply.code(500).send({
                    success: false,
                    message: `Eșuare la trimiterea raportului de test către ${userId}`,
                    userId
                });
            }

        } catch (error) {
            fastify.log.error('❌ [Admin] Error sending test report:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to send test report',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    /**
     * GET /api/admin/daily-reports/stats
     * Obține statistici despre utilizatorii eligibili pentru rapoarte zilnice
     */
    fastify.get('/api/admin/daily-reports/stats', {
        onRequest: [authenticate, requireAdmin],
        schema: {
            tags: ['Admin - Daily Reports'],
            summary: 'Get daily reports statistics',
            description: 'Returns statistics about users eligible for daily reports',
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        stats: {
                            type: 'object',
                            properties: {
                                totalEligible: { type: 'number' },
                                byTier: { type: 'object' },
                                timestamp: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const eligibleUsers = await dailyReportsService.getUsersWithDailyReportsEnabled();

            // Group by tier
            const byTier: Record<string, number> = {};
            for (const user of eligibleUsers) {
                const tier = user.tier || 'ENTRY';
                byTier[tier] = (byTier[tier] || 0) + 1;
            }

            return reply.send({
                success: true,
                stats: {
                    totalEligible: eligibleUsers.length,
                    byTier,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            fastify.log.error('❌ [Admin] Error getting daily reports stats:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to get statistics',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    fastify.log.info('✅ Daily Reports Test Routes registered');
}
