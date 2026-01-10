import cron from 'node-cron';
import { broadcastService } from '../services/broadcast.service.js';
import { notificationService } from '../services/notification.service.js';

/**
 * Cron Jobs for Broadcast Opportunity Checking
 * 
 * Runs automated checks to create notifications when there are eligible users for broadcasts
 */

// Helper to get admin user ID (first admin in database)
async function getAdminUserId(): Promise<string | null> {
    const { prisma } = await import('@pariaza/database');
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
    });
    return admin?.id || null;
}

/**
 * Check if broadcast opportunity exists and create notification
 */
async function checkAndNotify(
    templateId: string,
    title: string,
    message: string,
    filterRule: string
) {
    try {
        const { prisma } = await import('@pariaza/database');
        const adminId = await getAdminUserId();
        if (!adminId) {
            console.log('⚠️ No admin user found, skipping notification');
            return;
        }

        // Get total user count for dynamic thresholds
        const totalUsers = await prisma.user.count({
            where: { status: 'ACTIVE' },
        });

        const thresholds = notificationService.calculateDynamicThresholds(totalUsers);

        // Get eligible users count using broadcast service
        const eligibleUsers = await broadcastService['getUsersForBroadcast']({
            filterRule: filterRule as any,
        });

        const count = eligibleUsers.length;

        // Determine threshold based on template type
        let threshold = 0;
        if (filterRule === 'new_users') threshold = thresholds.welcome;
        else if (filterRule === 'streak_at_risk') threshold = thresholds.streakAlert;
        else if (filterRule === 'forgot_checkin') threshold = thresholds.checkin;
        else threshold = thresholds.welcome; // Default

        // Create notification if threshold met
        if (count >= threshold) {
            await notificationService.createBroadcastNotification(
                adminId,
                templateId,
                title,
                message,
                count,
                false // not manual
            );
            console.log(`✅ Created notification for "${templateId}": ${count} users eligible`);
        } else {
            console.log(`ℹ️ Skipped "${templateId}": ${count} users (threshold: ${threshold})`);
        }
    } catch (error) {
        console.error(`❌ Error checking opportunity for "${templateId}":`, error);
    }
}

/**
 * Initialize all broadcast cron jobs
 */
export function initBroadcastCronJobs() {
    console.log('🕐 Initializing Broadcast Opportunity Cron Jobs...');

    // 1. Welcome Email - Daily at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        console.log('[Cron] Checking Welcome Email opportunity...');
        await checkAndNotify(
            'welcome',
            '🎉 Investitori noi te așteaptă!',
            'Trimite mesajul de bun venit acum',
            'new_users'
        );
    });
    console.log('  ✓ Welcome Email: Daily at 10:00 AM');

    // 2. Streak Alert - 3 times per day (9:00, 15:00, 20:00)
    cron.schedule('0 9,15,20 * * *', async () => {
        console.log('[Cron] Checking Streak Alert opportunity...');
        await checkAndNotify(
            'streak_loss',
            '⚠️ Salvează streak-urile investitorilor!',
            'Utilizatori riscă să-și piardă streak-ul',
            'streak_at_risk'
        );
    });
    console.log('  ✓ Streak Alert: 3x daily (9:00, 15:00, 20:00)');

    // 3. Check-in Reminder - Daily at 19:00 (7 PM)
    cron.schedule('0 19 * * *', async () => {
        console.log('[Cron] Checking Check-in Reminder opportunity...');
        await checkAndNotify(
            'daily_checkin',
            '🔥 Utilizatori au uitat check-in-ul!',
            'Amintește-le să facă check-in astăzi',
            'forgot_checkin'
        );
    });
    console.log('  ✓ Check-in Reminder: Daily at 19:00');

    // 4. Weekly Recap - Every Monday at 09:00
    cron.schedule('0 9 * * 1', async () => {
        console.log('[Cron] Checking Weekly Recap opportunity...');
        await checkAndNotify(
            'weekly_recap',
            '📊 Trimite rezultatele săptămânale!',
            'Investitori activi așteaptă raportul',
            'active_users'
        );
    });
    console.log('  ✓ Weekly Recap: Every Monday at 09:00');

    console.log('🚀 All Broadcast Cron Jobs initialized successfully!');
}
