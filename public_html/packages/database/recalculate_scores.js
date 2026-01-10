// Recalculate all engagement scores with new click-first formula
// Run with: node recalculate_scores.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateScores() {
    console.log('🔄 Recalculating engagement scores with NEW formula...');
    console.log('   Formula: opens (10%) + clicks (60%) + conversions (30%)');

    try {
        // Update all scores
        const result = await prisma.$executeRaw`
            UPDATE broadcast_analytics
            SET engagement_score = (
                (opened_count / GREATEST(recipient_count, 1) * 10) +
                (clicked_count / GREATEST(recipient_count, 1) * 60) +
                (converted_count / GREATEST(recipient_count, 1) * 30)
            )
            WHERE recipient_count > 0
        `;

        console.log(`✅ Updated ${result} broadcast analytics records`);

        // Show updated scores
        const updated = await prisma.$queryRaw`
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
        `;

        console.log('\n📊 Top 10 Broadcasts by NEW Score:');
        console.table(updated);

    } catch (error) {
        console.error('❌ Error recalculating scores:', error);
    } finally {
        await prisma.$disconnect();
    }
}

recalculateScores();
