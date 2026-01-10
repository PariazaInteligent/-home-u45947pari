
import { prisma } from '@pariaza/database';

async function main() {
    console.log('🔍 Checking latest broadcast data...');
    try {
        const lastBroadcast = await prisma.broadcast.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
                analytics: true
            }
        });

        if (!lastBroadcast) {
            console.log('❌ No broadcasts found in database.');
            return;
        }

        console.log('✅ Latest Broadcast Found:');
        console.log(`- ID: ${lastBroadcast.id}`);
        console.log(`- Subject: ${lastBroadcast.subject}`);
        console.log(`- Analytics ID (FK): ${lastBroadcast.analyticsId}`);
        console.log(`- Analytics Record:`, lastBroadcast.analytics);

        if (lastBroadcast.analytics) {
            console.log('🎉 SUCCESS: Broadcast has linked Analytics!');
            console.log(`- Recipient Count: ${lastBroadcast.analytics.recipientCount}`);
        } else {
            console.log('⚠️ WARNING: Broadcast exists but has NO linked Analytics record.');
            if (lastBroadcast.analyticsId) {
                console.log('   (It has an analyticsId, but the record is missing?)');
            } else {
                console.log('   (analyticsId field is null)');
            }
        }

    } catch (error) {
        console.error('❌ Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
