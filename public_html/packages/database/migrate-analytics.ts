import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAnalytics() {
    console.log('🔄 Starting analytics migration...\n');

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

    console.log(`📊 Found ${broadcasts.length} total broadcasts`);

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
        const analyticsId = `analytics_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

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
                avgOpenTimeMinutes: 0,
                sentAt: broadcast.sentAt || new Date()
            }
        });

        // Update broadcast to link to analytics
        await prisma.broadcast.update({
            where: { id: broadcast.id },
            data: { analyticsId }
        });

        created++;
        console.log(`✅ Created analytics for: "${broadcast.subject}" (${recipientCount} recipients)`);
    }

    console.log(`\n📈 Migration complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${broadcasts.length}`);

    await prisma.$disconnect();
}

migrateAnalytics().catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
