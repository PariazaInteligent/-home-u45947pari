/**
 * Broadcast Scheduler
 * Cron job that automatically sends scheduled broadcasts when their time comes
 * Runs every minute to check for broadcasts ready to send
 */

import cron from 'node-cron';
import { prisma } from '@pariaza/database';

// Flag to prevent multiple scheduler instances
let schedulerStarted = false;

/**
 * Start the broadcast scheduler
 * Runs every minute: '* * * * *'
 */
export function startBroadcastScheduler() {
    if (schedulerStarted) {
        console.log('⚠️  Broadcast scheduler already running');
        return;
    }

    console.log('🚀 Starting broadcast scheduler...');

    // Schedule to run every minute
    cron.schedule('* * * * *', async () => {
        await checkAndSendScheduledBroadcasts();
    });

    schedulerStarted = true;
    console.log('✅ Broadcast scheduler started - checking every minute');
}

/**
 * Check for broadcasts that are ready to send and send them
 */
async function checkAndSendScheduledBroadcasts() {
    try {
        console.log('🔍 [Scheduler] Checking for scheduled broadcasts...');

        // Query broadcasts ready to send
        const readyBroadcasts: any[] = await prisma.$queryRawUnsafe(`
            SELECT 
                id, 
                template_id, 
                subject, 
                message_text, 
                recipient_user_ids,
                sent_by_user_id,
                sent_by_name,
                scheduled_for
            FROM broadcasts
            WHERE status = 'SCHEDULED'
              AND scheduled_for <= NOW()
            LIMIT 10
        `);

        if (readyBroadcasts.length === 0) {
            // No broadcasts to send - silent return
            return;
        }

        console.log(`📤 [Scheduler] Found ${readyBroadcasts.length} broadcast(s) ready to send`);

        for (const broadcast of readyBroadcasts) {
            try {
                await sendScheduledBroadcast(broadcast);
            } catch (error) {
                console.error(`❌ [Scheduler] Failed to send broadcast ${broadcast.id}:`, error);
                // Continue with next broadcast even if one fails
            }
        }

    } catch (error) {
        console.error('❌ [Scheduler] Error in scheduler:', error);
    }
}

/**
 * Send a single scheduled broadcast
 */
async function sendScheduledBroadcast(broadcast: any) {
    const { id, template_id, subject, message_text, recipient_user_ids, sent_by_name, sent_by_user_id } = broadcast;

    console.log(`📧 [Scheduler] Sending broadcast: ${id} - "${subject}"`);

    try {
        // Parse recipient IDs (string[] format for CUID support)
        let recipientIds: string[];
        if (typeof recipient_user_ids === 'string') {
            recipientIds = JSON.parse(recipient_user_ids);
        } else if (Array.isArray(recipient_user_ids)) {
            recipientIds = recipient_user_ids;
        } else {
            throw new Error('Invalid recipient_user_ids format');
        }

        // Get recipient emails from database (using safe parameterized query)
        const placeholders = recipientIds.map(() => '?').join(',');
        const recipients: any[] = await prisma.$queryRawUnsafe(
            `SELECT id, email, name FROM users WHERE id IN (${placeholders})`,
            ...recipientIds
        );

        if (recipients.length === 0) {
            console.warn(`⚠️  [Scheduler] No valid recipients found for broadcast ${id}`);
            // Mark as sent anyway to avoid retry loop
            await markBroadcastAsSent(id, 0);
            return;
        }

        console.log(`📤 [Scheduler] Sending to ${recipients.length} recipients...`);

        let sentCount = 0;
        let failedCount = 0;
        const analytics_id = `analytics_${Date.now()}`;

        for (const recipient of recipients) {
            try {
                // Import and use email service
                const { emailService } = await import('../services/email.service.js');

                let htmlContent = emailService.getBroadcastEmailTemplate(
                    subject,
                    message_text,
                    sent_by_name || 'Admin',
                    'standard' // design
                );

                // === ADD TRACKING ===
                const trackingPixelUrl = `http://localhost:3001/track/open/${analytics_id}/${recipient.id}`;

                // 1. Inject tracking pixel methods
                // Method 1: CSS background-image in body tag
                htmlContent = htmlContent.replace(
                    '<body style="',
                    `<body style="background-image: url('${trackingPixelUrl}'); background-repeat: no-repeat; background-position: -9999px -9999px; `
                );

                // Method 2: Hidden div + traditional pixel before </body>
                const trackingPixelHtml = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;border:0;position:absolute;" alt="" />`;
                if (htmlContent.includes('</body>')) {
                    htmlContent = htmlContent.replace('</body>', `${trackingPixelHtml}</body>`);
                } else {
                    htmlContent += trackingPixelHtml;
                }

                // 2. Wrap all links with click tracking redirects
                const hrefRegex = /href=["']([^"']+)["']/gi;
                htmlContent = htmlContent.replace(hrefRegex, (match, url) => {
                    // Skip if already a tracking URL, anchor link, or mailto
                    if (url.includes('/track/click') || url.startsWith('#') || url.startsWith('mailto:')) {
                        return match;
                    }

                    const encodedUrl = encodeURIComponent(url);
                    const trackingUrl = `http://localhost:3001/track/click/${analytics_id}/${recipient.id}?to=${encodedUrl}`;
                    return `href="${trackingUrl}"`;
                });

                await emailService.sendEmail({
                    to: recipient.email,
                    subject: subject,
                    html: htmlContent
                });

                sentCount++;
                console.log(`✅ Sent to ${recipient.email}`);

            } catch (emailError) {
                console.error(`❌ Failed to send to ${recipient.email}:`, emailError);
                failedCount++;
            }
        }

        // Create analytics record
        await prisma.$executeRawUnsafe(`
            INSERT INTO broadcast_analytics (
                id, template_id, broadcast_subject, 
                recipient_count, sent_at
            ) VALUES (?, ?, ?, ?, NOW())
        `, analytics_id, template_id, subject, sentCount);

        // Update broadcast status to SENT
        await markBroadcastAsSent(id, sentCount, analytics_id);

        // === SMART NOTIFICATION HANDLING ===
        // If this broadcast corresponds to a template, mark the admin notification as read!
        if (template_id && sent_by_user_id) {
            try {
                const { notificationService } = await import('../services/notification.service.js');
                await notificationService.markAsReadByTemplate(sent_by_user_id, template_id);
                console.log(`🔔 [Scheduler] Auto-resolved notifications for template "${template_id}"`);
            } catch (notifError) {
                console.error('⚠️ [Scheduler] Failed to auto-resolve notifications:', notifError);
            }
        }

        console.log(`✅ [Scheduler] Successfully sent broadcast ${id} to ${sentCount}/${recipients.length} recipients (${failedCount} failed)`);

    } catch (error) {
        console.error(`❌ [Scheduler] Error sending broadcast ${id}:`, error);
        throw error;
    }
}

/**
 * Mark broadcast as sent
 */
async function markBroadcastAsSent(broadcastId: string, recipientCount: number, analyticsId?: string) {
    const updateFields = [
        "status = 'SENT'",
        "sent_at = NOW()",
        "updated_at = NOW()"
    ];

    if (analyticsId) {
        updateFields.push(`analytics_id = '${analyticsId}'`);
    }

    await prisma.$executeRawUnsafe(`
        UPDATE broadcasts
        SET ${updateFields.join(', ')}
        WHERE id = ?
    `, broadcastId);
}
