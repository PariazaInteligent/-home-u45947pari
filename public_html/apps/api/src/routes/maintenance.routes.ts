import { FastifyInstance } from 'fastify';
import { prisma } from '@pariaza/database';

export async function maintenanceRoutes(app: FastifyInstance) {
    /**
     * POST /admin/maintenance/recalculate-scores
     * Recalculate all engagement scores with new click-first formula
     * Protected route - admin only
     */
    app.post('/admin/maintenance/recalculate-scores', async (request, reply) => {
        try {
            console.log('🔄 Recalculating all engagement scores with NEW formula...');

            // Update all scores with click-first formula: clicks (60%) + conversions (30%) + opens (10%)
            await prisma.$executeRawUnsafe(`
                UPDATE broadcast_analytics
                SET engagement_score = (
                    (opened_count / GREATEST(recipient_count, 1) * 10) +
                    (clicked_count / GREATEST(recipient_count, 1) * 60) +
                    (converted_count / GREATEST(recipient_count, 1) * 30)
                )
                WHERE recipient_count > 0
            `);

            // Get updated scores
            const updated: any[] = await prisma.$queryRawUnsafe(`
                SELECT 
                    id,
                    template_id,
                    ROUND(opened_count / recipient_count * 100, 1) as open_rate,
                    ROUND(clicked_count / recipient_count * 100, 1) as click_rate,
                    ROUND(engagement_score, 2) as new_score
                FROM broadcast_analytics
                ORDER BY engagement_score DESC
                LIMIT 10
            `);

            console.log('✅ Recalculation complete!');
            console.table(updated);

            return reply.code(200).send({
                success: true,
                message: 'Engagement scores recalculated with new formula',
                formula: 'opens (10%) + clicks (60%) + conversions (30%)',
                topBroadcasts: updated,
            });
        } catch (error) {
            console.error('❌ Error recalculating scores:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to recalculate scores',
            });
        }
    });

    /**
     * POST /admin/maintenance/create-broadcasts-table
     * Create broadcasts table for transparency dashboard
     */
    app.post('/admin/maintenance/create-broadcasts-table', async (request, reply) => {
        try {
            console.log('🔄 Creating broadcasts table...');

            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS broadcasts (
                    id VARCHAR(100) PRIMARY KEY,
                    analytics_id VARCHAR(100) UNIQUE,
                    template_id VARCHAR(50) NOT NULL,
                    subject VARCHAR(500) NOT NULL,
                    message_text TEXT NOT NULL,
                    html_content TEXT,
                    sent_by_user_id VARCHAR(100),
                    sent_by_name VARCHAR(200),
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    recipient_filter JSON,
                    recipient_user_ids JSON NOT NULL,
                    
                    FOREIGN KEY (analytics_id) REFERENCES broadcast_analytics(id) ON DELETE SET NULL,
                    INDEX idx_sent_at (sent_at DESC),
                    INDEX idx_template (template_id),
                    INDEX idx_sent_by (sent_by_user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            console.log('✅ broadcasts table created!');

            return reply.code(200).send({
                success: true,
                message: 'Broadcasts table created for transparency dashboard',
            });
        } catch (error) {
            console.error('❌ Error creating table:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to create broadcasts table',
            });
        }
    });

    /**
     * POST /admin/maintenance/migrate-historical-broadcasts
     * Migrate historical broadcast_analytics data to broadcasts table
     */
    app.post('/admin/maintenance/migrate-historical-broadcasts', async (request, reply) => {
        try {
            console.log('🔄 Migrating historical broadcasts...');

            // Get all broadcast_analytics records
            const analytics: any[] = await prisma.$queryRawUnsafe(`
                SELECT 
                    id as analytics_id,
                    template_id,
                    broadcast_subject as subject,
                    sent_at,
                    recipient_count
                FROM broadcast_analytics
                ORDER BY sent_at DESC
            `);

            console.log(`📊 Found ${analytics.length} historical broadcasts`);

            let migrated = 0;
            let skipped = 0;

            for (const record of analytics) {
                // Check if already migrated
                const existing: any[] = await prisma.$queryRawUnsafe(`
                    SELECT id FROM broadcasts WHERE analytics_id = ?
                `, record.analytics_id);

                if (existing.length > 0) {
                    skipped++;
                    continue;
                }

                // Create broadcast ID
                const broadcastId = `broadcast_migrated_${record.analytics_id}`;

                // Insert into broadcasts table
                await prisma.$executeRawUnsafe(`
                    INSERT INTO broadcasts (
                        id,
                        analytics_id,
                        template_id,
                        subject,
                        message_text,
                        sent_by_user_id,
                        sent_by_name,
                        recipient_user_ids,
                        sent_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                    broadcastId,
                    record.analytics_id,
                    record.template_id || 'custom',
                    record.subject || 'Historical Broadcast',
                    '[Historical broadcast - original message not archived]',
                    'admin',
                    'Admin (Historical)',
                    JSON.stringify([]),
                    record.sent_at
                );

                migrated++;
            }

            console.log(`✅ Migration complete: ${migrated} migrated, ${skipped} skipped`);

            return reply.code(200).send({
                success: true,
                message: 'Historical broadcasts migrated successfully',
                migrated,
                skipped,
                total: analytics.length,
            });
        } catch (error) {
            console.error('❌ Error migrating broadcasts:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to migrate historical broadcasts',
            });
        }
    });
}
