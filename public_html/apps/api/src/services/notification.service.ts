import { prisma } from '@pariaza/database';

interface NotificationThresholds {
    welcome: number;
    streakAlert: number;
    checkin: number;
}

/**
 * Notification Service for Broadcast Opportunities
 */
export class NotificationService {
    /**
     * Calculate dynamic thresholds based on total user count
     * Scales 10x: ≤100 → 101-1k → 1k-10k → 10k-100k → 100k+
     */
    calculateDynamicThresholds(totalUsers: number): NotificationThresholds {
        if (totalUsers <= 100) {
            return { welcome: 3, streakAlert: 1, checkin: 5 };
        } else if (totalUsers <= 1000) {
            return { welcome: 30, streakAlert: 10, checkin: 50 };
        } else if (totalUsers <= 10000) {
            return { welcome: 300, streakAlert: 100, checkin: 500 };
        } else if (totalUsers <= 100000) {
            return { welcome: 3000, streakAlert: 1000, checkin: 5000 };
        } else {
            return { welcome: 30000, streakAlert: 10000, checkin: 50000 };
        }
    }

    /**
     * Check if duplicate notification exists in last 24 hours
     */
    async checkDuplicateNotification(
        userId: string,
        templateId: string
    ): Promise<boolean> {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const existing = await prisma.broadcastNotification.findFirst({
            where: {
                userId,
                templateId,
                createdAt: { gte: last24Hours },
            },
        });

        return existing !== null;
    }

    /**
     * Create broadcast notification
     */
    async createBroadcastNotification(
        userId: string,
        templateId: string,
        title: string,
        message: string,
        recipientCount: number,
        isManual: boolean = false
    ) {
        // Check for duplicates (unless manual)
        if (!isManual) {
            const isDuplicate = await this.checkDuplicateNotification(userId, templateId);
            if (isDuplicate) {
                console.log(`🔕 Skipping duplicate notification for template "${templateId}"`);
                return null;
            }
        }

        const notification = await prisma.broadcastNotification.create({
            data: {
                userId,
                templateId,
                title,
                message,
                recipientCount,
                isManual,
                type: 'BROADCAST_OPPORTUNITY',
            },
        });

        console.log(`🔔 Created notification: "${title}" for ${recipientCount} users`);
        return notification;
    }

    /**
     * Get notifications for admin (FIFO order)
     */
    async getNotificationsForAdmin(userId: string, includeRead: boolean = false) {
        const where: any = { userId };

        if (!includeRead) {
            where.isRead = false;
        }

        const notifications = await prisma.broadcastNotification.findMany({
            where,
            orderBy: { createdAt: 'asc' }, // FIFO - First In, First Out
            take: 50, // Limit to prevent overflow
        });

        return notifications;
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string) {
        const notification = await prisma.broadcastNotification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        console.log(`✅ Marked notification "${notification.title}" as read`);
        return notification;
    }

    /**
     * Mark notification as read by templateId (when broadcast sent)
     */
    async markAsReadByTemplate(userId: string, templateId: string) {
        const result = await prisma.broadcastNotification.updateMany({
            where: {
                userId,
                templateId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        console.log(`✅ Marked ${result.count} notifications as read for template "${templateId}"`);
        return result;
    }

    /**
     * Delete notification from history
     */
    async deleteNotification(notificationId: string) {
        await prisma.broadcastNotification.delete({
            where: { id: notificationId },
        });

        console.log(`🗑️ Deleted notification ${notificationId}`);
    }

    /**
     * Get unread count for badge
     */
    async getUnreadCount(userId: string): Promise<number> {
        return await prisma.broadcastNotification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }
}

export const notificationService = new NotificationService();
