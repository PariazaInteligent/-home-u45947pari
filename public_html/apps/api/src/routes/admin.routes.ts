
import { FastifyInstance } from 'fastify';
import { prisma, users_status } from '@pariaza/database';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { z } from 'zod';
import { emailService } from '../services/email.service.js';
import { getTierCacheService } from '../services/tier-cache.service.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { DailySnapshotService } from '../services/daily-snapshot.service.js';
import { LoyaltyService } from '../services/loyalty.service.js';

export async function adminRoutes(app: FastifyInstance) {
    // Get Admin Notifications (Unified: System + Broadcast Opportunities)
    app.get('/admin/notifications', {
        schema: {
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    includeRead: { type: 'string' } // fastify querystring often comes as string 'true'/'false' unless coerced
                }
            }
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const query = request.query as { includeRead?: string };
            const includeRead = query.includeRead === 'true';

            const notifications: Array<{
                id: number | string;
                type: string;
                title: string;
                message: string;
                time: string;
                createdAt: string; // Add createdAt for sorting
                read: boolean;
                actionLink?: string;
                templateId?: string; // Propagate templateId
            }> = [];

            // 1. Check for pending users (Always show if present, treated as unread warning)
            const pendingCount = await prisma.user.count({
                where: { status: users_status.PENDING_VERIFICATION },
            });

            if (pendingCount > 0) {
                // Get the oldest pending user for "time" context
                const oldestPending = await prisma.user.findFirst({
                    where: { status: users_status.PENDING_VERIFICATION },
                    orderBy: { createdAt: 'asc' },
                    select: { createdAt: true }
                });

                const timeAgo = oldestPending
                    ? Math.floor((new Date().getTime() - new Date(oldestPending.createdAt).getTime()) / 60000)
                    : 0;

                let timeString = 'Chiar acum';
                if (timeAgo > 60) timeString = `${Math.floor(timeAgo / 60)}h în urmă`;
                else if (timeAgo > 0) timeString = `${timeAgo} min în urmă`;

                notifications.push({
                    id: 'pending_users', // String ID for React key
                    type: 'warning',
                    title: 'CERERE UTILIZATOR NOU',
                    message: `${pendingCount} utilizator${pendingCount === 1 ? '' : 'i'} ${pendingCount === 1 ? 'așteaptă' : 'așteaptă'} aprobarea ta.`,
                    time: timeString,
                    createdAt: new Date().toISOString(), // Treat as "now" sort-wise
                    read: false,
                    actionLink: '/admin#approval-requests'
                });
            }

            // 2. Fetch broadcast opportunity notifications
            const whereClause: any = { userId: user.id };
            if (!includeRead) {
                whereClause.isRead = false;
            }

            const broadcastNotifications = await prisma.broadcastNotification.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' }, // Newest first is better for UI usually
                take: includeRead ? 100 : 10, // Fetch more if reading history
            });

            // Map broadcast notifications to unified format
            for (const notif of broadcastNotifications) {
                const timeAgo = Math.floor((new Date().getTime() - new Date(notif.createdAt).getTime()) / 60000);
                let timeString = 'Chiar acum';
                if (timeAgo > 60) timeString = `${Math.floor(timeAgo / 60)}h în urmă`;
                else if (timeAgo > 0) timeString = `${timeAgo} min în urmă`;

                notifications.push({
                    id: notif.id, // Use broadcast notification ID
                    type: 'broadcast_opportunity',
                    title: notif.title,
                    message: `${notif.message} (${notif.recipientCount} utilizatori)`,
                    time: timeString,
                    createdAt: notif.createdAt.toISOString(),
                    read: notif.isRead,
                    templateId: notif.templateId || undefined,
                    actionLink: `/admin/broadcast?template=${notif.templateId}&highlight=true`
                });
            }

            reply.send(notifications);
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get Admin Stats (Real Database Data)
    app.get('/admin/stats', {
        schema: {
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        try {
            // Fetch REAL pending users from database
            const pendingUsers = await prisma.user.findMany({
                where: { status: users_status.PENDING_VERIFICATION },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    ticketId: true,
                    createdAt: true,
                },
            });

            // Count total and active users
            const totalUsers = await prisma.user.count();
            const activeUsers = await prisma.user.count({
                where: { status: users_status.ACTIVE },
            });

            // Calculate real fund total (EUR)
            // Sum of completed deposits (field: amount, status: APPROVED)
            const depositsSum = await prisma.deposit.aggregate({
                where: { status: 'APPROVED' },
                _sum: { amount: true },
            }).catch(() => ({ _sum: { amount: null } }));

            // Sum of completed withdrawals (field: amountPayout, status: PAID)
            const withdrawalsSum = await prisma.withdrawal.aggregate({
                where: { status: 'PAID' },
                _sum: { amountPayout: true },
            }).catch(() => ({ _sum: { amountPayout: null } }));

            // Calculate PROFIT from settled trades
            // Profit = SUM(resultAmount for SETTLED_WIN) - SUM(stake for SETTLED_LOSS) - SUM(stake for SETTLED_WIN when they paid to enter)
            const tradesProfit = await prisma.trade.aggregate({
                where: {
                    status: {
                        in: ['SETTLED_WIN', 'SETTLED_LOSS'],
                    },
                },
                _sum: {
                    resultAmount: true,  // Total payout (positive for wins, 0 for losses)
                    stake: true,         // Total stakes placed
                },
            }).catch(() => ({ _sum: { resultAmount: null, stake: null } }));

            // Total Fund = Deposits - Withdrawals + Trading Profit
            const tradingProfit = Number(tradesProfit._sum.resultAmount || 0) - Number(tradesProfit._sum.stake || 0);
            const totalFundEUR = Number(depositsSum._sum.amount || 0) - Number(withdrawalsSum._sum.amountPayout || 0) + tradingProfit;

            // Count ALL settled trades (status: SETTLED_WIN or SETTLED_LOSS)
            const totalTrades = await prisma.trade.count({
                where: {
                    status: {
                        in: ['SETTLED_WIN', 'SETTLED_LOSS'],
                    },
                },
            }).catch(() => 0);

            // Calculate system load as percentage of active users
            const systemLoad = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

            // CRITICAL: Explicit data source verification
            reply.send({
                dataSource: 'DATABASE', // FLAG for frontend verification
                timestamp: new Date().toISOString(),
                kpiMetrics: {
                    totalFundEUR: Number(totalFundEUR.toFixed(2)),
                    pendingUsers: pendingUsers.length,
                    totalTrades,  // Renamed from activeBets
                    systemLoad,   // % of active users
                    totalUsers,
                    activeUsers,
                    tradingProfit: Number(tradingProfit.toFixed(2)),  // Extra metric for debugging
                },
                pendingUsers: pendingUsers.map((user) => ({
                    id: user.id,
                    name: user.name || user.email,
                    email: user.email,
                    ticketId: user.ticketId || `USER-${user.id.slice(0, 8)}`,
                    createdAt: user.createdAt,
                    tier: 'Investor', // Default tier
                })),
            });

            console.log(`📊 Admin stats fetched: ${pendingUsers.length} pending users, €${totalFundEUR.toFixed(2)} in fund`);
        } catch (error) {
            console.error('❌ Error fetching admin stats:', error);
            reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Failed to fetch admin statistics',
            });
        }
    });

    // List Users (by status)
    app.get('/admin/users', {
        schema: {
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    status: { type: 'string' },
                },
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { status } = request.query as { status?: string };
        const where = status ? { status: status as users_status } : {};

        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        reply.send(users);
    });

    // Get Single User by ID (for Admin Search)
    app.get('/admin/users/:id', {
        schema: {
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                tier: true,
                createdAt: true,
                updatedAt: true,
                loyaltyPoints: true,
                streakDays: true,
                clearanceLevel: true,
            },
        });

        if (!user) {
            return reply.code(404).send({
                error: 'Not Found',
                message: 'Investor not found with this ID'
            });
        }

        reply.send(user);
    });


    // Approve User
    app.post('/admin/users/:id/approve', {
        schema: {
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        // Get user details before updating
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                status: true,
                password: true,
            },
        });

        if (!user) {
            return reply.code(404).send({ error: 'Not Found', message: 'User not found' });
        }

        // Update status to ACTIVE
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status: users_status.ACTIVE },
        });

        // Send activation email
        try {
            // Generate set-password token if user has no password
            let setPasswordToken: string | null = null;
            if (!user.password) {
                const token = crypto.randomBytes(32).toString('hex');
                const tokenHash = await bcrypt.hash(token, 10);
                const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

                await prisma.passwordResetToken.create({
                    data: {
                        userId: user.id,
                        tokenHash,
                        expiresAt,
                        purpose: 'SET_PASSWORD',
                    },
                });

                setPasswordToken = token;
            }

            try {
                const fs = await import('fs');
                const path = await import('path');
                const logPath = path.join(process.cwd(), 'email_debug.log');
                fs.appendFileSync(logPath, `[APPROVE] User ${user.id} (${user.email}) status changed: ${user.status} -> ACTIVE. Password: ${user.password ? 'SET' : 'NULL'}\n`);
                fs.appendFileSync(logPath, `[EMAIL_ACTIVATION] Sending to ${user.email} (Token: ${setPasswordToken ? 'GENERATED' : 'NONE'})\n`);
            } catch (e) { }

            await emailService.sendActivationEmail({
                id: user.id,
                name: user.name || user.email,
                email: user.email,
            }, setPasswordToken);
            console.log(`✅ Activation email sent to ${user.email}`);
        } catch (emailError) {
            // Log error but don't fail the approval
            try {
                const fs = await import('fs');
                const path = await import('path');
                const logPath = path.join(process.cwd(), 'email_debug.log');
                fs.appendFileSync(logPath, `❌ Failed to send activation email: ${emailError}\n`);
            } catch (e) { }

            console.error('❌ Failed to send activation email:', emailError);
            console.error('Email Error Details:', {
                userEmail: user.email,
                errorMessage: emailError instanceof Error ? emailError.message : 'Unknown error',
                errorStack: emailError instanceof Error ? emailError.stack : undefined,
            });
        }

        reply.send({ message: 'User approved', user: updatedUser });
    });

    // Reject User (Delete)
    app.post('/admin/users/:id/reject', {
        schema: {
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        // Get user details BEFORE deleting
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true },
        });

        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }

        // Delete the user
        await prisma.user.delete({
            where: { id },
        });

        // Send rejection email
        try {
            await emailService.sendRejectionEmail({
                id: user.id,
                name: user.name || user.email,
                email: user.email,
            });
            console.log(`📧 Rejection email sent to ${user.email}`);
        } catch (emailError) {
            console.error('❌ Failed to send rejection email:', emailError);
        }

        reply.send({ message: 'User rejected and deleted' });
    });

    // ========== TIER MANAGEMENT CRUD ==========

    // List all tiers
    app.get('/admin/tiers', {
        schema: {
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const tiers = await prisma.leagueTier.findMany({
            orderBy: { priority: 'asc' }
        });
        reply.send({ success: true, tiers });
    });

    // Get single tier
    app.get('/admin/tiers/:id', {
        schema: {
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const tier = await prisma.leagueTier.findUnique({ where: { id } });

        if (!tier) {
            return reply.code(404).send({ success: false, error: 'Tier not found' });
        }

        reply.send({ success: true, tier });
    });

    // Update tier
    app.patch('/admin/tiers/:id', {
        schema: {
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const updates = request.body as any;

        // Update tier with auto-increment version
        const tier = await prisma.leagueTier.update({
            where: { id },
            data: {
                ...updates,
                benefitsVersion: { increment: 1 }
            }
        });

        // Invalidate cache
        const tierCacheService = getTierCacheService(prisma);
        tierCacheService.invalidate(tier.tierCode);

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: (request.user as any).id,
                action: 'TIER_UPDATE',
                metadata: JSON.stringify({ tierId: id, updates }),
                ipAddress: request.ip
            }
        });

        reply.send({ success: true, tier });
    });

    // Create new tier
    app.post('/admin/tiers', {
        schema: {
            tags: ['Admin'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const data = request.body as any;

        const tier = await prisma.leagueTier.create({ data });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: (request.user as any).id,
                action: 'TIER_CREATE',
                metadata: JSON.stringify({ tierId: tier.id }),
                ipAddress: request.ip
            }
        });

        reply.send({ success: true, tier });
    });

    // === STREAK CONFIG ENDPOINTS ===

    // GET Streak Config
    app.get('/admin/streak/config', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
        const config = await prisma.streakConfig.findFirst();
        reply.send({ success: true, config });
    });

    // PATCH Streak Config
    app.patch('/admin/streak/config', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
        const updates = request.body as any;

        const config = await prisma.streakConfig.upsert({
            where: { id: updates.id || 'default_config' },
            update: { ...updates, version: { increment: 1 } },
            create: { id: 'default_config', ...updates }
        });

        reply.send({ success: true, config });
    });

    // POST Manual Snapshot Trigger
    app.post('/admin/snapshot/trigger', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
        const snapshotService = new DailySnapshotService();
        const snapshot = await snapshotService.manualTrigger();
        reply.send({ success: true, snapshot });
    });

    // === LOYALTY RULES CRUD ===

    // GET All Loyalty Rules
    app.get('/admin/loyalty/rules', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
        const rules = await prisma.loyaltyRule.findMany({
            orderBy: { priority: 'desc' }
        });
        reply.send({ success: true, rules });
    });

    // GET Single Loyalty Rule
    app.get('/admin/loyalty/rules/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const rule = await prisma.loyaltyRule.findUnique({ where: { id } });
        reply.send({ success: true, rule });
    });

    // POST Create Loyalty Rule
    app.post('/admin/loyalty/rules', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
        const data = request.body as any;

        const rule = await prisma.loyaltyRule.create({ data });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: (request.user as any).id,
                action: 'LOYALTY_RULE_CREATE',
                metadata: JSON.stringify({ ruleId: rule.id }),
                ipAddress: request.ip
            }
        });

        reply.send({ success: true, rule });
    });

    // PATCH Update Loyalty Rule
    app.patch('/admin/loyalty/rules/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const updates = request.body as any;

        const rule = await prisma.loyaltyRule.update({
            where: { id },
            data: { ...updates, version: { increment: 1 } }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: (request.user as any).id,
                action: 'LOYALTY_RULE_UPDATE',
                metadata: JSON.stringify({ ruleId: id, updates }),
                ipAddress: request.ip
            }
        });

        reply.send({ success: true, rule });
    });

    // DELETE Loyalty Rule
    app.delete('/admin/loyalty/rules/:id', { preHandler: [authenticate, requireAdmin] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        await prisma.loyaltyRule.delete({ where: { id } });
        reply.send({ success: true });
    });

    // === CLEARANCE LEVEL MANAGEMENT ===

    // GET All Clearance Configs
    app.get('/admin/clearance/config', {
        preHandler: [authenticate, requireAdmin]
    }, async (request, reply) => {
        const { ClearanceService } = await import('../services/clearance.service.js');
        const clearanceService = new ClearanceService();
        const configs = await clearanceService.getAllConfigs();
        reply.send({ success: true, configs });
    });

    // GET Single Clearance Config
    app.get('/admin/clearance/config/:level', {
        preHandler: [authenticate, requireAdmin]
    }, async (request, reply) => {
        const { level } = request.params as { level: string };
        const { ClearanceService } = await import('../services/clearance.service.js');
        const clearanceService = new ClearanceService();
        const config = await clearanceService.getConfig(Number(level));

        if (!config) {
            return reply.code(404).send({ error: 'Config not found' });
        }

        reply.send({ success: true, config });
    });

    // PATCH Update Clearance Config (invalidates cache)
    app.patch('/admin/clearance/config/:level', {
        preHandler: [authenticate, requireAdmin]
    }, async (request, reply) => {
        const { level } = request.params as { level: string };
        const updates = request.body as any;

        const { ClearanceService } = await import('../services/clearance.service.js');
        const clearanceService = new ClearanceService();
        const config = await clearanceService.updateConfig(Number(level), updates);

        // Audit log for config change
        await prisma.auditLog.create({
            data: {
                userId: (request.user as any).id,
                action: 'CLEARANCE_CONFIG_UPDATE',
                metadata: JSON.stringify({ level, updates }),
                ipAddress: request.ip
            }
        });

        reply.send({ success: true, config, message: 'Config updated successfully' });
    });

    // POST Recalculate User Clearance (idempotent, audit only on change)
    app.post('/admin/users/:id/clearance/recalculate', {
        preHandler: [authenticate, requireAdmin]
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const { ClearanceService } = await import('../services/clearance.service.js');
        const clearanceService = new ClearanceService();
        const result = await clearanceService.updateUserClearance(id, 'ADMIN_MANUAL_TRIGGER');

        reply.send({
            success: true,
            ...result,
            message: result.changed
                ? `Clearance level updated: ${result.oldLevel} → ${result.newLevel}`
                : 'No change needed - user already at correct level'
        });
    });
}
