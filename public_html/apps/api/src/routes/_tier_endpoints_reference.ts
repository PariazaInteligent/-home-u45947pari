import { FastifyInstance } from 'fastify';
import { prisma } from '@pariaza/database';
import { authenticate } from '../middleware/auth.js';
import { users_status } from '@prisma/client';
import { sendEmail } from '../services/email.service.js';
import { requireAdmin } from '../middleware/auth.js';

export default async function adminRoutes(app: FastifyInstance) {
    /* existing endpoints... (approve, reject, stats, users list, etc.) */

    // PATCH /admin/users/:id/tier - Manual Tier Override
    app.patch('/admin/users/:id/tier', {
        schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
        preHandler: [authenticate, requireAdmin],
    }, async (request: any, reply) => {
        try {
            const { id } = request.params;
            const { tierCode } = request.body;

            const tier = await prisma.leagueTier.findUnique({ where: { tierCode } });
            if (!tier) return reply.code(400).send({ error: 'Invalid tier code' });

            const user = await prisma.user.findUnique({ where: { id }, select: { tier: true, name: true } });
            if (!user) return reply.code(404).send({ error: 'User not found' });

            const oldTier = user.tier || 'ENTRY';
            await prisma.user.update({ where: { id }, data: { tier: tierCode } });

            await prisma.auditLog.create({
                data: {
                    userId: request.user.id,
                    action: 'TIER_OVERRIDE',
                    resourceType: 'USER',
                    resourceId: id,
                    metadata: JSON.stringify({ oldTier, newTier: tierCode, userName: user.name })
                }
            });

            return reply.send({ success: true, oldTier, newTier: tierCode });
        } catch (error: any) {
            return reply.code(500).send({ error: 'Failed to update tier' });
        }
    });

    // POST /admin/tier/recalc - Recalculate Tiers
    app.post('/admin/tier/recalc', {
        schema: { tags: ['Admin'], security: [{ bearerAuth: [] }] },
        preHandler: [authenticate, requireAdmin],
    }, async (request: any, reply) => {
        try {
            const { userId } = request.body as { userId?: string };
            const { recalculateUserTier, recalculateAllUserTiers } = await import('../services/tier.service.js');

            if (userId) {
                const result = await recalculateUserTier(userId);
                if (result.changed) {
                    await prisma.auditLog.create({
                        data: {
                            userId: request.user.id,
                            action: 'TIER_RECALC',
                            resourceType: 'USER',
                            resourceId: userId,
                            metadata: JSON.stringify(result)
                        }
                    });
                }
                return reply.send({ success: true, ...result });
            } else {
                const results = await recalculateAllUserTiers();
                await prisma.auditLog.create({
                    data: { userId: request.user.id, action: 'TIER_RECALC_ALL', resourceType: 'SYSTEM', metadata: JSON.stringify(results) }
                });
                return reply.send({ success: true, ...results });
            }
        } catch (error: any) {
            return reply.code(500).send({ error: 'Failed to recalculate' });
        }
    });
}
