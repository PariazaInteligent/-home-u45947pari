import { prisma } from '@pariaza/database';

async function recalculateScores() {
    console.log('🔄 Recalculating engagement scores with NEW formula...');
    console.log('   Formula: opens (10%) + clicks (60%) + conversions (30%)\\n');

    try {
        // Update all scores with new formula
        await prisma.$executeRawUnsafe(`
            UPDATE broadcast_analytics
            SET engagement_score = (
                (opened_count / GREATEST(recipient_count, 1) * 10) +
                (clicked_count / GREATEST(recipient_count, 1) * 60) +
                (converted_count / GREATEST(recipient_count, 1) * 30)
            )
            WHERE recipient_count > 0
        `);

        console.log('✅ Updated all broadcast analytics records\\n');

        // Show updated scores
        const updated: any[] = await prisma.$queryRawUnsafe(`
            SELECT 
                id,
                template_id,
                recipient_count,
                opened_count,
                clicked_count,
                converted_count,
                ROUND(opened_count / recipient_count * 100, 1) as open_rate,
                ROUND(clicked_count / recipient_count * 100, 1) as click_rate,
                ROUND(engagement_score, 2) as score
            FROM broadcast_analytics
            ORDER BY engagement_score DESC
            LIMIT 10
        `);

        console.log('📊 Top 10 Broadcasts by NEW Score:');
        console.table(updated);

        console.log('\\n✅ Recalculation complete! Refresh your browser to see updated scores.');

    } catch (error) {
        console.error('❌ Error recalculating scores:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

recalculateScores();
