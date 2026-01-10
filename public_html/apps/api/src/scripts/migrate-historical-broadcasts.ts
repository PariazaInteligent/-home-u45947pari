import { prisma } from '@pariaza/database';

/**
 * MIGRATION: Backfill broadcasts table with historical data
 * Populates the new transparency `broadcasts` table with existing broadcast_analytics data
 */
async function migrateHistoricalBroadcasts() {
    console.log('🔄 Starting historical broadcast migration...\n');

    try {
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

        console.log(`📊 Found ${analytics.length} historical broadcasts in broadcast_analytics\n`);

        if (analytics.length === 0) {
            console.log('✅ No historical broadcasts to migrate!');
            return;
        }

        let migrated = 0;
        let skipped = 0;

        for (const record of analytics) {
            // Check if already migrated
            const existing: any[] = await prisma.$queryRawUnsafe(`
                SELECT id FROM broadcasts WHERE analytics_id = ?
            `, record.analytics_id);

            if (existing.length > 0) {
                console.log(`⏭️  Skipping ${record.analytics_id} - already migrated`);
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
                '[Migrated historical broadcast - original message not stored]',
                'admin',
                'Admin (Historical)',
                JSON.stringify([]), // Empty recipient list for historical data
                record.sent_at
            );

            console.log(`✅ Migrated: ${record.subject} (${record.analytics_id})`);
            migrated++;
        }

        console.log(`\n📈 Migration Summary:`);
        console.log(`   ✅ Migrated: ${migrated}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   📊 Total: ${analytics.length}\n`);

        // Verify migration
        const totalBroadcasts: any[] = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as count FROM broadcasts
        `);

        console.log(`✅ Broadcasts table now contains: ${totalBroadcasts[0].count} records`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateHistoricalBroadcasts()
    .then(() => {
        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
