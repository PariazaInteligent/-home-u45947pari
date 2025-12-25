import { PrismaClient, AccountType, UserRole, UserStatus, TradeStatus, DistributionStatus, DepositStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed process...');

    // =======================
    // 1. Chart of Accounts
    // =======================
    console.log('\n📊 Creating chart of accounts...');

    const accounts = [
        // ASSETS
        { code: '1000-CASH', name: 'Cash Account', type: AccountType.ASSET, isSystem: true },
        { code: '1100-BANK-EUR', name: 'Bank Account EUR', type: AccountType.ASSET, isSystem: true },
        { code: '1200-RECEIVABLES', name: 'Receivables', type: AccountType.ASSET, isSystem: false },

        // LIABILITIES (investor equity is technically a liability to the business)
        { code: '2000-INVESTOR-EQUITY', name: 'Investor Equity Pool', type: AccountType.LIABILITY, isSystem: true },
        { code: '2100-PAYABLES', name: 'Payables', type: AccountType.LIABILITY, isSystem: false },

        // EQUITY
        { code: '3000-ADMIN-EQUITY', name: 'Admin Equity', type: AccountType.EQUITY, isSystem: true },
        { code: '3100-RETAINED-EARNINGS', name: 'Retained Earnings', type: AccountType.EQUITY, isSystem: true },

        // REVENUE
        { code: '4000-TRADING-PNL', name: 'Trading Profit/Loss', type: AccountType.REVENUE, isSystem: true },
        { code: '4100-PERFORMANCE-FEES', name: 'Performance Fees', type: AccountType.REVENUE, isSystem: true },
        { code: 'WITHDRAWAL_FEES_EUR', name: 'Withdrawal Fees Revenue', type: AccountType.REVENUE, isSystem: true },

        // EXPENSES
        { code: '5000-OPERATING-COSTS', name: 'Operating Costs', type: AccountType.EXPENSE, isSystem: false },
    ];

    for (const acc of accounts) {
        await prisma.account.upsert({
            where: { code: acc.code },
            update: { name: acc.name },
            create: acc,
        });
    }
    console.log(`✅ Created ${accounts.length} accounts`);

    // =======================
    // 2. Users (Admin + Investors)
    // =======================
    console.log('\n👥 Creating users...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Super Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@pariaza.ro' },
        update: {
            twoFactorEnabled: true,
            twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Mock TOTP secret pentru testing
        },
        create: {
            email: 'admin@pariaza.ro',
            password: await bcrypt.hash('AdminPass123!', 10),
            name: 'Super Admin',
            role: UserRole.SUPER_ADMIN,
            status: UserStatus.ACTIVE,
            twoFactorEnabled: true,
            twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Mock TOTP secret pentru testing
        },
    });
    console.log(`✅ Created admin: ${admin.email} (2FA: ${admin.twoFactorEnabled})`);

    // Investor 1: High-value
    const investor1 = await prisma.user.upsert({
        where: { email: 'investor1@example.com' },
        update: {},
        create: {
            email: 'investor1@example.com',
            password: hashedPassword,
            name: 'Alexandru Popescu',
            role: UserRole.INVESTOR,
            status: UserStatus.ACTIVE,
        },
    });

    // Investor 2: Medium-value
    const investor2 = await prisma.user.upsert({
        where: { email: 'investor2@example.com' },
        update: {},
        create: {
            email: 'investor2@example.com',
            password: hashedPassword,
            name: 'Maria Ionescu',
            role: UserRole.INVESTOR,
            status: UserStatus.ACTIVE,
        },
    });

    // Investor 3: Low-value
    const investor3 = await prisma.user.upsert({
        where: { email: 'investor3@example.com' },
        update: {},
        create: {
            email: 'investor3@example.com',
            password: hashedPassword,
            name: 'Ion Vasilescu',
            role: UserRole.INVESTOR,
            status: UserStatus.ACTIVE,
        },
    });

    console.log(`✅ Created 3 investors`);

    // =======================
    // 3. Initial Deposits + Units
    // =======================
    console.log('\n💰 Creating initial deposits...');

    const bankAccount = await prisma.account.findUnique({ where: { code: '1100-BANK-EUR' } });
    const investorEquityAccount = await prisma.account.findUnique({ where: { code: '2000-INVESTOR-EQUITY' } });

    // Initial NAV = 1.0000 (at start)
    const initialNav = new Decimal(1);

    // Deposit 1: €5,000
    const deposit1Amount = new Decimal(5000);
    const units1 = deposit1Amount.div(initialNav);

    const deposit1 = await prisma.deposit.create({
        data: {
            userId: investor1.id,
            amount: deposit1Amount,
            status: DepositStatus.APPROVED,
            approvedBy: admin.id,
            approvedAt: new Date('2025-11-01T10:00:00Z'),
            unitsIssued: units1,
            navAtIssue: initialNav,
        },
    });

    // Ledger entry for deposit 1
    const ledger1 = await prisma.ledgerEntry.create({
        data: {
            description: `Depunere investitor ${investor1.name} - ${deposit1Amount.toFixed(2)} EUR`,
            referenceType: 'deposit',
            referenceId: deposit1.id,
            createdBy: admin.id,
            lines: {
                create: [
                    {
                        debitAccountId: bankAccount!.id,
                        amount: deposit1Amount,
                        description: 'Cash in bank',
                    },
                    {
                        creditAccountId: investorEquityAccount!.id,
                        userId: investor1.id,
                        amount: deposit1Amount,
                        description: `Units issued: ${units1.toFixed(6)}`,
                    },
                ],
            },
        },
    });

    await prisma.deposit.update({
        where: { id: deposit1.id },
        data: { ledgerEntryId: ledger1.id },
    });

    // Deposit 2: €10,000
    const deposit2Amount = new Decimal(10000);
    const units2 = deposit2Amount.div(initialNav);

    const deposit2 = await prisma.deposit.create({
        data: {
            userId: investor2.id,
            amount: deposit2Amount,
            status: DepositStatus.APPROVED,
            approvedBy: admin.id,
            approvedAt: new Date('2025-11-01T11:00:00Z'),
            unitsIssued: units2,
            navAtIssue: initialNav,
        },
    });

    const ledger2 = await prisma.ledgerEntry.create({
        data: {
            description: `Depunere investitor ${investor2.name} - ${deposit2Amount.toFixed(2)} EUR`,
            referenceType: 'deposit',
            referenceId: deposit2.id,
            createdBy: admin.id,
            lines: {
                create: [
                    {
                        debitAccountId: bankAccount!.id,
                        amount: deposit2Amount,
                        description: 'Cash in bank',
                    },
                    {
                        creditAccountId: investorEquityAccount!.id,
                        userId: investor2.id,
                        amount: deposit2Amount,
                        description: `Units issued: ${units2.toFixed(6)}`,
                    },
                ],
            },
        },
    });

    await prisma.deposit.update({
        where: { id: deposit2.id },
        data: { ledgerEntryId: ledger2.id },
    });

    // Deposit 3: €2,500
    const deposit3Amount = new Decimal(2500);
    const units3 = deposit3Amount.div(initialNav);

    const deposit3 = await prisma.deposit.create({
        data: {
            userId: investor3.id,
            amount: deposit3Amount,
            status: DepositStatus.APPROVED,
            approvedBy: admin.id,
            approvedAt: new Date('2025-11-01T12:00:00Z'),
            unitsIssued: units3,
            navAtIssue: initialNav,
        },
    });

    const ledger3 = await prisma.ledgerEntry.create({
        data: {
            description: `Depunere investitor ${investor3.name} - ${deposit3Amount.toFixed(2)} EUR`,
            referenceType: 'deposit',
            referenceId: deposit3.id,
            createdBy: admin.id,
            lines: {
                create: [
                    {
                        debitAccountId: bankAccount!.id,
                        amount: deposit3Amount,
                        description: 'Cash in bank',
                    },
                    {
                        creditAccountId: investorEquityAccount!.id,
                        userId: investor3.id,
                        amount: deposit3Amount,
                        description: `Units issued: ${units3.toFixed(6)}`,
                    },
                ],
            },
        },
    });

    await prisma.deposit.update({
        where: { id: deposit3.id },
        data: { ledgerEntryId: ledger3.id },
    });

    // Deposit 4: PENDING (pentru testing UI)
    const deposit4 = await prisma.deposit.create({
        data: {
            userId: investor1.id,
            amount: new Decimal(1000),
            status: 'PENDING',
            proofUrl: 'https://example.com/proof4.jpg',
        },
    });

    console.log(`✅ Created 3 deposits totaling ${deposit1Amount.add(deposit2Amount).add(deposit3Amount).toFixed(2)} EUR`);
    console.log(`✅ Created 1 PENDING deposit: €${deposit4.amount.toFixed(2)}`);

    // Total bank balance after deposits
    let bankBalance = deposit1Amount.add(deposit2Amount).add(deposit3Amount);
    console.log(`📈 Bank balance: ${bankBalance.toFixed(2)} EUR`);

    // =======================
    // 4. Create Withdrawals (PENDING și APPROVED pentru testing)
    // =======================
    console.log('\n💸 Creating withdrawals...');

    // Withdrawal 1: PENDING (in cooldown)
    const cooldownUntil1 = new Date();
    cooldownUntil1.setDate(cooldownUntil1.getDate() + 5); // 5 zile rămase din cooldown

    const withdrawal1 = await prisma.withdrawal.create({
        data: {
            userId: investor2.id,
            amount: new Decimal(500),
            status: 'PENDING',
            cooldownUntil: cooldownUntil1,
        },
    });

    // Withdrawal 2: APPROVED (pentru investor3)
    const withdrawal2Nav = new Decimal(1.0179);
    const withdrawal2Units = new Decimal(200).div(withdrawal2Nav);

    const withdrawal2 = await prisma.withdrawal.create({
        data: {
            userId: investor3.id,
            amount: new Decimal(200),
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: admin.id,
            unitsBurned: withdrawal2Units,
            navAtBurn: withdrawal2Nav,
            cooldownUntil: new Date(Date.now() - 1000), // cooldown trecut
        },
    });

    console.log(`✅ Created 1 PENDING withdrawal: €${withdrawal1.amount.toFixed(2)} (cooldown: ${withdrawal1.cooldownUntil.toISOString()})`);
    console.log(`✅ Created 1 APPROVED withdrawal: €${withdrawal2.amount.toFixed(2)}, units burned: ${withdrawal2Units.toFixed(6)}`);

    // =======================
    // 5. Create Trades (with settlements)
    // =======================
    console.log('\n⚽ Creating trades...');

    const tradingPnlAccount = await prisma.account.findUnique({ where: { code: '4000-TRADING-PNL' } });

    const trades = [
        // Win trades
        { sport: 'Football', event: 'Real Madrid vs Barcelona', market: '1X2', selection: 'Real Madrid', odds: new Decimal(2.10), stake: new Decimal(500), result: 'win' },
        { sport: 'Tennis', event: 'Djokovic vs Nadal', market: 'Winner', selection: 'Djokovic', odds: new Decimal(1.85), stake: new Decimal(750), result: 'win' },
        { sport: 'Basketball', event: 'Lakers vs Celtics', market: 'Spread', selection: 'Lakers -5.5', odds: new Decimal(1.95), stake: new Decimal(600), result: 'win' },

        // Loss trades
        { sport: 'Football', event: 'Manchester United vs Liverpool', market: '1X2', selection: 'Man Utd', odds: new Decimal(2.50), stake: new Decimal(400), result: 'loss' },
        { sport: 'Tennis', event: 'Federer vs Murray', market: 'Winner', selection: 'Federer', odds: new Decimal(1.75), stake: new Decimal(550), result: 'loss' },

        // More wins
        { sport: 'Football', event: 'Bayern vs Dortmund', market: 'Over/Under 2.5', selection: 'Over', odds: new Decimal(1.90), stake: new Decimal(650), result: 'win' },
        { sport: 'Basketball', event: 'Warriors vs Nets', market: 'Winner', selection: 'Warriors', odds: new Decimal(1.65), stake: new Decimal(800), result: 'win' },

        // Void trade
        { sport: 'Tennis', event: 'Thiem vs Zverev', market: 'Winner', selection: 'Thiem', odds: new Decimal(2.00), stake: new Decimal(450), result: 'void' },

        // More losses
        { sport: 'Football', event: 'PSG vs Lyon', market: '1X2', selection: 'PSG', odds: new Decimal(1.55), stake: new Decimal(900), result: 'loss' },
        { sport: 'Basketball', event: 'Bucks vs Heat', market: 'Spread', selection: 'Bucks -8.5', odds: new Decimal(1.88), stake: new Decimal(700), result: 'loss' },
    ];

    for (const [index, tradeData] of trades.entries()) {
        const potentialWin = tradeData.stake.mul(tradeData.odds.sub(1));

        const trade = await prisma.trade.create({
            data: {
                createdBy: admin.id,
                createdAt: new Date(`2025-11-0${Math.floor(index / 3) + 2}T${10 + index}:00:00Z`),
                sport: tradeData.sport,
                event: tradeData.event,
                market: tradeData.market,
                selection: tradeData.selection,
                odds: tradeData.odds,
                stake: tradeData.stake,
                potentialWin: potentialWin,
                status: tradeData.result === 'win' ? TradeStatus.SETTLED_WIN :
                    tradeData.result === 'loss' ? TradeStatus.SETTLED_LOSS :
                        TradeStatus.SETTLED_VOID,
                settledBy: admin.id,
                settledAt: new Date(`2025-11-0${Math.floor(index / 3) + 2}T${18 + index % 3}:00:00Z`),
                resultAmount: tradeData.result === 'win' ? potentialWin :
                    tradeData.result === 'loss' ? tradeData.stake.neg() :
                        new Decimal(0),
            },
        });

        // Create settlement event
        await prisma.settlementEvent.create({
            data: {
                tradeId: trade.id,
                providerEventId: `EVT-${1000 + index}`,
                providerOdds: tradeData.odds,
                providerResult: tradeData.result,
                settledBy: admin.id,
            },
        });

        // Create ledger entry for settlement (if not void)
        if (tradeData.result !== 'void') {
            const pnlAmount = tradeData.result === 'win' ? potentialWin : tradeData.stake;
            const isWin = tradeData.result === 'win';

            const settlementLedger = await prisma.ledgerEntry.create({
                data: {
                    description: `Settlement: ${trade.event} - ${isWin ? 'WIN' : 'LOSS'} ${pnlAmount.toFixed(2)} EUR`,
                    referenceType: 'trade_settlement',
                    referenceId: trade.id,
                    createdBy: admin.id,
                    lines: {
                        create: isWin ? [
                            {
                                debitAccountId: bankAccount!.id,
                                amount: pnlAmount,
                                description: 'Profit added to bank',
                            },
                            {
                                creditAccountId: tradingPnlAccount!.id,
                                amount: pnlAmount,
                                description: 'Trading profit',
                            },
                        ] : [
                            {
                                debitAccountId: tradingPnlAccount!.id,
                                amount: pnlAmount,
                                description: 'Trading loss',
                            },
                            {
                                creditAccountId: bankAccount!.id,
                                amount: pnlAmount,
                                description: 'Loss deducted from bank',
                            },
                        ],
                    },
                },
            });

            await prisma.trade.update({
                where: { id: trade.id },
                data: { ledgerEntryId: settlementLedger.id },
            });

            // Update bank balance
            bankBalance = isWin ? bankBalance.add(pnlAmount) : bankBalance.sub(pnlAmount);
        }
    }

    console.log(`✅ Created ${trades.length} trades`);
    console.log(`📈 Bank balance after trades: ${bankBalance.toFixed(2)} EUR`);

    // =======================
    // 5. Snapshot + Distribution Round
    // =======================
    console.log('\n📸 Creating distribution snapshot...');

    const totalUnits = units1.add(units2).add(units3);
    const newNav = bankBalance.div(totalUnits);

    const snapshot = await prisma.snapshot.create({
        data: {
            bankBalance: bankBalance,
            unitsOutstanding: totalUnits,
            navPerUnit: newNav,
            totalInvestors: 3,
            reason: 'Monthly distribution - November 2025',
        },
    });

    console.log(`✅ Snapshot created: NAV = ${newNav.toFixed(4)}, Units = ${totalUnits.toFixed(6)}`);

    // Calculate profit
    const initialBank = deposit1Amount.add(deposit2Amount).add(deposit3Amount);
    const totalProfit = bankBalance.sub(initialBank);
    const performanceFee = totalProfit.gt(0) ? totalProfit.mul(0.20) : new Decimal(0);
    const netDistributed = totalProfit.sub(performanceFee);

    console.log(`💵 Total profit: ${totalProfit.toFixed(2)} EUR`);
    console.log(`💵 Performance fee (20%): ${performanceFee.toFixed(2)} EUR`);
    console.log(`💵 Net distributed: ${netDistributed.toFixed(2)} EUR`);

    const distributionRound = await prisma.distributionRound.create({
        data: {
            createdBy: admin.id,
            periodStart: new Date('2025-11-01T00:00:00Z'),
            periodEnd: new Date('2025-11-30T23:59:59Z'),
            status: DistributionStatus.EXECUTED,
            executedBy: admin.id,
            executedAt: new Date('2025-12-01T10:00:00Z'),
            snapshotId: snapshot.id,
            bankBalance: bankBalance,
            unitsOutstanding: totalUnits,
            navPerUnit: newNav,
            totalProfit: totalProfit,
            performanceFee: performanceFee,
            netDistributed: netDistributed,
            reason: 'Monthly profit distribution - November 2025',
        },
    });

    // Create allocations
    const performanceFeeAccount = await prisma.account.findUnique({ where: { code: '4100-PERFORMANCE-FEES' } });

    const investors = [
        { user: investor1, units: units1 },
        { user: investor2, units: units2 },
        { user: investor3, units: units3 },
    ];

    for (const inv of investors) {
        const sharePercent = inv.units.div(totalUnits);
        const allocationAmount = netDistributed.mul(sharePercent);

        await prisma.distributionAllocation.create({
            data: {
                roundId: distributionRound.id,
                userId: inv.user.id,
                units: inv.units,
                sharePercent: sharePercent,
                allocationAmount: allocationAmount,
            },
        });
    }

    // Create ledger entry for distribution
    const distributionLedger = await prisma.ledgerEntry.create({
        data: {
            description: `Distribution Round - November 2025`,
            referenceType: 'distribution',
            referenceId: distributionRound.id,
            createdBy: admin.id,
            lines: {
                create: [
                    // Debit: Trading PNL (close profit to equity)
                    {
                        debitAccountId: tradingPnlAccount!.id,
                        amount: totalProfit,
                        description: 'Close trading PNL',
                    },
                    // Credit: Performance fee
                    {
                        creditAccountId: performanceFeeAccount!.id,
                        amount: performanceFee,
                        description: 'Performance fee',
                    },
                    // Credit: Investor equity (net profit distributed)
                    {
                        creditAccountId: investorEquityAccount!.id,
                        amount: netDistributed,
                        description: 'Profit distributed to investors',
                    },
                ],
            },
        },
    });

    await prisma.distributionRound.update({
        where: { id: distributionRound.id },
        data: { ledgerEntryId: distributionLedger.id },
    });

    console.log(`✅ Created distribution round with 3 allocations`);

    // =======================
    // 6. Academy Articles (seed 12 articles)
    // =======================
    console.log('\n📚 Creating academy articles...');

    const articles = [
        {
            slug: 'understanding-drawdown',
            title: 'Înțelegerea Drawdown-ului în Value Betting',
            summary: 'Drawdown-ul este parte inevitabilă a value betting. Descoperă ce este, de ce apare și cum să-l gestionezi.',
            content: '# Content placeholder',
            readTimeMinutes: 8,
            tags: JSON.stringify(['drawdown', 'risk', 'psychologie']),
            isFeatured: true,
        },
        {
            slug: 'value-betting-not-arbitrage',
            title: 'De ce Value Betting Nu Este Arbitraj',
            summary: 'Mulți confundă value betting cu arbitrajul. Diferențele sunt critice pentru așteptări realiste.',
            content: '# Content placeholder',
            readTimeMinutes: 6,
            tags: JSON.stringify(['value', 'arbitraj', 'concepte']),
            isFeatured: true,
        },
        {
            slug: 'bankroll-management-essential',
            title: 'Managementul Bankroll-ului: Esențial pentru Supraviețuire',
            summary: 'Fără managementul corect al bankroll-ului, chiar și cea mai bună strategie eșuează.',
            content: '# Content placeholder',
            readTimeMinutes: 10,
            tags: JSON.stringify(['bankroll', 'management', 'strategie']),
            isFeatured: true,
        },
        {
            slug: 'variance-unavoidable',
            title: 'Varianța Este Inevitabilă',
            summary: 'Value betting garantează avantaj statistic, nu profit garantat pe termen scurt.',
            content: '# Content placeholder',
            readTimeMinutes: 7,
            tags: JSON.stringify(['varianță', 'statistică', 'așteptări']),
            isFeatured: false,
        },
        {
            slug: 'kelly-criterion-explained',
            title: 'Criteriul Kelly Explicat Simplu',
            summary: 'Formula matematică care optimizează dimensiunea mizelor pentru creștere pe termen lung.',
            content: '# Content placeholder',
            readTimeMinutes: 9,
            tags: JSON.stringify(['kelly', 'matematică', 'miză']),
            isFeatured: false,
        },
        {
            slug: 'roi-vs-profit',
            title: 'ROI vs Profit: Ce Contează Mai Mult?',
            summary: 'Înțelegerea diferenței dintre ROI procentual și profit absolut.',
            content: '# Content placeholder',
            readTimeMinutes: 5,
            tags: JSON.stringify(['roi', 'profit', 'metrici']),
            isFeatured: false,
        },
        {
            slug: 'emotional-control',
            title: 'Controlul Emoțional în Perioade Negative',
            summary: 'Psihologia investitorului: cum să rămâi calm când pierzi.',
            content: '# Content placeholder',
            readTimeMinutes: 7,
            tags: JSON.stringify(['psihologie', 'emoții', 'disciplină']),
            isFeatured: false,
        },
        {
            slug: 'diversification-betting',
            title: 'Diversificarea în Betting',
            summary: 'De ce să nu pui toate ouăle într-un singur coș de pariuri.',
            content: '# Content placeholder',
            readTimeMinutes: 6,
            tags: JSON.stringify(['diversificare', 'risc', 'strategie']),
            isFeatured: false,
        },
        {
            slug: 'odds-movement-meaning',
            title: 'Ce Înseamnă Mișcarea Cotelor',
            summary: 'Cum să interpretezi schimbările de cote și ce spun despre piață.',
            content: '# Content placeholder',
            readTimeMinutes: 8,
            tags: JSON.stringify(['cote', 'piață', 'analiză']),
            isFeatured: false,
        },
        {
            slug: 'expected-value-foundation',
            title: 'Expected Value: Fundamentul Value Betting',
            summary: 'Formula EV și de ce este singura metrică care contează pe termen lung.',
            content: '# Content placeholder',
            readTimeMinutes: 9,
            tags: JSON.stringify(['ev', 'matematică', 'fond']),
            isFeatured: false,
        },
        {
            slug: 'closing-line-value',
            title: 'Closing Line Value: Barometrul Performanței',
            summary: 'Cum să măsori calitatea selecțiilor tale prin CLV.',
            content: '# Content placeholder',
            readTimeMinutes: 7,
            tags: JSON.stringify(['clv', 'performanță', 'metrici']),
            isFeatured: false,
        },
        {
            slug: 'tax-implications-romania',
            title: 'Implicațiile Fiscale pentru Investitori în România',
            summary: 'Ghid de bază despre cum să declari câștigurile din value betting.',
            content: '# Content placeholder',
            readTimeMinutes: 10,
            tags: JSON.stringify(['taxe', 'fiscal', 'legal']),
            isFeatured: false,
        },
    ];

    for (const article of articles) {
        await prisma.article.upsert({
            where: { slug: article.slug },
            update: {},
            create: article,
        });
    }

    console.log(`✅ Created ${articles.length} academy articles`);

    // =======================
    // 7. System Config
    // =======================
    console.log('\n⚙️ Creating system config...');

    await prisma.systemConfig.upsert({
        where: { key: 'FEATURE_FLAGS' },
        update: {},
        create: {
            key: 'FEATURE_FLAGS',
            value: JSON.stringify({
                enable_2fa_investors: false,
                two_man_distribution_approval: false,
                auto_settlement_enabled: false,
                public_kpi_delay_hours: 24,
            }),
            updatedBy: admin.id,
        },
    });

    await prisma.systemConfig.upsert({
        where: { key: 'PROVIDER_CONFIG' },
        update: {},
        create: {
            key: 'PROVIDER_CONFIG',
            value: JSON.stringify({
                mode: 'mock', // mock | sandbox | production
                api_endpoint: 'https://mock.provider.com/api',
                api_key: 'MOCK_API_KEY',
            }),
            updatedBy: admin.id,
        },
    });

    console.log(`✅ Created system configuration`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${accounts.length} accounts created`);
    console.log(`- 4 users (1 admin, 3 investors)`);
    console.log(`- 3 deposits totaling ${initialBank.toFixed(2)} EUR`);
    console.log(`- ${trades.length} trades`);
    console.log(`- 1 distribution round`);
    console.log(`- ${articles.length} academy articles`);
    console.log(`- Final bank balance: ${bankBalance.toFixed(2)} EUR`);
    console.log(`- Final NAV: ${newNav.toFixed(4)}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
