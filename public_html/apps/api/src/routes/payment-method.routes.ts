import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { prisma, PaymentMethodType } from '@pariaza/database';
import { z } from 'zod';
import { EncryptionService } from '../services/encryption.service.js';

// Validation Schema
const createPaymentMethodSchema = z.object({
    type: z.enum(['IBAN', 'REVOLUT', 'PAYPAL', 'WISE']),
    holderName: z.string().min(2, 'Holder Name is required'),
    details: z.string().min(3, 'Details/IBAN/Handle required'),
    label: z.string().optional(),
    currency: z.string().default('EUR'),
    country: z.string().optional(),
});

const MAX_PAYMENT_METHODS = 5;

export default async function paymentMethodRoutes(fastify: FastifyInstance) {

    // GET /api/payment-methods - List all methods for current user
    fastify.get('/', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        const userId = (request.user as any).id;

        const methods = await prisma.paymentMethod.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ],
            select: {
                id: true,
                type: true,
                label: true,
                holderName: true,
                detailsMasked: true,
                currency: true,
                country: true,
                isDefault: true,
                verifiedAt: true,
                createdAt: true
            }
        });

        return reply.send(methods);
    });

    // POST /api/payment-methods - Add new method
    fastify.post('/', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        const userId = (request.user as any).id;
        const userIp = request.ip;
        const userAgent = request.headers['user-agent'] || 'Unknown';

        // Validate Body
        const result = createPaymentMethodSchema.safeParse(request.body);
        if (!result.success) {
            return reply.code(400).send({ error: 'Validation failed', details: result.error.formErrors });
        }

        const { type, holderName, details, label, currency, country } = result.data;

        // 1. Check Constraints (Max Methods)
        const currentCount = await prisma.paymentMethod.count({ where: { userId } });
        if (currentCount >= MAX_PAYMENT_METHODS) {
            return reply.code(400).send({ error: `Maximum limit of ${MAX_PAYMENT_METHODS} payment methods reached.` });
        }

        // 2. Encryption & Hashing
        const detailsEncrypted = EncryptionService.encrypt(details);
        const detailsHash = EncryptionService.hash(details);

        // 3. Masking Logic
        let masked = details;
        if (type === 'IBAN') {
            masked = details.length > 4 ? `IBAN •••• ${details.slice(-4)}` : `IBAN ••••`;
        } else if (type === 'REVOLUT') {
            const clean = details.trim();
            if (clean.startsWith('@')) {
                masked = `Revolut @••••`;
            } else if (clean.length > 3) {
                masked = `Revolut •••• ${clean.slice(-3)}`;
            } else {
                masked = `Revolut @••••`;
            }
        } else {
            masked = `${type} •••• ${details.slice(-4)}`;
        }

        // 4. Default Logic
        const isDefault = currentCount === 0;

        try {
            const method = await prisma.paymentMethod.create({
                data: {
                    userId,
                    type: type as PaymentMethodType,
                    holderName,
                    detailsMasked: masked,
                    detailsEncrypted: detailsEncrypted,
                    detailsHash: detailsHash,
                    label,
                    currency,
                    country,
                    isDefault
                },
                select: {
                    id: true,
                    type: true,
                    label: true,
                    holderName: true,
                    detailsMasked: true,
                    currency: true,
                    isDefault: true
                }
            });

            // 5. Audit Log
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'PAYMENT_METHOD_CREATED',
                    resourceId: method.id,
                    resourceType: 'PAYMENT_METHOD',
                    metadata: JSON.stringify({ type, label, isDefault }),
                    ipAddress: userIp,
                    userAgent: userAgent
                }
            });

            return reply.send(method);
        } catch (err: any) {
            if (err.code === 'P2002') {
                return reply.code(409).send({ error: 'This payment method already exists on your account.' });
            }
            fastify.log.error('Failed to create payment method', err);
            return reply.code(500).send({ error: 'Failed to add payment method' });
        }
    });

    // PATCH /api/payment-methods/:id/default - Set as default
    fastify.patch('/:id/default', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { id } = request.params as any;
        const userId = (request.user as any).id;

        const existing = await prisma.paymentMethod.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return reply.code(404).send({ error: 'Method not found' });
        }

        await prisma.$transaction([
            prisma.paymentMethod.updateMany({
                where: { userId },
                data: { isDefault: false }
            }),
            prisma.paymentMethod.update({
                where: { id },
                data: { isDefault: true }
            })
        ]);

        await prisma.auditLog.create({
            data: {
                userId,
                action: 'PAYMENT_METHOD_SET_DEFAULT',
                resourceId: id,
                resourceType: 'PAYMENT_METHOD',
                ipAddress: request.ip,
                userAgent: request.headers['user-agent']
            }
        });

        return reply.send({ success: true, message: 'Default method updated' });
    });

    // DELETE /api/payment-methods/:id
    fastify.delete('/:id', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { id } = request.params as any;
        const userId = (request.user as any).id;

        const existing = await prisma.paymentMethod.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return reply.code(404).send({ error: 'Method not found' });
        }

        // Logic: If isDefault, we must reassign default to another method if exists
        await prisma.$transaction(async (tx) => {
            // Delete current
            await tx.paymentMethod.delete({ where: { id } });

            if (existing.isDefault) {
                // Find substitute
                const nextMethod = await tx.paymentMethod.findFirst({
                    where: { userId },
                    orderBy: { createdAt: 'desc' }
                });

                if (nextMethod) {
                    await tx.paymentMethod.update({
                        where: { id: nextMethod.id },
                        data: { isDefault: true }
                    });
                }
            }
        });

        await prisma.auditLog.create({
            data: {
                userId,
                action: 'PAYMENT_METHOD_DELETED',
                resourceId: id,
                resourceType: 'PAYMENT_METHOD',
                metadata: JSON.stringify({ wazDefault: existing.isDefault }),
                ipAddress: request.ip,
                userAgent: request.headers['user-agent']
            }
        });

        return reply.send({ success: true, message: 'Method deleted' });
    });
}
