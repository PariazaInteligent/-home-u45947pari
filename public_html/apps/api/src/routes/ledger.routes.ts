import { FastifyInstance } from 'fastify';
import { prisma } from '@pariaza/database';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { ledgerService } from '../services/ledger.service.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Decimal } from 'decimal.js';

const createEntrySchema = z.object({
    description: z.string(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    lines: z.array(
        z.object({
            debitAccountId: z.string().optional(),
            creditAccountId: z.string().optional(),
            amount: z.number().positive(),
            userId: z.string().optional(),
            description: z.string().optional(),
        })
    ).min(2),
});

const reversalSchema = z.object({
    entryId: z.string(),
    reason: z.string(),
});

export async function ledgerRoutes(app: FastifyInstance) {
    // Get ledger entries (investors see only their own)
    app.get('/ledger/entries', {
        schema: {
            tags: ['Ledger'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                    userId: { type: 'string' },
                },
            },
        },
        preHandler: [authenticate],
    }, async (request, reply) => {
        const { page = 1, limit = 20, userId } = request.query as any;

        // Investors can only see their own entries
        const effectiveUserId =
            request.user!.role === 'INVESTOR' ? request.user!.id : userId;

        const where = effectiveUserId
            ? {
                ledger_lines: {
                    some: {
                        userId: effectiveUserId,
                    },
                },
            }
            : {};

        const [entries, total] = await Promise.all([
            prisma.ledgerEntry.findMany({
                where,
                include: {
                    ledger_lines: {
                        include: {
                            accounts_ledger_lines_debitAccountIdToaccounts: { select: { code: true, name: true } },
                            accounts_ledger_lines_creditAccountIdToaccounts: { select: { code: true, name: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.ledgerEntry.count({ where }),
        ]);

        reply.send({
            entries,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    });

    // Get account balances (investors see only their equity accounts, admins see all)
    app.get('/ledger/balance', {
        schema: {
            tags: ['Ledger'],
            security: [{ bearerAuth: [] }],
            description: 'Get account balances scoped per user (investors see only their equity)',
        },
        preHandler: [authenticate],
    }, async (request, reply) => {
        const user = request.user!;

        if (user.role === 'INVESTOR') {
            //Investor: toate conturile EQUITY care au ledger_lines cu userId
            const equityAccounts = await prisma.account.findMany({
                where: { type: 'EQUITY' },
            });

            const balances = await Promise.all(
                equityAccounts.map(async (account) => {
                    const bal = await ledgerService.getAccountBalance(account.id, user.id);

                    // Return doar dacă are balance != 0 (are linii pentru user)
                    if (bal.totalDebits.eq(0) && bal.totalCredits.eq(0)) {
                        return null;
                    }

                    return {
                        accountCode: account.code,
                        accountName: account.name,
                        accountType: account.type,
                        balance: bal.balance.toFixed(2),
                        totalDebits: bal.totalDebits.toFixed(2),
                        totalCredits: bal.totalCredits.toFixed(2),
                    };
                })
            );

            const filteredBalances = balances.filter((b) => b !== null);

            // Calculare totalEquity cu Decimal, nu parseFloat
            let totalEquityDecimal = new Decimal(0);
            filteredBalances.forEach((b) => {
                if (b) {
                    const bal = balances.find(item => item === b);
                    if (bal) {
                        // Recalculăm din sursa Decimal originală
                        const account = equityAccounts.find(a => a.code === bal.accountCode);
                        if (account) {
                            // This block is problematic as it's asynchronous and won't update totalEquityDecimal before reply.send
                            // The correct calculation is done directly in reply.send using reduce.
                            // await ledgerService.getAccountBalance(account.id, user.id).then(balData => {
                            //     totalEquityDecimal = totalEquityDecimal.add(balData.balance);
                            // });
                        }
                    }
                }
            });

            return reply.send({
                balances: filteredBalances,
                totalEquity: filteredBalances.reduce(
                    (sum, b) => sum.add(new Decimal(b!.balance)),
                    new Decimal(0)
                ).toFixed(2),
            });
        }

        // ADMIN: toate conturile (ASSET, EQUITY, REVENUE)
        const accounts = await prisma.account.findMany({
            where: { type: { in: ['ASSET', 'EQUITY', 'REVENUE'] } },
            orderBy: [{ type: 'asc' }, { code: 'asc' }],
        });

        const balances = await Promise.all(
            accounts.map(async (account) => {
                const bal = await ledgerService.getAccountBalance(account.id);
                return {
                    accountCode: account.code,
                    accountName: account.name,
                    accountType: account.type,
                    balance: bal.balance.toFixed(2),
                    totalDebits: bal.totalDebits.toFixed(2),
                    totalCredits: bal.totalCredits.toFixed(2),
                };
            })
        );

        const totalEquity = balances
            .filter((b) => b.accountType === 'EQUITY')
            .reduce((sum, b) => sum.add(new Decimal(b.balance)), new Decimal(0));

        reply.send({
            balances,
            totalEquity: totalEquity.toFixed(2),
        });
    });


    // Get single entry
    app.get('/ledger/entries/:id', {
        schema: {
            tags: ['Ledger'],
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

        const entry = await prisma.ledgerEntry.findUnique({
            where: { id },
            include: {
                ledger_lines: {
                    include: {
                        accounts_ledger_lines_debitAccountIdToaccounts: true,
                        accounts_ledger_lines_creditAccountIdToaccounts: true,

                    },
                },
            },
        });

        if (!entry) {
            return reply.code(404).send({ error: 'Not Found', message: 'Entry not found' });
        }

        // Investors can only see entries with their lines
        if (request.user!.role === 'INVESTOR') {
            const hasUserLine = entry.ledger_lines.some(line => line.userId === request.user!.id);
            if (!hasUserLine) {
                return reply.code(403).send({ error: 'Forbidden', message: 'Access denied' });
            }
        }

        reply.send(entry);
    });

    // Create entry (admin only)
    app.post('/ledger/entries', {
        schema: {
            tags: ['Ledger'],
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(createEntrySchema),
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const data = createEntrySchema.parse(request.body);

        try {
            const entry = await ledgerService.createEntry({
                description: data.description,
                referenceType: data.referenceType,
                referenceId: data.referenceId,
                createdBy: request.user!.id,
                lines: data.lines.map(line => ({
                    ...line,
                    amount: new Decimal(line.amount),
                })),
            });

            reply.code(201).send(entry);
        } catch (err: any) {
            reply.code(400).send({ error: 'Bad Request', message: err.message });
        }
    });

    // Reverse entry (admin only)
    app.post('/ledger/entries/:id/reverse', {
        schema: {
            tags: ['Ledger'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            body: {
                type: 'object',
                properties: {
                    reason: { type: 'string' },
                },
                required: ['reason'],
            },
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const { reason } = request.body as { reason: string };

        try {
            const reversal = await ledgerService.createReversal(id, reason, request.user!.id);
            reply.code(201).send(reversal);
        } catch (err: any) {
            reply.code(400).send({ error: 'Bad Request', message: err.message });
        }
    });

    // Get balance sheet (admin only)
    app.get('/ledger/balance-sheet', {
        schema: {
            tags: ['Ledger'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const accounts = await prisma.account.findMany({
            orderBy: [{ type: 'asc' }, { code: 'asc' }],
        });

        const balances = await Promise.all(
            accounts.map(async (account) => {
                const balance = await ledgerService.getAccountBalance(account.id);
                return {
                    ...account,
                    balance: balance.balance.toFixed(2),
                    totalDebits: balance.totalDebits.toFixed(2),
                    totalCredits: balance.totalCredits.toFixed(2),
                };
            })
        );

        // Group by type
        const grouped = balances.reduce((acc, item) => {
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        }, {} as Record<string, typeof balances>);

        reply.send(grouped);
    });

    // Verify ledger integrity (admin only)
    app.get('/ledger/reconcile', {
        schema: {
            tags: ['Ledger'],
            security: [{ bearerAuth: [] }],
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        const result = await ledgerService.verifyIntegrity();
        reply.send(result);
    });
}
