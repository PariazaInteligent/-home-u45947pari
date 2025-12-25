import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
    console.log('\n=============================================');
    console.log('   DATABASE METRICS VERIFICATION SOURCE OF TRUTH');
    console.log('=============================================\n');

    // 1. NAV & Equity Logic
    console.log('--- 1. EQUITY & NAV (Global Investor) ---');
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

    let nav = new Decimal(10);
    let equity = new Decimal(0);
    let totalUnits = new Decimal(0);

    if (investorEquityAccount) {
        const totalUnitsIssued = new Decimal(depositsResult._sum.unitsIssued?.toString() || '0');
        const totalUnitsBurned = new Decimal(withdrawalsResult._sum.unitsBurned?.toString() || '0');
        totalUnits = totalUnitsIssued.sub(totalUnitsBurned);

        console.log(`Total Units Issued: ${totalUnitsIssued.toFixed(6)}`);
        console.log(`Total Units Burned: ${totalUnitsBurned.toFixed(6)}`);
        console.log(`Net Units Outstanding: ${totalUnits.toFixed(6)}`);

        const [totalDepositsAmount, depositsList] = await Promise.all([
            prisma.deposit.aggregate({
                where: { status: 'APPROVED' },
                _sum: { amount: true }
            }),
            prisma.deposit.findMany({
                where: { status: 'APPROVED' },
                select: { id: true, amount: true, unitsIssued: true, navAtIssue: true }
            })
        ]);

        console.log(`\n--- DATA INTEGRITY CHECK ---`);
        console.log(`Sum of Approved Deposits (Amount): ${totalDepositsAmount._sum.amount}`);
        console.log(`Total Units Issued: ${totalUnitsIssued.toFixed(6)}`);

        if (depositsList.length > 0) {
            console.log(`Sample Deposit: Amount=${depositsList[0].amount}, Units=${depositsList[0].unitsIssued}, NAV@Issue=${depositsList[0].navAtIssue}`);
        }

        // Calculate balance manually from ledger lines to match ledgerService
        const [debits, credits] = await Promise.all([
            prisma.ledgerLine.aggregate({
                where: { debitAccountId: investorEquityAccount.id },
                _sum: { amount: true },
            }),
            prisma.ledgerLine.aggregate({
                where: { creditAccountId: investorEquityAccount.id },
                _sum: { amount: true },
            })
        ]);


        const totalDebits = new Decimal(debits._sum.amount?.toString() || '0');
        const totalCredits = new Decimal(credits._sum.amount?.toString() || '0');

        // EQUITY: Credit increases, Debit decreases
        equity = totalCredits.sub(totalDebits);

        if (!totalUnits.eq(0)) {
            nav = equity.div(totalUnits);
        }

        console.log(`Ledger Debits: ${totalDebits.toFixed(2)}`);
        console.log(`Ledger Credits: ${totalCredits.toFixed(2)}`);
    } else {
        console.error('ERROR: Account 2000-INVESTOR-EQUITY not found!');
    }

    console.log(`\n>>> RESULT METRICS:`);
    console.log(`NAV: ${nav.toFixed(4)}`);
    console.log(`Total Equity: ${equity.toFixed(2)} EUR`);

    // 2. Last Trade Logic
    console.log('\n--- 2. LAST TRADE ---');
    const lastTrade = await prisma.trade.findFirst({
        where: { status: { in: ['SETTLED_WIN', 'SETTLED_LOSS', 'SETTLED_VOID'] } },
        orderBy: { settledAt: 'desc' },
        select: {
            id: true,
            stake: true,
            resultAmount: true,
            event: true,
            selection: true,
            status: true,
            settledAt: true
        }
    });

    let lastTradePct = "0.00";
    if (lastTrade) {
        const stake = lastTrade.stake.toNumber();
        const result = lastTrade.resultAmount?.toNumber() || 0;
        if (stake > 0) {
            lastTradePct = (((result - stake) / stake) * 100).toFixed(2);
        }
        console.log(`Event: ${lastTrade.event}`);
        console.log(`Selection: ${lastTrade.selection}`);
        console.log(`Status: ${lastTrade.status}`);
        console.log(`Settled At: ${lastTrade.settledAt}`);
        console.log(`Stake: ${stake}`);
        console.log(`Result Amount: ${result}`);

        const sign = parseFloat(lastTradePct) > 0 ? '+' : '';
        console.log(`\n>>> RESULT METRICS:`);
        console.log(`Last Trade Pct: ${sign}${lastTradePct}%`);
    } else {
        console.log('No settled trades found.');
        console.log(`\n>>> RESULT METRICS:`);
        console.log(`Last Trade Pct: 0.00%`);
    }

    console.log('\n=============================================');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
