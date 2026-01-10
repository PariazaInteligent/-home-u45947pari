import { FastifyInstance } from 'fastify';
import { prisma } from '@pariaza/database';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { tradeService } from '../services/trade.service.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Decimal } from 'decimal.js';

const createTradeSchema = z.object({
    sport: z.string(),
    event: z.string(),
    market: z.string(),
    selection: z.string(),
    odds: z.number().positive(),
    stake: z.number().positive(),
});

const updateTradeSchema = z.object({
    sport: z.string().optional(),
    event: z.string().optional(),
    market: z.string().optional(),
    selection: z.string().optional(),
    odds: z.number().positive().optional(),
    stake: z.number().positive().optional(),
});

const settleTradeSchema = z.object({
    result: z.enum(['win', 'loss', 'void']),
    providerEventId: z.string(),
    providerOdds: z.number().positive(),
});

export async function tradeRoutes(app: FastifyInstance) {
    // List trades
    app.get('/trades', {
        schema: {
            tags: ['Trades'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                    status: { type: 'string' },
                },
            },
        },
        preHandler: [authenticate],
    }, async (request, reply) => {
        const { page = 1, limit = 20, status } = request.query as any;

        const user = request.user!;
        const baseWhere = status ? { status } : {};

        // INVESTOR vede doar trade-urile create de el, ADMIN vede toate
        const where = user.role === 'INVESTOR'
            ? { ...baseWhere, createdBy: user.id }
            : baseWhere;

        const [trades, total] = await Promise.all([
            prisma.trade.findMany({
                where,
                include: {
                    settlement_events: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.trade.count({ where }),
        ]);

        reply.send({
            trades,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    });

    // Get single trade
    app.get('/trades/:id', {
        schema: {
            tags: ['Trades'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        preHandler: [authenticate],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const trade = await prisma.trade.findUnique({
            where: { id },
            include: {
                settlement_events: true,
            },
        });

        if (!trade) {
            return reply.code(404).send({ error: 'Not Found', message: 'Trade not found' });
        }

        reply.send(trade);
    });

    // Create trade (admin only)
    app.post('/trades', {
        schema: {
            tags: ['Trades'],
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(createTradeSchema),
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const data = createTradeSchema.parse(request.body);

        const trade = await tradeService.createTrade({
            ...data,
            odds: new Decimal(data.odds),
            stake: new Decimal(data.stake),
            createdBy: request.user!.id,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
        });

        reply.code(201).send(trade);
    });

    // Update trade (admin only, pre-settlement)
    app.patch('/trades/:id', {
        schema: {
            tags: ['Trades'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            body: zodToJsonSchema(updateTradeSchema),
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const data = updateTradeSchema.parse(request.body);

        try {
            const updates: any = { ...data };
            if (data.odds) updates.odds = new Decimal(data.odds);
            if (data.stake) updates.stake = new Decimal(data.stake);

            const trade = await tradeService.updateTrade(
                id,
                updates,
                request.user!.id,
                request.ip,
                request.headers['user-agent']
            );

            reply.send(trade);
        } catch (err: any) {
            reply.code(400).send({ error: 'Bad Request', message: err.message });
        }
    });

    // Settle trade (admin only)
    app.post('/trades/:id/settle', {
        schema: {
            tags: ['Trades'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            body: zodToJsonSchema(settleTradeSchema),
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const data = settleTradeSchema.parse(request.body);

        try {
            const result = await tradeService.settleTrade(
                id,
                data.result,
                data.providerEventId,
                new Decimal(data.providerOdds),
                request.user!.id,
                request.ip,
                request.headers['user-agent']
            );

            reply.send(result);
        } catch (err: any) {
            reply.code(400).send({ error: 'Bad Request', message: err.message });
        }
    });
}
