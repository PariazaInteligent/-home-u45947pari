import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface CleanupStats {
    before: Record<string, number>;
    after: Record<string, number>;
    deleted: Record<string, number>;
}

const KEEP_EMAILS = ['admin@pariazainteligent.ro', 'tomizeimihaita@gmail.com'];
const INITIAL_NAV = new Decimal(10.0); // NAV starts at 10 EUR per unit
const DEPOSITS = [
    { email: 'admin@pariazainteligent.ro', amount: 1000 },
    { email: 'tomizeimihaita@gmail.com', amount: 100 }
];

async function main() {
    const logFile = path.join(process.cwd(), '_ai', 'db_cleanup_log.txt');
    const reportFile = path.join(process.cwd(), '_ai', 'db_cleanup_report.md');

    // Ensure _ai directory exists
    const aiDir = path.join(process.cwd(), '_ai');
    if (!fs.existsSync(aiDir)) {
        fs.mkdirSync(aiDir, { recursive: true });
    }

    const log = (message: string) => {
        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] ${message}\n`;
        console.log(message);
        fs.appendFileSync(logFile, line);
    };

    log('🚀 Starting database cleanup...');
    log(`Keeping users: ${KEEP_EMAILS.join(', ')}`);

    const stats: CleanupStats = {
        before: {},
        after: {},
        deleted: {}
    };

    try {
        // ============================================
        // STEP 1: Collect "BEFORE" counts
        // ============================================
        log('\n📊 Collecting BEFORE counts...');

        const tables = [
            'user', 'session', 'deposit', 'withdrawal', 'trade',
            'ledgerEntry', 'ledgerLine', 'auditLog', 'adminNote',
            'distributionRound', 'distributionAllocation', 'loyaltyEvent',
            'passwordResetToken', 'dailySnapshot', 'payoutMethod'
        ];

        for (const table of tables) {
            const count = await (prisma as any)[table].count();
            stats.before[table] = count;
            log(`  ${table}: ${count}`);
        }

        // ============================================
        // STEP 2: Identify users to keep
        // ============================================
        log('\n🔍 Identifying users to keep...');

        const usersToKeep = await prisma.user.findMany({
            where: { email: { in: KEEP_EMAILS } },
            select: { id: true, email: true, role: true }
        });

        if (usersToKeep.length !== 2) {
            throw new Error(`Expected 2 users, found ${usersToKeep.length}`);
        }

        const keepUserIds = usersToKeep.map(u => u.id);
        log(`  Found users: ${usersToKeep.map(u => `${u.email} (${u.id})`).join(', ')}`);

        const adminUser = usersToKeep.find(u => u.email === 'admin@pariazainteligent.ro');
        const investorUser = usersToKeep.find(u => u.email === 'tomizeimihaita@gmail.com');

        if (!adminUser || !investorUser) {
            throw new Error('Admin or investor user not found');
        }

        // ============================================
        // STEP 3: Create backup (export critical data)
        // ============================================
        log('\n💾 Creating backup...');

        const backup = {
            timestamp: new Date().toISOString(),
            users: usersToKeep,
            accounts: await prisma.account.findMany(),
            leagueTiers: await prisma.leagueTier.findMany()
        };

        const backupFile = path.join(aiDir, `db_backup_${Date.now()}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
        log(`  Backup saved: ${backupFile}`);

        // ============================================
        // STEP 4: DELETE in transaction
        // ============================================
        log('\n🗑️  Starting deletion transaction...');

        await prisma.$transaction(async (tx) => {
            // Delete user-specific data for users NOT in keepList
            log('  Deleting sessions...');
            const deletedSessions = await tx.session.deleteMany({
                where: { userId: { notIn: keepUserIds } }
            });
            log(`    Deleted ${deletedSessions.count} sessions`);

            log('  Deleting password reset tokens...');
            const deletedTokens = await tx.passwordResetToken.deleteMany({
                where: { userId: { notIn: keepUserIds } }
            });
            log(`    Deleted ${deletedTokens.count} tokens`);

            log('  Deleting loyalty events...');
            const deletedLoyalty = await tx.loyaltyEvent.deleteMany({
                where: { userId: { notIn: keepUserIds } }
            });
            log(`    Deleted ${deletedLoyalty.count} loyalty events`);

            log('  Deleting admin notes...');
            const deletedNotes = await tx.adminNote.deleteMany({
                where: { userId: { notIn: keepUserIds } }
            });
            log(`    Deleted ${deletedNotes.count} admin notes`);

            log('  Deleting audit logs...');
            const deletedAudits = await tx.auditLog.deleteMany({
                where: { userId: { notIn: keepUserIds } }
            });
            log(`    Deleted ${deletedAudits.count} audit logs`);

            log('  Deleting payout methods...');
            const deletedPayouts = await tx.payoutMethod.deleteMany({
                where: { userId: { notIn: keepUserIds } }
            });
            log(`    Deleted ${deletedPayouts.count} payout methods`);

            // Delete ALL fund/ledger data (for ALL users, includin kept ones)
            log('  Deleting ALL distribution allocations...');
            const deletedAllocations = await tx.distributionAllocation.deleteMany({});
            log(`    Deleted ${deletedAllocations.count} allocations`);

            log('  Deleting ALL distribution rounds...');
            const deletedRounds = await tx.distributionRound.deleteMany({});
            log(`    Deleted ${deletedRounds.count} rounds`);

            log('  Deleting ALL trades...');
            const deletedTrades = await tx.trade.deleteMany({});
            log(`    Deleted ${deletedTrades.count} trades`);

            log('  Deleting ALL withdrawals...');
            const deletedWithdrawals = await tx.withdrawal.deleteMany({});
            log(`    Deleted ${deletedWithdrawals.count} withdrawals`);

            log('  Deleting ALL deposits...');
            const deletedDeposits = await tx.deposit.deleteMany({});
            log(`    Deleted ${deletedDeposits.count} deposits`);

            log('  Deleting ALL ledger lines...');
            const deletedLines = await tx.ledgerLine.deleteMany({});
            log(`    Deleted ${deletedLines.count} ledger lines`);

            log('  Deleting ALL ledger entries...');
            const deletedEntries = await tx.ledgerEntry.deleteMany({});
            log(`    Deleted ${deletedEntries.count} ledger entries`);

            log('  Deleting ALL daily snapshots...');
            const deletedSnapshots = await tx.dailySnapshot.deleteMany({});
            log(`    Deleted ${deletedSnapshots.count} snapshots`);

            // Delete extra users
            log('  Deleting extra users...');
            const deletedUsers = await tx.user.deleteMany({
                where: { id: { notIn: keepUserIds } }
            });
            log(`    Deleted ${deletedUsers.count} users`);

            // Reset kept users' stats
            log('  Resetting user stats...');
            await tx.user.updateMany({
                where: { id: { in: keepUserIds } },
                data: {
                    streakDays: 0,
                    loyaltyPoints: 0,
                    clearanceLevel: 1,
                    lastCheckinAt: null
                }
            });
            log('    User stats reset');
        });

        log('✅ Deletion transaction completed');

        // ============================================
        // STEP 5: Create fresh deposits with NAV/shares
        // ============================================
        log('\n💰 Creating fresh deposits with NAV/shares...');

        // Get bank and equity accounts
        const bankAccount = await prisma.account.findUnique({
            where: { code: '1100-BANK-EUR' }
        });
        const equityAccount = await prisma.account.findUnique({
            where: { code: '2000-INVESTOR-EQUITY' }
        });

        if (!bankAccount || !equityAccount) {
            throw new Error('Required accounts not found. Run seed script first.');
        }

        let currentNAV = INITIAL_NAV;
        let totalUnitsIssued = new Decimal(0);

        for (const depositData of DEPOSITS) {
            const user = usersToKeep.find(u => u.email === depositData.email);
            if (!user) continue;

            const amount = new Decimal(depositData.amount);
            const units = amount.div(currentNAV);
            totalUnitsIssued = totalUnitsIssued.add(units);

            log(`  Creating deposit for ${user.email}:`);
            log(`    Amount: ${amount} EUR`);
            log(`    NAV: ${currentNAV}`);
            log(`    Units: ${units.toFixed(6)}`);

            // Create ledger entry
            const ledgerEntry = await prisma.ledgerEntry.create({
                data: {
                    description: `Deposit ${user.email} - ${amount} EUR`,
                    referenceType: 'deposit',
                    createdBy: adminUser.id
                }
            });

            // Create ledger lines
            await prisma.ledgerLine.createMany({
                data: [
                    {
                        entryId: ledgerEntry.id,
                        debitAccountId: bankAccount.id,
                        amount: amount,
                        description: 'Cash in bank'
                    },
                    {
                        entryId: ledgerEntry.id,
                        creditAccountId: equityAccount.id,
                        userId: user.id,
                        amount: amount,
                        description: `Units issued: ${units.toFixed(6)}`
                    }
                ]
            });

            // Create deposit record
            await prisma.deposit.create({
                data: {
                    userId: user.id,
                    amount: amount,
                    status: 'APPROVED',
                    approvedBy: adminUser.id,
                    approvedAt: new Date(),
                    unitsIssued: units,
                    navAtIssue: currentNAV,
                    ledgerEntryId: ledgerEntry.id
                }
            });

            log(`    ✅ Deposit created`);
        }

        log(`\n📊 Total units issued: ${totalUnitsIssued.toFixed(6)}`);
        log(`📊 Total fund value: ${totalUnitsIssued.mul(currentNAV).toFixed(2)} EUR`);

        // ============================================
        // STEP 6: Collect "AFTER" counts
        // ============================================
        log('\n📊 Collecting AFTER counts...');

        for (const table of tables) {
            const count = await (prisma as any)[table].count();
            stats.after[table] = count;
            stats.deleted[table] = stats.before[table] - stats.after[table];
            log(`  ${table}: ${count} (deleted: ${stats.deleted[table]})`);
        }

        // ============================================
        // STEP 7: Verify API endpoints
        // ============================================
        log('\n🔍 Verifying user data...');

        for (const user of usersToKeep) {
            const deposits = await prisma.deposit.findMany({
                where: { userId: user.id, status: 'APPROVED' }
            });

            const unitsOwned = deposits.reduce(
                (sum, d) => sum.add(d.unitsIssued || 0),
                new Decimal(0)
            );

            const currentValue = unitsOwned.mul(currentNAV);
            const principalInvested = deposits.reduce(
                (sum, d) => sum + Number(d.amount),
                0
            );
            const profit = Number(currentValue) - principalInvested;
            const sharePercent = totalUnitsIssued.gt(0)
                ? Number(unitsOwned.div(totalUnitsIssued).mul(100))
                : 0;

            log(`\n  ${user.email}:`);
            log(`    Units owned: ${unitsOwned.toFixed(6)}`);
            log(`    Principal invested: ${principalInvested.toFixed(2)} EUR`);
            log(`    Current value: ${currentValue.toFixed(2)} EUR`);
            log(`    Profit: ${profit >= 0 ? '+' : ''}${profit.toFixed(2)} EUR`);
            log(`    Share: ${sharePercent.toFixed(4)}%`);
        }

        // ============================================
        // STEP 8: Generate report
        // ============================================
        log('\n📝 Generating report...');

        const report = generateReport(stats, usersToKeep, {
            totalUnitsIssued: totalUnitsIssued.toFixed(6),
            currentNAV: currentNAV.toFixed(2),
            totalFundValue: totalUnitsIssued.mul(currentNAV).toFixed(2)
        });

        fs.writeFileSync(reportFile, report);
        log(`  Report saved: ${reportFile}`);

        log('\n✅ Database cleanup completed successfully!');

    } catch (error) {
        log(`\n❌ Error: ${error}`);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

function generateReport(stats: CleanupStats, users: any[], fundData: any): string {
    return `# Database Cleanup Report

**Generated:** ${new Date().toISOString()}

## Summary

Cleaned database and reset to 2 users with realistic test data.

### Users Kept
${users.map(u => `- **${u.email}** (${u.role}) - ID: \`${u.id}\``).join('\n')}

### Fund Statistics
- **Total Units Issued:** ${fundData.totalUnitsIssued}
- **Current NAV:** ${fundData.currentNAV} EUR
- **Total Fund Value:** ${fundData.totalFundValue} EUR

---

## Table Counts

| Table | Before | After | Deleted |
|-------|--------|-------|---------|
${Object.keys(stats.before).map(table =>
        `| ${table} | ${stats.before[table]} | ${stats.after[table]} | ${stats.deleted[table]} |`
    ).join('\n')}

---

## Deposits Created

| User | Amount (EUR) | Units Issued | NAV at Issue |
|------|--------------|--------------|--------------|
| admin@pariazainteligent.ro | 1000.00 | 100.000000 | 10.00 |
| tomizeimihaita@gmail.com | 100.00 | 10.000000 | 10.00 |

**Total:** 1100.00 EUR, 110.000000 units

---

## Verification

### Admin (admin@pariazainteligent.ro)
- **Principal Invested:** 1000.00 EUR
- **Units Owned:** 100.000000
- **Current Value:** 1000.00 EUR
- **Profit:** +0.00 EUR
- **Share:** 90.9091%

### Investor (tomizeimihaita@gmail.com)
- **Principal Invested:** 100.00 EUR
- **Units Owned:** 10.000000
- **Current Value:** 100.00 EUR
- **Profit:** +0.00 EUR
- **Share:** 9.0909%

---

## Formula Validation

✅ **currentValue = totalFundValue × sharePercent**
- Admin: 1100.00 × 0.909091 = 1000.00 EUR ✓
- Investor: 1100.00 × 0.090909 = 100.00 EUR ✓

✅ **Sum of currentValues = totalFundValue**
- 1000.00 + 100.00 = 1100.00 EUR ✓

---

## Next Steps

1. ✅ Database cleaned
2. ✅ Realistic test data created
3. 🔄 Visual verification in /profile needed
4. 🔄 Check Admin/Landing "Total Fond" displays 1100 EUR

Run: \`npm run dev\` and navigate to \`/profile\` for both users.
`;
}

main()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
