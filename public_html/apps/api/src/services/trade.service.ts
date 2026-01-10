import { prisma } from '@pariaza/database';
import { Decimal } from 'decimal.js';
import { ledgerService } from './ledger.service.js';
import { auditService } from './audit.service.js';
import { guardrailService } from './guardrail.service.js';
import { TradeStatus } from '@pariaza/database';

export class TradeService {
    /**
     * Create trade cu guardrails
     */
    async createTrade(data: {
        sport: string;
        event: string;
        market: string;
        selection: string;
        odds: Decimal;
        stake: Decimal;
        createdBy: string;
        ipAddress?: string;
        userAgent?: string;
    }) {
        // Guardrails: max stake, exposure limits, reconciliation check
        await guardrailService.validateTradeCreation({
            sport: data.sport,
            market: data.market,
            stake: data.stake,
        });

        const potentialWin = data.stake.mul(data.odds.sub(1));

        const trade = await prisma.trade.create({
            data: {
                sport: data.sport,
                event: data.event,
                market: data.market,
                selection: data.selection,
                odds: data.odds,
                stake: data.stake,
                potentialWin,
                status: TradeStatus.PENDING,
                createdBy: data.createdBy,
            },
        });

        // Audit log
        await auditService.logTradeCreation(
            trade.id,
            data.createdBy,
            { sport: data.sport, event: data.event, stake: data.stake.toFixed(2), odds: data.odds.toFixed(2) },
            data.ipAddress,
            data.userAgent
        );

        return trade;
    }

    /**
     * Update trade (pre-settlement only)
     */
    async updateTrade(
        tradeId: string,
        updates: {
            sport?: string;
            event?: string;
            market?: string;
            selection?: string;
            odds?: Decimal;
            stake?: Decimal;
        },
        userId: string,
        ipAddress?: string,
        userAgent?: string
    ) {
        const trade = await prisma.trade.findUnique({ where: { id: tradeId } });

        if (!trade) {
            throw new Error('Trade not found');
        }

        if (trade.status !== TradeStatus.PENDING) {
            throw new Error('Cannot update settled trade');
        }

        const before = { ...trade };

        const newOdds = updates.odds || trade.odds;
        const newStake = updates.stake || trade.stake;
        const potentialWin = new Decimal(newStake.toString()).mul(new Decimal(newOdds.toString()).sub(1));

        const updated = await prisma.trade.update({
            where: { id: tradeId },
            data: {
                ...updates,
                potentialWin,
            },
        });

        // Audit log
        await auditService.logTradeUpdate(tradeId, userId, before, updated, ipAddress, userAgent);

        return updated;
    }

    /**
     * Settle trade with ledger entry
     */
    async settleTrade(
        tradeId: string,
        result: 'win' | 'loss' | 'void',
        providerEventId: string,
        providerOdds: Decimal,
        settledBy: string,
        ipAddress?: string,
        userAgent?: string
    ) {
        const trade = await prisma.trade.findUnique({ where: { id: tradeId } });

        if (!trade) {
            throw new Error('Trade not found');
        }

        if (trade.status !== TradeStatus.PENDING) {
            throw new Error('Trade already settled');
        }

        let resultAmount = new Decimal(0);
        let newStatus: typeof TradeStatus[keyof typeof TradeStatus] = TradeStatus.SETTLED_VOID;

        if (result === 'win') {
            resultAmount = new Decimal(trade.potentialWin.toString());
            newStatus = TradeStatus.SETTLED_WIN;
        } else if (result === 'loss') {
            resultAmount = new Decimal(trade.stake.toString()).neg();
            newStatus = TradeStatus.SETTLED_LOSS;
        }

        // Create settlement event
        const settlement = await prisma.settlementEvent.create({
            data: {
                tradeId,
                providerEventId,
                providerOdds,
                providerResult: result,
                settledBy,
            },
        });

        // Get accounts
        // BANK-EUR: ASSET (debit crește, credit scade)
        // TRADING-PNL: REVENUE (credit crește, debit scade)
        const bankAccount = await prisma.account.findUnique({ where: { code: '1100-BANK-EUR' } });
        const tradingPnlAccount = await prisma.account.findUnique({ where: { code: '4000-TRADING-PNL' } });

        if (!bankAccount || !tradingPnlAccount) {
            throw new Error('Required accounts not found');
        }

        let ledgerEntry = null;

        // Create ledger entry only if not void
        if (result !== 'void') {
            const pnlAmount = result === 'win'
                ? new Decimal(trade.potentialWin.toString())
                : new Decimal(trade.stake.toString());
            const isWin = result === 'win';

            /**
             * Mapping contabil:
             *
             * WIN (câștig):
             * - Debit Bank (ASSET): bank balance CREȘTE cu profit
             * - Credit Trading PNL (REVENUE): revenue CREȘTE cu profit
             *
             * LOSS (pierdere):
             * - Debit Trading PNL (REVENUE): revenue SCADE cu pierdere (expense)
             * - Credit Bank (ASSET): bank balance SCADE cu stake pierdut
             *
             * VOID: zero impact, fără entry
             */
            ledgerEntry = await ledgerService.createEntry({
                description: `Settlement: ${trade.event} - ${isWin ? 'WIN' : 'LOSS'} ${pnlAmount.toFixed(2)} EUR`,
                referenceType: 'trade_settlement',
                referenceId: tradeId,
                createdBy: settledBy,
                lines: isWin
                    ? [
                        {
                            debitAccountId: bankAccount.id,
                            amount: pnlAmount,
                            description: 'Bank crește: profit adăugat',
                        },
                        {
                            creditAccountId: tradingPnlAccount.id,
                            amount: pnlAmount,
                            description: 'Trading revenue crește: profit',
                        },
                    ]
                    : [
                        {
                            debitAccountId: tradingPnlAccount.id,
                            amount: pnlAmount,
                            description: 'Trading revenue scade: pierdere (expense)',
                        },
                        {
                            creditAccountId: bankAccount.id,
                            amount: pnlAmount,
                            description: 'Bank scade: stake pierdut',
                        },
                    ],
            });
        }

        // Update trade
        const settled = await prisma.trade.update({
            where: { id: tradeId },
            data: {
                status: newStatus,
                settledBy,
                settledAt: new Date(),
                resultAmount,
                ledgerEntryId: ledgerEntry?.id,
            },
        });

        // Audit log
        await auditService.logTradeSettlement(
            tradeId,
            settledBy,
            {
                result,
                providerEventId,
                resultAmount: resultAmount.toFixed(2),
                ledgerEntryId: ledgerEntry?.id,
            },
            ipAddress,
            userAgent
        );

        return { trade: settled, settlement, ledgerEntry };
    }
}

export const tradeService = new TradeService();
