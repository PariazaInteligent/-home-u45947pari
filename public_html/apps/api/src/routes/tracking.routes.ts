import { FastifyInstance } from 'fastify';
import { prisma } from '@pariaza/database';

// 1x1 transparent PNG in base64
const TRACKING_PIXEL = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64'
);

export async function trackingRoutes(app: FastifyInstance) {
    /**
     * GET /track/open/:analyticsId/:userId
     * Tracking pixel for email open rate
     * Returns 1x1 transparent PNG
     */
    app.get('/track/open/:analyticsId/:userId', async (request, reply) => {
        const { analyticsId, userId } = request.params as { analyticsId: string; userId: string };

        try {
            // Record open event using Prisma
            const eventId = `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

            await prisma.broadcastEvent.create({
                data: {
                    id: eventId,
                    analyticsId,
                    userId,
                    eventType: 'OPENED',
                    occurredAt: new Date()
                }
            });

            // Get current analytics to calculate new engagement score
            const analytics = await prisma.broadcastAnalytics.findUnique({
                where: { id: analyticsId },
                select: {
                    recipientCount: true,
                    openedCount: true,
                    clickedCount: true,
                    convertedCount: true,
                    sentAt: true
                }
            });

            if (analytics) {
                const recipientCount = analytics.recipientCount || 1; // Avoid division by zero
                const openedCount = (analytics.openedCount || 0) + 1; // Increment
                const clickedCount = analytics.clickedCount || 0;
                const convertedCount = analytics.convertedCount || 0;

                // Calculate engagement score
                const engagementScore =
                    (openedCount / recipientCount) * 10 +
                    (clickedCount / recipientCount) * 60 +
                    (convertedCount / recipientCount) * 30;

                // Calculate average open time in minutes
                const sentAt = analytics.sentAt || new Date();
                const now = new Date();
                const avgOpenTimeMinutes = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60));

                // Update analytics with Prisma
                await prisma.broadcastAnalytics.update({
                    where: { id: analyticsId },
                    data: {
                        openedCount,
                        engagementScore,
                        avgOpenTimeMinutes
                    }
                });
            }

            console.log(`📬 Email opened: analytics=${analyticsId}, user=${userId}`);

            // Return tracking pixel
            reply
                .header('Content-Type', 'image/png')
                .header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
                .header('Pragma', 'no-cache')
                .header('Expires', '0')
                .send(TRACKING_PIXEL);
        } catch (error) {
            console.error('❌ Error tracking email open:', error);
            // Still return pixel to avoid breaking email display
            reply
                .header('Content-Type', 'image/png')
                .send(TRACKING_PIXEL);
        }
    });

    /**
     * GET /track/click/:analyticsId/:userId
     * URL tracking for click rate
     * Redirects to destination after logging
     */
    app.get('/track/click/:analyticsId/:userId', async (request, reply) => {
        const { analyticsId, userId } = request.params as { analyticsId: string; userId: string };
        const { to } = request.query as { to?: string };

        const destination = to || 'http://localhost:3000/dashboard';

        try {
            // Record click event using Prisma
            const eventId = `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

            await prisma.broadcastEvent.create({
                data: {
                    id: eventId,
                    analyticsId,
                    userId,
                    eventType: 'CLICKED',
                    occurredAt: new Date(),
                    metadata: JSON.stringify({ destination })
                }
            });

            // Get current analytics to calculate new engagement score
            const analytics = await prisma.broadcastAnalytics.findUnique({
                where: { id: analyticsId },
                select: {
                    recipientCount: true,
                    openedCount: true,
                    clickedCount: true,
                    convertedCount: true
                }
            });

            if (analytics) {
                const recipientCount = analytics.recipientCount || 1; // Avoid division by zero
                const openedCount = analytics.openedCount || 0;
                const clickedCount = (analytics.clickedCount || 0) + 1; // Increment
                const convertedCount = analytics.convertedCount || 0;

                // Calculate engagement score using the same formula
                const engagementScore =
                    (openedCount / recipientCount) * 10 +
                    (clickedCount / recipientCount) * 60 +
                    (convertedCount / recipientCount) * 30;

                // Update analytics with Prisma
                await prisma.broadcastAnalytics.update({
                    where: { id: analyticsId },
                    data: {
                        clickedCount,
                        engagementScore
                    }
                });
            }

            console.log(`🖱️ Link clicked: analytics=${analyticsId}, user=${userId}, to=${destination}`);

            // Redirect to original destination
            reply.redirect(302, destination);
        } catch (error) {
            console.error('❌ Error tracking click:', error);
            // Still redirect to avoid breaking user experience
            reply.redirect(302, destination);
        }
    });

    /**
     * Helper function: Inject tracking pixel into HTML email
     */
    app.decorate('injectTrackingPixel', (htmlContent: string, analyticsId: string, userId: string): string => {
        const trackingPixelHtml = `<img src="http://localhost:3001/track/open/${analyticsId}/${userId}" width="1" height="1" style="display:none;border:0;" alt="" />`;

        // Try to inject before </body>, otherwise append to end
        if (htmlContent.includes('</body>')) {
            return htmlContent.replace('</body>', `${trackingPixelHtml}</body>`);
        }
        return htmlContent + trackingPixelHtml;
    });

    /**
     * Helper function: Replace URLs with tracking redirects
     */
    app.decorate('wrapLinksWithTracking', (htmlContent: string, analyticsId: string, userId: string): string => {
        // Regex to find all href attributes
        const hrefRegex = /href=["']([^"']+)["']/gi;

        return htmlContent.replace(hrefRegex, (match, url) => {
            // Skip if already a tracking URL or anchor link
            if (url.includes('/track/click') || url.startsWith('#') || url.startsWith('mailto:')) {
                return match;
            }

            // Encode destination URL
            const encodedUrl = encodeURIComponent(url);
            const trackingUrl = `http://localhost:3001/track/click/${analyticsId}/${userId}?to=${encodedUrl}`;

            return `href="${trackingUrl}"`;
        });
    });
}

// Extend Fastify types
declare module 'fastify' {
    interface FastifyInstance {
        injectTrackingPixel: (htmlContent: string, analyticsId: string, userId: string) => string;
        wrapLinksWithTracking: (htmlContent: string, analyticsId: string, userId: string) => string;
    }
}
