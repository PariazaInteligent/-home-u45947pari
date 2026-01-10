import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCounts() {
    // Count total broadcasts
    const totalBroadcasts = await prisma.broadcast.count();
    console.log('📊 Total broadcasts în tabela `broadcasts`:', totalBroadcasts);

    // Count total analytics
    const totalAnalytics = await prisma.broadcastAnalytics.count();
    console.log('📊 Total analytics în tabela `broadcast_analytics`:', totalAnalytics);

    // Show all analytics IDs
    const analytics = await prisma.broadcastAnalytics.findMany({
        select: {
            id: true,
            broadcastSubject: true,
            recipientCount: true,
            sentAt: true
        },
        orderBy: {
            sentAt: 'desc'
        }
    });

    console.log('\n📋 Toate analytics records:');
    analytics.forEach((a, i) => {
        console.log(`${i + 1}. ${a.broadcastSubject} - ${a.recipientCount} recipients - ${a.sentAt}`);
    });

    await prisma.$disconnect();
}

checkCounts().catch(console.error);
