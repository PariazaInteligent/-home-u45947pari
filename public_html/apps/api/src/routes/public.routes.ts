
import { FastifyInstance } from 'fastify';
import { prisma } from '@pariaza/database';
import { ledgerService } from '../services/ledger.service.js';
import { Decimal } from 'decimal.js';

export async function publicRoutes(app: FastifyInstance) {
    app.get('/public/metrics', {
        schema: {
            tags: ['Public'],
            description: 'Get public metrics (NAV, Equity, Last Trade) for landing page',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        nav: { type: 'string' },
                        equity: { type: 'string' },
                        lastTradePct: { type: 'string' },
                        updatedAt: { type: 'string' },
                        edge: { type: 'string' }, // [NEW] Total Edge
                        lastTradeImpact: { type: 'string' }, // [NEW] Impact of last trade on bank
                        investorCount: { type: 'number' },  // [NEW]
                        totalProfit: { type: 'string' },   // [NEW]
                        averageRoi: { type: 'string' },    // [NEW]
                        totalStake: { type: 'string' },    // [NEW] Total stakes
                        totalTrades: { type: 'number' },   // [NEW] Total trade count
                        signals: {                         // [NEW] Full trade details
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    sport: { type: 'string' },
                                    event: { type: 'string' },
                                    market: { type: 'string' },
                                    selection: { type: 'string' },
                                    odds: { type: 'number' },
                                    stake: { type: 'number' },
                                    potentialWin: { type: 'number' },
                                    pnl: { type: 'number' },
                                    roi: { type: 'string' },
                                    status: { type: 'string' },
                                    isLive: { type: 'boolean' },
                                    createdAt: { type: 'string' },
                                    settledAt: { type: ['string', 'null'] },
                                    eventStartTime: { type: ['string', 'null'] },
                                    bookmaker: { type: ['string', 'null'] },
                                    betCode: { type: ['string', 'null'] }
                                }
                            }
                        }
                    }
                }
            }
        },
        config: {
            rateLimit: {
                max: 300,
                timeWindow: '1 minute',
            }
        }
    }, async (request, reply) => {
        // 1. Calculate NAV (Same logic as wallet.routes.ts)
        // NAV = total investor equity / total units outstanding
        // units = SUM(deposits.unitsIssued) - SUM(withdrawals.unitsBurned) for ACTIVE investors

        // 1. Calculate NAV & Equity dynamically
        // To be robust against manual DB edits, effectively:
        // Equity = (Total Approved Deposits) - (Total Paid Withdrawals) + (Total Trade PnL)
        // This bypasses the Ledger Cache which might be out of sync if user edits DB manually.

        const [depositsResult, withdrawalsResult, tradesPnlResult] = await Promise.all([
            prisma.deposit.aggregate({
                where: {
                    status: 'APPROVED',
                    users: { status: 'ACTIVE', role: { in: ['INVESTOR', 'ADMIN'] } }
                },
                _sum: { amount: true, unitsIssued: true },
            }),
            prisma.withdrawal.aggregate({
                where: {
                    status: 'PAID',
                    users: { status: 'ACTIVE', role: { in: ['INVESTOR', 'ADMIN'] } }
                },
                _sum: { amountPayout: true, unitsBurned: true },
            }),
            prisma.trade.aggregate({
                where: { status: { in: ['SETTLED_WIN', 'SETTLED_LOSS'] } },
                _sum: { resultAmount: true, stake: true }
            })
        ]);

        const totalDeposits = new Decimal(depositsResult._sum.amount?.toString() || '0');
        const totalWithdrawals = new Decimal(withdrawalsResult._sum.amountPayout?.toString() || '0');

        const totalTradeResult = new Decimal(tradesPnlResult._sum.resultAmount?.toString() || '0');
        const totalTradeStake = new Decimal(tradesPnlResult._sum.stake?.toString() || '0');
        const totalTradePnl = totalTradeResult.minus(totalTradeStake);

        // Equity = Net Deposits + Trading PnL
        const equity = totalDeposits.minus(totalWithdrawals).plus(totalTradePnl);

        // NAV Calculation
        let nav = new Decimal(10);
        const totalUnitsIssued = new Decimal(depositsResult._sum.unitsIssued?.toString() || '0');
        const totalUnitsBurned = new Decimal(withdrawalsResult._sum.unitsBurned?.toString() || '0');
        const totalUnits = totalUnitsIssued.sub(totalUnitsBurned);

        if (!totalUnits.eq(0) && !equity.eq(0)) {
            nav = equity.div(totalUnits);
        }

        // 2. Last Trade Pct
        const lastTrade = await prisma.trade.findFirst({
            where: { status: { in: ['SETTLED_WIN', 'SETTLED_LOSS', 'SETTLED_VOID'] } },
            orderBy: { settledAt: 'desc' },
            select: {
                stake: true,
                resultAmount: true
            }
        });

        let lastTradePct = "0.00";
        if (lastTrade) {
            const stake = lastTrade.stake.toNumber();
            const result = lastTrade.resultAmount?.toNumber() || 0;
            if (stake > 0) {
                lastTradePct = (((result - stake) / stake) * 100).toFixed(2);
            }
        }

        // 3. Total Edge Calculation (EV)
        // EV = Stake * (Odds / ClosingOdds - 1)
        // If ClosingOdds (providerOdds) is missing, EV = 0
        const tradesWithSettlement = await prisma.trade.findMany({
            where: {
                status: { in: ['SETTLED_WIN', 'SETTLED_LOSS', 'SETTLED_VOID'] },
                settlement_events: {
                    providerOdds: { not: null }
                }
            },
            include: {
                settlement_events: true
            }
        });

        let totalEV = new Decimal(0);
        let totalStake = new Decimal(0);

        for (const trade of tradesWithSettlement) {
            const stake = trade.stake;
            const odds = trade.odds;
            const closingOdds = trade.settlement_events?.providerOdds;

            if (closingOdds && closingOdds.gt(0)) {
                // EV % = (Odds / ClosingOdds) - 1
                // EV Value = Stake * EV %
                const evPct = odds.div(closingOdds).minus(1);
                const evValue = stake.mul(evPct);

                totalEV = totalEV.plus(evValue);
                totalStake = totalStake.plus(stake);
            }
        }

        // Calculate Edge % (Yield) = (Total EV / Total Stake) * 100
        let edgePct = "0.00";
        if (totalStake.gt(0)) {
            edgePct = totalEV.div(totalStake).mul(100).toFixed(2);
        }

        // Add sign
        const edgeSign = parseFloat(edgePct) > 0 ? '+' : '';
        const formattedEdge = `${edgeSign}${edgePct}%`;

        // 4. Last Trade Impact Calculation
        // Impact = (Profit / (CurrentEquity - Profit)) * 100
        // Profit is Net Result (ResultAmount - Stake)
        let lastTradeImpact = "0.00";
        if (lastTrade) {
            const stake = lastTrade.stake;
            const resultAmount = lastTrade.resultAmount || new Decimal(0);
            const profit = resultAmount.minus(stake); // Can be negative

            // Equity BEFORE this trade result = Current Equity - Profit
            // If profit was +100 and current equity is 1000, old equity was 900. Impact = 100/900 = 11.1%
            // If profit was -100 and current equity is 900, old equity was 1000. Impact = -100/1000 = -10%
            const equityBefore = equity.minus(profit);

            if (!equityBefore.eq(0)) {
                const impact = profit.div(equityBefore).mul(100);
                lastTradeImpact = impact.toFixed(2);
            }
        }

        // Add sign for impact
        const impactSign = parseFloat(lastTradeImpact) > 0 ? '+' : '';
        const formattedImpact = `${impactSign}${lastTradeImpact}%`;

        // Restore formattedTrade for backward compatibility
        const tradeSign = parseFloat(lastTradePct) > 0 ? '+' : '';
        const formattedTrade = `${tradeSign}${lastTradePct}%`;

        // 5. [NEW] Investor Count (Active Only, including ADMIN)
        const investorCount = await prisma.user.count({
            where: { role: { in: ['INVESTOR', 'ADMIN'] }, status: 'ACTIVE' }
        });

        // 6. [NEW] Total Profit (Net Profit of all time)
        const { _sum: { resultAmount: totalResult, stake: totalStakeAll } } = await prisma.trade.aggregate({
            where: { status: { in: ['SETTLED_WIN', 'SETTLED_LOSS'] } },
            _sum: { resultAmount: true, stake: true }
        });

        const totalProfitVal = (totalResult?.toNumber() || 0) - (totalStakeAll?.toNumber() || 0);
        const profitSign = totalProfitVal >= 0 ? '+' : '';
        const formattedProfit = `${profitSign}${totalProfitVal.toLocaleString('de-DE')} EUR`;

        // 7. [NEW] Average ROI
        let avgRoi = "0.00";
        const tStake = totalStakeAll?.toNumber() || 0;
        if (tStake > 0) {
            avgRoi = ((totalProfitVal / tStake) * 100).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        }
        const formattedRoi = `${avgRoi}%`;

        // 8. [NEW] Recent Signals (Last 10 trades)
        const recentTrades = await prisma.trade.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                sport: true,
                event: true,
                market: true,
                selection: true,
                odds: true,
                stake: true,
                potentialWin: true,
                resultAmount: true,
                status: true,
                createdAt: true,
                settledAt: true,
                bookmaker: true,
                betCode: true,
                eventStartTime: true
            }
        });

        console.log('📊 Recent trades query result:', recentTrades.length, 'trades found');
        console.log('📊 First trade raw:', JSON.stringify(recentTrades[0]));

        const signals = recentTrades.map(t => {
            try {
                console.log('Mapping trade:', t.id, 'status:', t.status);

                // Calculate PNL (Profit/Loss)
                const pnl = (t.resultAmount?.toNumber() || 0) - t.stake.toNumber();

                // Determine if trade is live (event started but not settled)
                const isLive = t.status === 'PENDING' && t.eventStartTime
                    ? new Date(t.eventStartTime) <= new Date()
                    : false;

                // Calculate ROI for individual trade
                const roi = t.stake.toNumber() > 0
                    ? ((pnl / t.stake.toNumber()) * 100).toFixed(1)
                    : "0.0";

                const result = {
                    id: t.id,
                    sport: t.sport,
                    event: t.event,
                    market: t.market,
                    selection: t.selection,
                    odds: t.odds.toNumber(),
                    stake: t.stake.toNumber(),
                    potentialWin: t.potentialWin.toNumber(),
                    pnl: pnl,
                    roi: roi,
                    status: t.status,
                    isLive: isLive,
                    createdAt: t.createdAt.toISOString(),
                    settledAt: t.settledAt?.toISOString() || null,
                    eventStartTime: t.eventStartTime?.toISOString() || null,
                    bookmaker: t.bookmaker || null,
                    betCode: t.betCode || null
                };

                console.log('Mapped result:', JSON.stringify(result));
                return result;
            } catch (error) {
                console.error('Error mapping trade:', error);
                return {};
            }
        });

        // 9. [NEW] Current Month Profit % (ROI for current month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const { _sum: { resultAmount: monthResult, stake: monthStake } } = await prisma.trade.aggregate({
            where: {
                status: { in: ['SETTLED_WIN', 'SETTLED_LOSS'] },
                settledAt: { gte: startOfMonth }
            },
            _sum: { resultAmount: true, stake: true }
        });

        let monthRoi = "0.0";
        const mStake = monthStake?.toNumber() || 0;
        const mResult = monthResult?.toNumber() || 0;
        const mProfit = mResult - mStake;

        if (mStake > 0) {
            monthRoi = ((mProfit / mStake) * 100).toFixed(1);
        }

        const monthSign = parseFloat(monthRoi) >= 0 ? '+' : '';
        const formattedMonthRoi = `${monthSign}${monthRoi}%`;

        // 10. [NEW] MoM Equity Growth (vs Last Month)
        // Equity at Start of Month vs Current Equity
        // We already have 'startOfMonth' from Step 9.

        const [prevDeposits, prevWithdrawals, prevTrades] = await Promise.all([
            prisma.deposit.aggregate({
                where: {
                    status: 'APPROVED',
                    users: { status: 'ACTIVE', role: { in: ['INVESTOR', 'ADMIN'] } },
                    createdAt: { lt: startOfMonth }
                },
                _sum: { amount: true }
            }),
            prisma.withdrawal.aggregate({
                where: {
                    status: 'PAID',
                    users: { status: 'ACTIVE', role: { in: ['INVESTOR', 'ADMIN'] } },
                    paidAt: { lt: startOfMonth }
                },
                _sum: { amountPayout: true }
            }),
            prisma.trade.aggregate({
                where: {
                    status: { in: ['SETTLED_WIN', 'SETTLED_LOSS'] },
                    settledAt: { lt: startOfMonth }
                },
                _sum: { resultAmount: true, stake: true }
            })
        ]);

        const prevDepAmt = new Decimal(prevDeposits._sum.amount?.toString() || '0');
        const prevWithAmt = new Decimal(prevWithdrawals._sum.amountPayout?.toString() || '0');
        const prevTradeRes = new Decimal(prevTrades._sum.resultAmount?.toString() || '0');
        const prevTradeStake = new Decimal(prevTrades._sum.stake?.toString() || '0');
        const prevTradePnl = prevTradeRes.minus(prevTradeStake);

        const prevEquity = prevDepAmt.minus(prevWithAmt).plus(prevTradePnl);

        let growthPct = "0.0";
        if (prevEquity.gt(0)) {
            // (Current - Prev) / Prev * 100
            const diff = equity.minus(prevEquity);
            growthPct = diff.div(prevEquity).mul(100).toFixed(1);
        } else if (equity.gt(0)) {
            // If prev was 0 and now we have equity, it's 100% growth (or treated as new)
            growthPct = "100.0";
        }

        const growthSign = parseFloat(growthPct) >= 0 ? '+' : '';
        const formattedGrowth = `${growthSign}${growthPct}% vs luna trecută`;

        console.log('🚀 FINAL signals before send:', JSON.stringify(signals));

        // Total Stake (Rulaj) and Trade Count
        const formattedTotalStake = totalTradeStake.toNumber().toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR';
        const totalTradesCount = await prisma.trade.count();

        reply.send({
            nav: nav.toNumber().toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            equity: equity.toNumber().toLocaleString('de-DE'),
            lastTradePct: formattedTrade,
            edge: formattedEdge,
            lastTradeImpact: formattedImpact,
            investorCount,
            totalProfit: formattedProfit,
            averageRoi: formattedRoi,
            monthProfitPct: formattedMonthRoi,
            equityGrowth: formattedGrowth,
            totalStake: formattedTotalStake,    // [NEW] Total stakes (Rulaj)
            totalTrades: totalTradesCount,      // [NEW] Trade count
            signals,
            updatedAt: new Date().toISOString()
        });
    });
}
