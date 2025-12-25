
import { FastifyInstance } from 'fastify';
import { prisma } from '';
import { authenticate } from '';
import { requireAdmin } from '';
import { z } from 'zod';
import { users_status } from '@prisma/client';
import { emailService } from '';

export async function adminRoutes(app: FastifyInstance) {
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
            await emailService.sendActivationEmail({
                id: user.id,
                name: user.name || user.email,
                email: user.email,
            });
            console.log(`✅ Activation email sent to ${user.email}`);
        } catch (emailError) {
            // Log error but don't fail the approval
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
}

