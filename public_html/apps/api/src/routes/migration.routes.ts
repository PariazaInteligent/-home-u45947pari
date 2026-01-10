import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { prisma } from '@pariaza/database';

export async function migrationRoutes(app: FastifyInstance) {
    /**
     * POST /admin/migration/create-missing-analytics
     * Create analytics records for broadcasts that don't have them
     */
    app.post('/admin/migration/create-missing-analytics', {
        schema: {
            tags: ['Admin', 'Migration'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        try {
            console.log('🔄 Starting analytics migration...');

            // Get all broadcasts
            const broadcasts = await prisma.broadcast.findMany({
                select: {
                    id: true,
                    templateId: true,
                    subject: true,
                    recipientUserIds: true,
                    sentAt: true,
                    analyticsId: true
                }
            });

            let created = 0;
            let skipped = 0;

            for (const broadcast of broadcasts) {
                // Skip if already has analytics
                if (broadcast.analyticsId) {
                    const exists = await prisma.broadcastAnalytics.findUnique({
                        where: { id: broadcast.analyticsId }
                    });
                    if (exists) {
                        skipped++;
                        continue;
                    }
                }

                // Parse recipient IDs
                let recipientCount = 0;
                try {
                    if (typeof broadcast.recipientUserIds === 'string') {
                        const ids = JSON.parse(broadcast.recipientUserIds);
                        recipientCount = Array.isArray(ids) ? ids.length : 0;
                    }
                } catch {
                    recipientCount = 0;
                }

                // Create analytics record
                const analyticsId = `analytics_migrated_${broadcast.id}`;

                await prisma.broadcastAnalytics.create({
                    data: {
                        id: analyticsId,
                        templateId: broadcast.templateId || 'unknown',
                        broadcastSubject: broadcast.subject,
                        recipientCount: recipientCount,
                        openedCount: 0,
                        clickedCount: 0,
                        convertedCount: 0,
                        engagementScore: 0,
                        sentAt: broadcast.sentAt || new Date()
                    }
                });

                // Update broadcast to link to analytics
                await prisma.broadcast.update({
                    where: { id: broadcast.id },
                    data: { analyticsId }
                });

                created++;
                console.log(`✅ Created analytics for: "${broadcast.subject}"`);
            }

            console.log(`📈 Migration complete! Created: ${created}, Skipped: ${skipped}`);

            reply.send({
                success: true,
                created,
                skipped,
                total: broadcasts.length
            });
        } catch (error) {
            console.error('❌ Migration failed:', error);
            reply.code(500).send({
                success: false,
                error: 'Migration failed'
            });
        }
    });
}
