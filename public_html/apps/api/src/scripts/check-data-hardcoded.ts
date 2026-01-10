
// Force set env var before any imports
process.env.DATABASE_URL = 'mysql://pariaza_user:Pariaza2024!@127.0.0.1:3306/pariaza_db';

async function main() {
    console.log('🔍 Checking latest broadcast data (Hardcoded Env)...');
    try {
        // Dynamic import ensures env var is read during initialization
        const { prisma } = await import('@pariaza/database');

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
            console.log(`- IDs Match? ${lastBroadcast.analytics.id === lastBroadcast.analyticsId ? 'YES' : 'NO'}`);
        } else {
            console.log('⚠️ WARNING: Broadcast exists but has NO linked Analytics record.');
        }

        await prisma.$disconnect();

    } catch (error) {
        console.error('❌ Error querying database:', error);
    }
}

main();
