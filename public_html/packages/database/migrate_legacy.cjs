
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

async function migrate() {
    try {
        console.log('Starting migration from email_broadcasts to broadcasts...');

        // 1. Fetch all legacy broadcasts
        const legacyBroadcasts = await prisma.email_broadcasts.findMany();
        console.log(`Found ${legacyBroadcasts.length} legacy broadcasts.`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const legacy of legacyBroadcasts) {
            // Check if already migrated (by ID)
            const existing = await prisma.broadcast.findUnique({
                where: { id: legacy.id }
            });

            if (existing) {
                // console.log(`Skipping ${legacy.id}, already exists.`);
                skippedCount++;
                continue;
            }

            console.log(`Migrating ${legacy.id}: ${legacy.subject}`);

            // Prepare analytics ID
            // If legacy has analytics_id, use it. If not, maybe use legacy.id?
            // But BroadcastAnalytics table might not have legacy.id if it was NULL.
            // For now, assume if analytics_id is present, we link it.

            // Map status
            // All legacy are treated as SENT since they are in history
            const status = 'SENT';

            try {
                // Create Broadcast record
                const newBroadcast = await prisma.broadcast.create({
                    data: {
                        id: legacy.id,
                        subject: legacy.subject,
                        messageText: legacy.message,
                        htmlContent: legacy.html_content,
                        templateId: 'legacy', // Default
                        sentByUserId: legacy.sent_by_user_id,
                        sentByName: 'Admin (Legacy)', // Unknown source, defaulting
                        recipientUserIds: '[]', // Legacy didn't store this inline?
                        filters: legacy.filters,
                        analyticsId: legacy.analytics_id,
                        status: status,
                        scheduledFor: null,
                        createdAt: legacy.created_at,
                        updatedAt: legacy.created_at,
                        sentAt: legacy.created_at,
                    }
                });
                migratedCount++;
            } catch (err) {
                console.error(`Failed to migrate ${legacy.id}:`, err.message);
            }
        }

        console.log(`Migration complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('Migration Fatal Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
