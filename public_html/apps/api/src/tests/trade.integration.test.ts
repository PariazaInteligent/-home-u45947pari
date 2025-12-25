import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '';
import { tradeService } from '';
import { ledgerService } from '';
import { Decimal } from '';

describe('Trade Lifecycle Integration Tests', () => {
    let adminUserId: string;
    let investorUserId: string;
    let bankAccountId: string;
    let investorEquityAccountId: string;
    let tradingPnlAccountId: string;

    beforeAll(async () => {
        // Setup: create admin user and accounts
        const admin = await prisma.user.upsert({
            where: { email: 'test-admin@test.com' },
            update: {},
            create: {
                email: 'test-admin@test.com',
                password: 'hashedpassword',
                name: 'Test Admin',
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
            },
        });
        adminUserId = admin.id;

        const investor = await prisma.user.upsert({
            where: { email: 'test-investor@test.com' },
            update: {},
            create: {
                email: 'test-investor@test.com',
                password: 'hashedpassword',
                name: 'Test Investor',
                role: 'INVESTOR',
                status: 'ACTIVE',
            },
        });
        investorUserId = investor.id;

        // Get accounts
        const bankAccount = await prisma.account.findUnique({ where: { code: '1100-BANK-EUR' } });
        const investorEquityAccount = await prisma.account.findUnique({ where: { code: '2000-INVESTOR-EQUITY' } });
        const tradingPnlAccount = await prisma.account.findUnique({ where: { code: '4000-TRADING-PNL' } });

        if (!bankAccount || !investorEquityAccount || !tradingPnlAccount) {
            throw new Error('Required accounts not found');
        }

        bankAccountId = bankAccount.id;
        investorEquityAccountId = investorEquityAccount.id;
        tradingPnlAccountId = tradingPnlAccount.id;

        // Bootstrap bank with approved deposit to ensure bank balance > 0
        const depositAmount = new Decimal(10000);
        const nav = new Decimal(1);
        const units = depositAmount.div(nav);

        const deposit = await prisma.deposit.create({
            data: {
                userId: investorUserId,
                amount: depositAmount,
                status: 'APPROVED',
                approvedBy: adminUserId,
                approvedAt: new Date(),
                unitsIssued: units,
                navAtIssue: nav,
            },
        });

        // Create ledger entry for deposit
        await prisma.ledgerEntry.create({
            data: {
                description: 'Test bank funding deposit',
                referenceType: 'deposit',
                referenceId: deposit.id,
                createdBy: adminUserId,
                ledger_lines: {
                    create: [
                        {
                            debitAccountId: bankAccountId,
                            amount: depositAmount,
                        },
                        {
                            creditAccountId: investorEquityAccountId,
                            userId: investorUserId,
                            amount: depositAmount,
                        },
                    ],
                },
            },
        });
    });

    beforeEach(async () => {
        // Clean up trades and ledger entries before each test
        await prisma.settlementEvent.deleteMany({});
        await prisma.trade.deleteMany({});
        await prisma.ledgerLine.deleteMany({});
        await prisma.ledgerEntry.deleteMany({});
        await prisma.auditLog.deleteMany({});
    });

    afterAll(async () => {
        // Cleanup
        await prisma.settlementEvent.deleteMany({});
        await prisma.trade.deleteMany({});
        await prisma.user.deleteMany({ where: { email: 'test-admin@test.com' } });
        await prisma.$disconnect();
    });

    it('should create trade → settle WIN → verify ledger balance + audit exists', async () => {
        // Create trade
        const trade = await tradeService.createTrade({
            sport: 'Football',
            event: 'Test Match',
            market: '1X2',
            selection: 'Home',
            odds: new Decimal(2.5),
            stake: new Decimal(100),
            createdBy: adminUserId,
            ipAddress: '127.0.0.1',
            userAgent: 'test',
        });

        expect(trade.status).toBe('PENDING');
        expect(trade.potentialWin).toEqual(new Decimal(150)); // 100 * (2.5 - 1)

        // Settle WIN
        const result = await tradeService.settleTrade(
            trade.id,
            'win',
            'provider-123',
            new Decimal(2.5),
            adminUserId,
            '127.0.0.1',
            'test'
        );

        expect(result.trade.status).toBe('SETTLED_WIN');
        expect(result.trade.resultAmount).toEqual(new Decimal(150));
        expect(result.ledgerEntry).not.toBeNull();

        // Verify ledger balance
        const bankBalance = await ledgerService.getAccountBalance(bankAccountId);
        expect(bankBalance.balance).toEqual(new Decimal(150)); // +150 profit

        const pnlBalance = await ledgerService.getAccountBalance(tradingPnlAccountId);
        expect(pnlBalance.balance).toEqual(new Decimal(150)); // +150 revenue

        // Verify audit log exists
        const auditLogs = await prisma.auditLog.findMany({
            where: {
                resourceType: 'trade',
                resourceId: trade.id,
                action: 'TRADE_SETTLED',
            },
        });
        expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should create → update → settle LOSS → verify ledger balance + audit diff', async () => {
        // Create trade
        const trade = await tradeService.createTrade({
            sport: 'Tennis',
            event: 'Test Tournament',
            market: 'Match Winner',
            selection: 'Player A',
            odds: new Decimal(3.0),
            stake: new Decimal(200),
            createdBy: adminUserId,
        });

        expect(trade.potentialWin).toEqual(new Decimal(400)); // 200 * (3.0 - 1)

        // Update trade (pre-settlement)
        const updated = await tradeService.updateTrade(
            trade.id,
            {
                odds: new Decimal(2.5),
                stake: new Decimal(150),
            },
            adminUserId
        );

        expect(updated.potentialWin).toEqual(new Decimal(225)); // 150 * (2.5 - 1)

        // Settle LOSS
        const result = await tradeService.settleTrade(
            updated.id,
            'loss',
            'provider-456',
            new Decimal(2.5),
            adminUserId
        );

        expect(result.trade.status).toBe('SETTLED_LOSS');
        expect(result.trade.resultAmount).toEqual(new Decimal(-150)); // lost stake

        // Verify ledger balance
        const bankBalance = await ledgerService.getAccountBalance(bankAccountId);
        expect(bankBalance.balance).toEqual(new Decimal(-150)); // -150 (loss)

        const pnlBalance = await ledgerService.getAccountBalance(tradingPnlAccountId);
        expect(pnlBalance.balance).toEqual(new Decimal(-150)); // -150 (expense)

        // Verify audit logs (create + update + settle)
        const auditLogs = await prisma.auditLog.findMany({
            where: {
                resourceType: 'trade',
                resourceId: trade.id,
            },
            orderBy: { createdAt: 'asc' },
        });

        expect(auditLogs.length).toBeGreaterThanOrEqual(3);
        expect(auditLogs.some((log: any) => log.action === 'TRADE_CREATED')).toBe(true);
        expect(auditLogs.some((log: any) => log.action === 'TRADE_UPDATED')).toBe(true);
        expect(auditLogs.some((log: any) => log.action === 'TRADE_SETTLED')).toBe(true);
    });

    it('should reject double-settle (idempotency protection)', async () => {
        // Create trade
        const trade = await tradeService.createTrade({
            sport: 'Football',
            event: 'Idempotency Test',
            market: '1X2',
            selection: 'Draw',
            odds: new Decimal(3.0),
            stake: new Decimal(100),
            createdBy: adminUserId,
        });

        // First settlement
        await tradeService.settleTrade(
            trade.id,
            'win',
            'provider-789',
            new Decimal(3.0),
            adminUserId
        );

        // Second settlement attempt (should fail)
        await expect(
            tradeService.settleTrade(
                trade.id,
                'win',
                'provider-789-duplicate',
                new Decimal(3.0),
                adminUserId
            )
        ).rejects.toThrow('Trade already settled');

        // Verify only one ledger entry exists
        const ledgerEntries = await prisma.ledgerEntry.findMany({
            where: {
                referenceType: 'trade_settlement',
                referenceId: trade.id,
            },
        });

        expect(ledgerEntries.length).toBe(1);
    });

    it('should reject update after settlement', async () => {
        // Create and settle trade
        const trade = await tradeService.createTrade({
            sport: 'Basketball',
            event: 'Post-Settlement Update Test',
            market: 'Totals',
            selection: 'Over 200.5',
            odds: new Decimal(1.9),
            stake: new Decimal(100),
            createdBy: adminUserId,
        });

        await tradeService.settleTrade(
            trade.id,
            'loss',
            'provider-update-test',
            new Decimal(1.9),
            adminUserId
        );

        // Try to update (should fail)
        await expect(
            tradeService.updateTrade(
                trade.id,
                { stake: new Decimal(200) },
                adminUserId
            )
        ).rejects.toThrow('Cannot update settled trade');
    });

    it('should handle VOID settlement with zero ledger impact', async () => {
        // Create trade
        const trade = await tradeService.createTrade({
            sport: 'Football',
            event: 'Void Test Match',
            market: '1X2',
            selection: 'Home',
            odds: new Decimal(2.0),
            stake: new Decimal(100),
            createdBy: adminUserId,
        });

        // Settle VOID
        const result = await tradeService.settleTrade(
            trade.id,
            'void',
            'provider-void',
            new Decimal(2.0),
            adminUserId
        );

        expect(result.trade.status).toBe('SETTLED_VOID');
        expect(result.trade.resultAmount).toEqual(new Decimal(0));
        expect(result.ledgerEntry).toBeNull(); // No ledger entry for void

        // Verify zero ledger impact
        const bankBalance = await ledgerService.getAccountBalance(bankAccountId);
        const pnlBalance = await ledgerService.getAccountBalance(tradingPnlAccountId);

        expect(bankBalance.balance).toEqual(new Decimal(0));
        expect(pnlBalance.balance).toEqual(new Decimal(0));
    });
});
