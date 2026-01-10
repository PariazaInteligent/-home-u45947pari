import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { analyticsService } from '../services/analytics.service.js';

export async function analyticsRoutes(app: FastifyInstance) {
    /**
     * GET /admin/broadcast/analytics/overview
     * Get performance overview for last 7 days
     */
    app.get('/admin/broadcast/analytics/overview', {
        schema: {
            tags: ['Admin', 'Analytics'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        try {
            const overview = await analyticsService.getPerformanceOverview();
            reply.send({
                success: true,
                data: overview,
            });
        } catch (error) {
            console.error('❌ Error fetching analytics overview:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to fetch analytics overview',
            });
        }
    });

    /**
     * GET /admin/broadcast/analytics/top-templates
     * Get top performing templates with rankings
     */
    app.get('/admin/broadcast/analytics/top-templates', {
        schema: {
            tags: ['Admin', 'Analytics'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        try {
            const templates = await analyticsService.getTopTemplates();
            reply.send({
                success: true,
                data: templates,
            });
        } catch (error) {
            console.error('❌ Error fetching top templates:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to fetch top templates',
            });
        }
    });

    /**
     * GET /admin/broadcast/analytics/recommendations
     * Get smart recommendations based on data
     */
    app.get('/admin/broadcast/analytics/recommendations', {
        schema: {
            tags: ['Admin', 'Analytics'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        try {
            const recommendations = await analyticsService.getSmartRecommendations();
            reply.send({
                success: true,
                data: recommendations,
            });
        } catch (error) {
            console.error('❌ Error fetching recommendations:', error);
            reply.code(500).send({
                success: false,
                error: 'Failed to fetch recommendations',
            });
        }
    });

    /**
     * GET /admin/broadcast/analytics/history
     * Get 30-day engagement history for charts
     */
    app.get('/admin/broadcast/analytics/history', {
        schema: {
            tags: ['Admin', 'Analytics'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    days: { type: 'number', default: 30 }
                }
            }
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        try {
            const { days } = request.query as { days?: number };
            const history = await analyticsService.getEngagementHistory(days);
            reply.send({ success: true, data: history });
        } catch (error) {
            console.error('❌ Error fetching history:', error);
            reply.code(500).send({ success: false, error: 'Failed to fetch history' });
        }
    });

    /**
     * GET /admin/broadcast/analytics/compare
     * Get comparative stats (vs average)
     */
    app.get('/admin/broadcast/analytics/compare', {
        schema: {
            tags: ['Admin', 'Analytics'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        try {
            const stats = await analyticsService.getComparisonStats();
            reply.send({ success: true, data: stats });
        } catch (error) {
            console.error('❌ Error fetching output stats:', error);
            reply.code(500).send({ success: false, error: 'Failed' });
        }
    });
}
