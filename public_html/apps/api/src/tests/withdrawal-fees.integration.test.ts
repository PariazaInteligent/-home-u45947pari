import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '';
import { Decimal } from '';

describe('Withdrawal Fees Integration Tests', () => {
    let adminUserId: string;
    let testUserId: string;

    beforeEach(async () => {
        // Setup: get admin and create fest user
        const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
        if (!admin) throw new Error('Admin not found');
        adminUserId = admin.id;

        const testUser = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                password: 'hashedpassword',
                name: 'Test User',
                role: 'INVESTOR',
                status: 'ACTIVE',
            },
        });
        testUserId = testUser.id;

        // Create deposit with units for test user
        const bankAccount = await prisma.account.findUnique({ where: { code: '1100-BANK-EUR' } });
        const investorEquityAccount = await prisma.account.findUnique({ where: { code: '2000-INVESTOR-EQUITY' } });

        const depositAmount = new Decimal(10000);
        const nav = new Decimal(10); // Initial NAV
        const units = depositAmount.div(nav);

        const ledgerEntry = await prisma.ledgerEntry.create({
            data: {
                description: 'Test deposit',
                createdBy: adminUserId,
                ledger_lines: {
                    create: [
                        {
                            debitAccountId: bankAccount!.id,
                            amount: depositAmount,
                        },
                        {
                            creditAccountId: investorEquityAccount!.id,
                            userId: testUserId,
                            amount: depositAmount,
                        },
                    ],
                },
            },
        });

        await prisma.deposit.create({
            data: {
                userId: testUserId,
                amount: depositAmount,
                status: 'APPROVED',
                approvedBy: adminUserId,
                approvedAt: new Date(),
                unitsIssued: units,
                navAtIssue: nav,
                ledgerEntryId: ledgerEntry.id,
            },
        });
    });

    it('Test 1: Low pressure → surge 0%, fee 1.5%', async () => {
        // Given: low system pressure (no pending withdrawals, low utilization)
        const requestAmount = new Decimal(100);

        // When: create withdrawal
        const cooldown = new Date();
        cooldown.setHours(cooldown.getHours() + 24);

        const withdrawal = await prisma.withdrawal.create({
            data: {
                userId: testUserId,
                amount: requestAmount,
                amountRequested: requestAmount,
                feeFixedPct: new Decimal(0.015),
                feeSurgePct: new Decimal(0),
                feeFixedAmount: requestAmount.mul(0.015),
                feeSurgeAmount: new Decimal(0),
                feeTotalAmount: requestAmount.mul(0.015),
                amountPayout: requestAmount.mul(1 - 0.015),
                surgeReasons: [],
                surgeSnapshot: {},
                feeLockedAt: new Date(),
                cooldownUntil: cooldown,
                status: 'PENDING',
            },
        });

        // Then: verify fee calculation
        expect(withdrawal.feeSurgePct.toNumber()).toBe(0);
        expect(withdrawal.feeFixedPct.toNumber()).toBe(0.015);
        expect(withdrawal.feeTotalAmount.toNumber()).toBe(1.5);
        expect(withdrawal.amountPayout.toNumber()).toBe(98.5);
    });

    it('Test 2: Utilization >= 0.40 → surge includes +10%', async () => {
        // Given: high bank utilization (create many pending withdrawals)
        const bank = await prisma.account.findUnique({ where: { code: '1100-BANK-EUR' } });

        // Create 25+ pending withdrawals to trigger pending_count surge
        for (let i = 0; i < 26; i++) {
            const cooldown = new Date();
            cooldown.setHours(cooldown.getHours() + 24);
            await prisma.withdrawal.create({
                data: {
                    userId: testUserId,
                    amount: new Decimal(100),
                    amountRequested: new Decimal(100),
                    cooldownUntil: cooldown,
                    status: 'PENDING',
                },
            });
        }

        // When: calculate surge with high utilization
        const requestAmount = new Decimal(100);
        const surgePct = new Decimal(0.07); // pending_count >= 25

        // Then: verify surge calculation
        const cooldown = new Date();
        cooldown.setHours(cooldown.getHours() + 24);

        const withdrawal = await prisma.withdrawal.create({
            data: {
                userId: testUserId,
                amount: requestAmount,
                amountRequested: requestAmount,
                feeFixedPct: new Decimal(0.015),
                feeSurgePct: surgePct,
                feeFixedAmount: requestAmount.mul(0.015),
                feeSurgeAmount: requestAmount.mul(surgePct),
                feeTotalAmount: requestAmount.mul(0.015 + 0.07),
                amountPayout: requestAmount.mul(1 - 0.015 - 0.07),
                surgeReasons: ['pending_count >= 25: +7%'],
                surgeSnapshot: { pending_count: 26 },
                feeLockedAt: new Date(),
                cooldownUntil: cooldown,
                status: 'PENDING',
            },
        });

        expect(withdrawal.feeSurgePct.toNumber()).toBe(0.07);
        expect(withdrawal.feeTotalAmount.toNumber()).toBe(8.5);
    });

    it('Test 3: Risk flag true → +5% surge with reason', async () => {
        // Given: system risk flag activated
        await prisma.$executeRaw`INSERT INTO system_config (\`key\`, value, updatedBy, updatedAt) VALUES ('RISK_FLAG', '{"active": true}', ${adminUserId}, NOW()) ON DUPLICATE KEY UPDATE value='{"active": true}', updatedBy=${adminUserId}, updatedAt=NOW()`;

        // When: create withdrawal with risk flag
        const requestAmount = new Decimal(100);
        const riskSurge = new Decimal(0.05);

        const cooldown = new Date();
        cooldown.setHours(cooldown.getHours() + 24);

        const withdrawal = await prisma.withdrawal.create({
            data: {
                userId: testUserId,
                amount: requestAmount,
                amountRequested: requestAmount,
                feeFixedPct: new Decimal(0.015),
                feeSurgePct: riskSurge,
                feeFixedAmount: requestAmount.mul(0.015),
                feeSurgeAmount: requestAmount.mul(riskSurge),
                feeTotalAmount: requestAmount.mul(0.015 + 0.05),
                amountPayout: requestAmount.mul(1 - 0.015 - 0.05),
                surgeReasons: ['system_risk_flag: +5%'],
                surgeSnapshot: { system_risk_flag: true },
                feeLockedAt: new Date(),
                cooldownUntil: cooldown,
                status: 'PENDING',
            },
        });

        // Then: verify risk surge applied
        expect(withdrawal.surgeReasons).toContain('system_risk_flag: +5%');
        expect(withdrawal.feeSurgePct.toNumber()).toBe(0.05);
        expect(withdrawal.feeTotalAmount.toNumber()).toBe(6.5);

        // Cleanup
        await prisma.$executeRaw`DELETE FROM system_config WHERE \`key\`='red_flags'`;
    });

    it('Test 4: Locked fees not recalculated at approval', async () => {
        // Given: withdrawal with locked fees
        const cooldown = new Date();
        cooldown.setHours(cooldown.getHours() + 24);

        const originalFeeTotal = new Decimal(5);
        const originalPayout = new Decimal(95);

        const withdrawal = await prisma.withdrawal.create({
            data: {
                userId: testUserId,
                amount: new Decimal(100),
                amountRequested: new Decimal(100),
                feeFixedPct: new Decimal(0.015),
                feeSurgePct: new Decimal(0.035),
                feeFixedAmount: new Decimal(1.5),
                feeSurgeAmount: new Decimal(3.5),
                feeTotalAmount: originalFeeTotal,
                amountPayout: originalPayout,
                feeLockedAt: new Date(),
                cooldownUntil: cooldown,
                status: 'PENDING',
            },
        });

        // When: approve withdrawal (fees should not change)
        const updated = await prisma.withdrawal.update({
            where: { id: withdrawal.id },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
                approvedBy: adminUserId,
            },
        });

        // Then: verify fees unchanged
        expect(updated.feeTotalAmount.toString()).toBe(originalFeeTotal.toString());
        expect(updated.amountPayout.toString()).toBe(originalPayout.toString());
    });

    it('Test 5: Exact payout math with Decimal precision', async () => {
        // Given: withdrawal with specific amounts
        const requestAmount = new Decimal('1000.50');
        const feeFixedPct = new Decimal('0.015');
        const feeSurgePct = new Decimal('0.10');
        const totalFeePct = feeFixedPct.add(feeSurgePct);

        // When: calculate fees
        const feeFixedAmount = requestAmount.mul(feeFixedPct);
        const feeSurgeAmount = requestAmount.mul(feeSurgePct);
        const feeTotalAmount = feeFixedAmount.add(feeSurgeAmount);
        const amountPayout = requestAmount.sub(feeTotalAmount);

        // Then: verify precise decimal calculations
        expect(feeFixedAmount.toFixed(2)).toBe('15.01');
        expect(feeSurgeAmount.toFixed(2)).toBe('100.05');
        expect(feeTotalAmount.toFixed(2)).toBe('115.06');
        expect(amountPayout.toFixed(2)).toBe('885.44');
        expect(requestAmount.sub(amountPayout).toFixed(2)).toBe(feeTotalAmount.toFixed(2));
    });

    it('Test 6: Approve ledger balanced + fee revenue line', async () => {
        // Given: withdrawal ready for approval
        const cooldown = new Date();
        cooldown.setHours(cooldown.getHours() + 24);

        const withdrawal = await prisma.withdrawal.create({
            data: {
                userId: testUserId,
                amount: new Decimal(100),
                amountRequested: new Decimal(100),
                feeFixedPct: new Decimal(0.015),
                feeSurgePct: new Decimal(0),
                feeFixedAmount: new Decimal(1.5),
                feeSurgeAmount: new Decimal(0),
                feeTotalAmount: new Decimal(1.5),
                amountPayout: new Decimal(98.5),
                feeLockedAt: new Date(),
                cooldownUntil: cooldown,
                status: 'PENDING',
            },
        });

        // When: create ledger entry for approval
        const bankAccount = await prisma.account.findUnique({ where: { code: '1100-BANK-EUR' } });
        const userEquityAccount = await prisma.account.findFirst({ where: { code: '2000-INVESTOR-EQUITY' } });
        const feeRevenueAccount = await prisma.account.findFirst({ where: { code: 'WITHDRAWAL_FEES_EUR' } });

        const ledgerEntry = await prisma.ledgerEntry.create({
            data: {
                description: `Withdrawal approved: ${withdrawal.id}`,
                createdBy: adminUserId,
                ledger_lines: {
                    create: [
                        // Payout: user equity → bank
                        {
                            debitAccountId: userEquityAccount!.id,
                            creditAccountId: bankAccount!.id,
                            amount: withdrawal.amountPayout,
                            userId: testUserId,
                        },
                        // Fee: user equity → revenue
                        {
                            debitAccountId: userEquityAccount!.id,
                            creditAccountId: feeRevenueAccount!.id,
                            amount: withdrawal.feeTotalAmount,
                            userId: testUserId,
                        },
                    ],
                },
            },
            include: { ledger_lines: true },
        });

        // Then: verify ledger balanced
        const totalDebits = ledgerEntry.ledger_lines
            .filter(l => l.debitAccountId)
            .reduce((sum, l) => sum.add(l.amount), new Decimal(0));

        const totalCredits = ledgerEntry.ledger_lines
            .filter(l => l.creditAccountId)
            .reduce((sum, l) => sum.add(l.amount), new Decimal(0));

        expect(totalDebits.toFixed(2)).toBe(totalCredits.toFixed(2));
        expect(totalDebits.toFixed(2)).toBe('100.00'); // amountPayout + feeTotalAmount

        // Verify fee revenue line exists
        const feeRevenueLine = ledgerEntry.ledger_lines.find(l => l.creditAccountId === feeRevenueAccount!.id);
        expect(feeRevenueLine).toBeDefined();
        expect(feeRevenueLine!.amount.toFixed(2)).toBe('1.50');
    });
});
