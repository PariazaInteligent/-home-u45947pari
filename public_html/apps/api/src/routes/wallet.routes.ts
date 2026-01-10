import { FastifyInstance } from 'fastify';
import { prisma } from '@pariaza/database';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { unitsService } from '../services/units.service.js';
import { ledgerService } from '../services/ledger.service.js';
import { auditService } from '../services/audit.service.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Decimal } from 'decimal.js';

const createDepositSchema = z.object({
    amount: z.number().positive(),
    proofUrl: z.string().url().optional(),
});

const approveDepositSchema = z.object({
    depositId: z.string(),
});

const rejectDepositSchema = z.object({
    depositId: z.string(),
    reason: z.string().min(10),
});

const createWithdrawalSchema = z.object({
    amount: z.number().positive(),
});

const approveWithdrawalSchema = z.object({
    withdrawalId: z.string(),
});

const rejectWithdrawalSchema = z.object({
    withdrawalId: z.string(),
    reason: z.string().min(10),
});

export async function walletRoutes(app: FastifyInstance) {
    // ==================== DEPOSITS ====================

    // List deposits (investor: doar ale sale, admin: toate)
    app.get('/wallet/deposits', {
        schema: {
            tags: ['Wallet'],
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
        config: {
            rateLimit: {
                max: 50,
                timeWindow: '1 minute',
            },
        },
    }, async (request, reply) => {
        const { page = 1, limit = 20, status } = request.query as any;
        const user = request.user!;

        const where: any = user.role === 'INVESTOR' ? { userId: user.id } : {};
        if (status) where.status = status;

        const [deposits, total] = await Promise.all([
            prisma.deposit.findMany({
                where,
                include: {
                    users: { select: { name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.deposit.count({ where }),
        ]);

        reply.send({
            deposits,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    });

    // Create deposit (investor)
    app.post('/wallet/deposits', {
        schema: {
            tags: ['Wallet'],
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(createDepositSchema),
        },
        preHandler: [authenticate],
        config: {
            rateLimit: {
                max: 50,
                timeWindow: '1 minute',
            },
        },
    }, async (request, reply) => {
        const data = createDepositSchema.parse(request.body);

        const deposit = await prisma.deposit.create({
            data: {
                userId: request.user!.id,
                amount: new Decimal(data.amount),
                proofUrl: data.proofUrl,
                status: 'PENDING',
            },
        });

        reply.code(201).send(deposit);
    });

    // Approve deposit (admin) - idempotent
    app.post('/wallet/deposits/approve', {
        schema: {
            tags: ['Wallet'],
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(approveDepositSchema),
        },
        preHandler: [authenticate, requireAdmin],
        config: {
            rateLimit: {
                max: 50,
                timeWindow: '1 minute',
            },
        },
    }, async (request, reply) => {
        const { depositId } = approveDepositSchema.parse(request.body);

        const deposit = await prisma.deposit.findUnique({
            where: { id: depositId },
        });

        if (!deposit) {
            return reply.code(404).send({ error: 'Not Found', message: 'Deposit not found' });
        }

        // Idempotency: dacă deja aprobat, returnează success
        if (deposit.status === 'APPROVED') {
            return reply.send({ message: 'Deposit deja aprobat', deposit });
        }

        if (deposit.status !== 'PENDING') {
            return reply.code(400).send({
                error: 'Bad Request',
                message: `Deposit status ${deposit.status} nu poate fi aprobat`,
            });
        }

        try {
            const result = await unitsService.issueUnits(
                depositId,
                request.user!.id,
                request.ip,
                request.headers['user-agent']
            );

            reply.send(result);
        } catch (err: any) {
            reply.code(400).send({ error: 'Bad Request', message: err.message });
        }
    });

    // Reject deposit (admin) - idempotent
    app.post('/wallet/deposits/reject', {
        schema: {
            tags: ['Wallet'],
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(rejectDepositSchema),
        },
        preHandler: [authenticate, requireAdmin],
        config: {
            rateLimit: {
                max: 50,
                timeWindow: '1 minute',
            },
        },
    }, async (request, reply) => {
        const { depositId, reason } = rejectDepositSchema.parse(request.body);

        const deposit = await prisma.deposit.findUnique({
            where: { id: depositId },
        });

        if (!deposit) {
            return reply.code(404).send({ error: 'Not Found', message: 'Deposit not found' });
        }

        // Idempotency: dacă deja respins, returnează success
        if (deposit.status === 'REJECTED') {
            return reply.send({ message: 'Deposit deja respins', deposit });
        }

        if (deposit.status !== 'PENDING') {
            return reply.code(400).send({
                error: 'Bad Request',
                message: `Deposit status ${deposit.status} nu poate fi respins`,
            });
        }

        const rejected = await prisma.deposit.update({
            where: { id: depositId },
            data: {
                status: 'REJECTED',
                rejectedAt: new Date(),
                rejectedBy: request.user!.id,
                rejectionReason: reason,
            },
        });

        // Audit log
        await auditService.log({
            userId: request.user!.id,
            action: 'DEPOSIT_REJECTED',
            resourceType: 'deposit',
            resourceId: depositId,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            metadata: { reason },
        });

        reply.send(rejected);
    });

    // ==================== WITHDRAWALS ====================

    // List withdrawals (investor: doar ale sale, admin: toate)
    app.get('/wallet/withdrawals', {
        schema: {
            tags: ['Wallet'],
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
        config: {
            rateLimit: {
                max: 50,
                timeWindow: '1 minute',
            },
        },
    }, async (request, reply) => {
        const { page = 1, limit = 20, status } = request.query as any;
        const user = request.user!;

        const where: any = user.role === 'INVESTOR' ? { userId: user.id } : {};
        if (status) where.status = status;

        const [withdrawals, total] = await Promise.all([
            prisma.withdrawal.findMany({
                where,
                include: {
                    users: { select: { name: true, email: true } },
                },
                orderBy: { requestedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.withdrawal.count({ where }),
        ]);

        reply.send({
            withdrawals,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    });

    // Create withdrawal (investor) - cu cooldown validation
    app.post('/wallet/withdrawals', {
        schema: {
            tags: ['Wallet'],
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(createWithdrawalSchema),
        },
        preHandler: [authenticate],
        config: {
            rateLimit: {
                max: 50,
                timeWindow: '1 minute',
            },
        },
    }, async (request, reply) => {
        const data = createWithdrawalSchema.parse(request.body);

        // Cooldown: 7 zile de la request
        const cooldownUntil = new Date();
        cooldownUntil.setDate(cooldownUntil.getDate() + 7);

        // Calculare fees cu surge engine
        const { calculateWithdrawalFees } = await import('../services/fees.service.js');
        const feeCalc = await calculateWithdrawalFees(new Decimal(data.amount));

        const withdrawal = await prisma.withdrawal.create({
            data: {
                userId: request.user!.id,
                amount: new Decimal(data.amount), // DEPRECATED - read only
                amountRequested: new Decimal(data.amount),
                feeFixedPct: feeCalc.feeFixedPct,
                feeSurgePct: feeCalc.feeSurgePct,
                feeFixedAmount: feeCalc.feeFixedAmount,
                feeSurgeAmount: feeCalc.feeSurgeAmount,
                feeTotalAmount: feeCalc.feeTotalAmount,
                amountPayout: feeCalc.amountPayout,
                surgeReasons: feeCalc.surgeReasons as any,
                surgeSnapshot: feeCalc.surgeSnapshot as any,
                feeLockedAt: new Date(),
                cooldownUntil,
                status: 'PENDING',
            },
        });

        reply.code(201).send({
            id: withdrawal.id,
            amount_requested: withdrawal.amountRequested.toFixed(2),
            fee_fixed_pct: withdrawal.feeFixedPct.toFixed(5),
            fee_surge_pct: withdrawal.feeSurgePct.toFixed(5),
            fee_fixed_amount: withdrawal.feeFixedAmount.toFixed(2),
            fee_surge_amount: withdrawal.feeSurgeAmount.toFixed(2),
            fee_total_amount: withdrawal.feeTotalAmount.toFixed(2),
            amount_payout: withdrawal.amountPayout.toFixed(2),
            surge_reasons: withdrawal.surgeReasons,
            surge_snapshot: withdrawal.surgeSnapshot,
            locked: true,
            cooldown_until: withdrawal.cooldownUntil,
            status: withdrawal.status,
            created_at: withdrawal.requestedAt,
        });
    });

    // Approve withdrawal (admin) - idempotent
    app.post('/wallet/withdrawals/approve', {
        schema: {
            tags: ['Wallet'],
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(approveWithdrawalSchema),
        },
        preHandler: [authenticate, requireAdmin],
        config: {
            rateLimit: {
                max: 50,
                timeWindow: '1 minute',
            },
        },
    }, async (request, reply) => {
        const { withdrawalId } = approveWithdrawalSchema.parse(request.body);

        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id: withdrawalId },
        });

        if (!withdrawal) {
            return reply.code(404).send({ error: 'Not Found', message: 'Withdrawal not found' });
        }

        // Idempotency: dacă deja aprobat, returnează success
        if (withdrawal.status === 'APPROVED' || withdrawal.status === 'PAID') {
            return reply.send({ message: 'Withdrawal deja aprobat', withdrawal });
        }

        if (withdrawal.status !== 'PENDING') {
            return reply.code(400).send({
                error: 'Bad Request',
                message: `Withdrawal status ${withdrawal.status} nu poate fi aprobat`,
            });
        }

        // Verificare cooldown
        if (new Date() < withdrawal.cooldownUntil) {
            return reply.code(400).send({
                error: 'Bad Request',
                message: `Cooldown activ până la ${withdrawal.cooldownUntil.toISOString()}`,
            });
        }

        // Burn units - strict amountRequested
        const burnResult = await unitsService.burnUnits(
            withdrawal.userId,
            withdrawal.amountRequested,
            request.user!.id,
            request.ip,
            request.headers['user-agent']
        );

        // Găsire conturi pentru ledger
        const bankAccount = await prisma.account.findFirst({
            where: { code: { contains: 'BANK' }, type: 'ASSET' },
        });

        let feeRevenueAccount = await prisma.account.findFirst({
            where: { code: 'WITHDRAWAL_FEES_EUR' },
        });

        if (!feeRevenueAccount) {
            // Create if not exists
            feeRevenueAccount = await prisma.account.create({
                data: {
                    code: 'WITHDRAWAL_FEES_EUR',
                    name: 'Withdrawal Fees Revenue',
                    type: 'REVENUE',
                },
            });
        }

        let userEquityAccount = await prisma.account.findFirst({
            where: { code: 'USER_EQUITY_EUR' },
        });

        if (!userEquityAccount) {
            // Create if not exists
            userEquityAccount = await prisma.account.create({
                data: {
                    code: 'USER_EQUITY_EUR',
                    name: 'User Equity',
                    type: 'EQUITY',
                },
            });
        }

        if (!bankAccount) {
            return reply.code(500).send({
                error: 'Internal Error',
                message: 'Bank account not found'
            });
        }

        // 4-line ledger entry - strict amountRequested și amountPayout
        const ledgerEntry = await ledgerService.createEntry({
            description: `Withdrawal approved: ${withdrawal.amountRequested.toFixed(2)} EUR (payout: ${withdrawal.amountPayout.toFixed(2)} EUR, fees: ${withdrawal.feeTotalAmount.toFixed(2)} EUR)`,
            referenceType: 'withdrawal_approval',
            referenceId: withdrawal.id,
            createdBy: request.user!.id,
            lines: [
                // Cash out (bank scade doar cu payout)
                {
                    debitAccountId: userEquityAccount.id,
                    creditAccountId: bankAccount.id,
                    amount: withdrawal.amountPayout,
                    userId: withdrawal.userId,
                    description: 'Withdrawal payout',
                },
                // Fee retention (user equity scade, fee revenue crește)
                {
                    debitAccountId: userEquityAccount.id,
                    creditAccountId: feeRevenueAccount.id,
                    amount: withdrawal.feeTotalAmount,
                    userId: withdrawal.userId,
                    description: 'Withdrawal fees',
                },
            ],
        });

        // Update withdrawal status
        const updated = await prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
                approvedBy: request.user!.id,
                unitsBurned: burnResult.units,
                navAtBurn: burnResult.nav,
                ledgerEntryId: ledgerEntry.id,
            },
        });

        // Audit log
        await auditService.log({
            userId: request.user!.id,
            action: 'WITHDRAWAL_APPROVED',
            resourceType: 'withdrawal',
            resourceId: updated.id,
            changes: {
                status: 'APPROVED',
                amount_payout: withdrawal.amountPayout.toFixed(2),
                fees: withdrawal.feeTotalAmount.toFixed(2)
            },
            metadata: {
                units_burned: burnResult.units.toFixed(6),
                nav_at_burn: burnResult.nav.toFixed(4),
            },
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
        });

        reply.send(updated);
    });

    // Reject withdrawal (admin) - idempotent
    app.post('/wallet/withdrawals/reject', {
        schema: {
            tags: ['Wallet'],
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(rejectWithdrawalSchema),
        },
        preHandler: [authenticate, requireAdmin],
        config: {
            rateLimit: {
                max: 50,
                timeWindow: '1 minute',
            },
        },
    }, async (request, reply) => {
        const { withdrawalId, reason } = rejectWithdrawalSchema.parse(request.body);

        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id: withdrawalId },
        });

        if (!withdrawal) {
            return reply.code(404).send({ error: 'Not Found', message: 'Withdrawal not found' });
        }

        // Idempotency: dacă deja respins, returnează success
        if (withdrawal.status === 'REJECTED') {
            return reply.send({ message: 'Withdrawal deja respins', withdrawal });
        }

        if (withdrawal.status !== 'PENDING') {
            return reply.code(400).send({
                error: 'Bad Request',
                message: `Withdrawal status ${withdrawal.status} nu poate fi respins`,
            });
        }

        const rejected = await prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: 'REJECTED',
                rejectedAt: new Date(),
                rejectedBy: request.user!.id,
                rejectionReason: reason,
            },
        });

        // Audit log
        await auditService.log({
            userId: request.user!.id,
            action: 'WITHDRAWAL_REJECTED',
            resourceType: 'withdrawal',
            resourceId: withdrawalId,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            metadata: { reason },
        });

        reply.send(rejected);
    });

    // Get current NAV (global platform metric)
    app.get('/wallet/nav/current', {
        schema: {
            tags: ['Wallet'],
            security: [{ bearerAuth: [] }],
            description: 'Get current NAV (Net Asset Value per unit)',
        },
        preHandler: [authenticate],
        config: {
            rateLimit: {
                max: 100,
                timeWindow: '1 minute',
            },
        },
    }, async (request, reply) => {
        // NAV = total investor equity / total units outstanding
        // units = SUM(deposits.unitsIssued) - SUM(withdrawals.unitsBurned) for ACTIVE investors

        const [depositsResult, withdrawalsResult, investorEquityAccount] = await Promise.all([
            prisma.deposit.aggregate({
                where: {
                    status: 'APPROVED',
                    users: { status: 'ACTIVE', role: 'INVESTOR' },
                },
                _sum: { unitsIssued: true },
            }),
            prisma.withdrawal.aggregate({
                where: {
                    status: { in: ['APPROVED', 'PAID'] },
                    users: { status: 'ACTIVE', role: 'INVESTOR' },
                },
                _sum: { unitsBurned: true },
            }),
            prisma.account.findFirst({ where: { code: '2000-INVESTOR-EQUITY' } }),
        ]);

        if (!investorEquityAccount) {
            return reply.code(500).send({ error: 'Investor equity account not found' });
        }

        const totalUnitsIssued = new Decimal(depositsResult._sum.unitsIssued?.toString() || '0');
        const totalUnitsBurned = new Decimal(withdrawalsResult._sum.unitsBurned?.toString() || '0');
        const totalUnits = totalUnitsIssued.sub(totalUnitsBurned);

        const equityBalance = await ledgerService.getAccountBalance(investorEquityAccount.id);

        // NAV fallback: când units  = 0, NAV inițial = 10.00 (conform units.service doctrine)
        const nav = totalUnits.eq(0)
            ? new Decimal(10)
            : equityBalance.balance.div(totalUnits);

        const totalInvestors = await prisma.user.count({
            where: { role: 'INVESTOR', status: 'ACTIVE' },
        });

        reply.send({
            nav: nav.toFixed(4),
            totalInvestors,
            totalUnits: totalUnits.toFixed(6),
            totalEquity: equityBalance.balance.toFixed(2),
            lastUpdated: new Date().toISOString(),
        });
    });
}
