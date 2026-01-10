#!/usr/bin/env node

/**
 * Seed Admin Investor Data (DEV ONLY)
 * 
 * Creates realistic deposit/withdrawal data for admin@pariazainteligent.ro
 * to test profile with non-zero investment values.
 * 
 * Run: SEED_DEV=1 node apps/api/scripts/seed_admin_investor.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdminInvestor() {
    console.log('🌱 [SEED] Starting admin investor seed...');

    try {
        // 1. Find admin user
        const admin = await prisma.user.findUnique({
            where: { email: 'admin@pariazainteligent.ro' }
        });

        if (!admin) {
            console.log('❌ [SEED] Admin user not found. Skipping seed.');
            return;
        }

        console.log(`✅ [SEED] Found admin user: ${admin.email} (ID: ${admin.id})`);

        // 2. Check if already seeded (idempotent)
        const existingDeposits = await prisma.deposit.count({
            where: { userId: admin.id, status: 'APPROVED' }
        });

        if (existingDeposits > 0) {
            console.log(`✅ [SEED] Admin already has ${existingDeposits} APPROVED deposits. Skipping seed.`);
            return;
        }

        // 3. Create APPROVED deposit (10,000 RON)
        const deposit = await prisma.deposit.create({
            data: {
                userId: admin.id,
                amount: 10000.00,
                status: 'APPROVED',
                approvedAt: new Date(),
                approvedBy: 'SYSTEM_SEED',
                unitsIssued: 1000.00, // Example: 10 RON/unit
                navAtIssue: 10.00
            }
        });

        console.log(`✅ [SEED] Created deposit: ${deposit.amount} EUR (ID: ${deposit.id})`);

        // 4. Create APPROVED withdrawal (1,000 EUR) - optional, demonstrates withdrawal
        const withdrawal = await prisma.withdrawal.create({
            data: {
                userId: admin.id,
                amount: 1000.00,
                amountRequested: 1000.00,
                amountPayout: 985.00, // After 1.5% fee
                feeFixedPct: 0.01500,
                feeFixedAmount: 15.00,
                feeTotalAmount: 15.00,
                requestedAt: new Date(),
                cooldownUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
                status: 'APPROVED',
                approvedAt: new Date(),
                approvedBy: 'SYSTEM_SEED',
                unitsBurned: 100.00,
                navAtBurn: 10.00
            }
        });

        console.log(`✅ [SEED] Created withdrawal: ${withdrawal.amountPayout} EUR payout (ID: ${withdrawal.id})`);

        // 5. Verify investment value
        const deposits = await prisma.deposit.aggregate({
            where: { userId: admin.id, status: 'APPROVED' },
            _sum: { amount: true }
        });

        const withdrawals = await prisma.withdrawal.aggregate({
            where: { userId: admin.id, status: 'APPROVED' },
            _sum: { amountPayout: true }
        });

        const investmentValue = Number(deposits._sum?.amount ?? 0) - Number(withdrawals._sum?.amountPayout ?? 0);

        console.log('');
        console.log('📊 [SEED] Investment Summary:');
        console.log(`   Deposits:     ${deposits._sum?.amount ?? 0} EUR`);
        console.log(`   Withdrawals:  ${withdrawals._sum?.amountPayout ?? 0} EUR`);
        console.log(`   Investment:   ${investmentValue} EUR`);
        console.log('');
        console.log('✅ [SEED] Admin investor data seeded successfully!');

    } catch (error) {
        console.error('❌ [SEED] Error seeding admin investor data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run seed
seedAdminInvestor()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
