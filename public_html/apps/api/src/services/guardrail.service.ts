import { prisma } from '@pariaza/database';
import { Decimal } from 'decimal.js';
import { auditService } from './audit.service.js';

interface GuardrailConfig {
    maxStakePercent: number; // % din bank balance
    maxExposurePerSport: number; // maxim EUR exposure per sport
    maxExposurePerMarket: number; // maxim EUR exposure per market
    requireReconciliation: boolean; // refuză dacă ledger nu e balansat
}

const DEFAULT_CONFIG: GuardrailConfig = {
    maxStakePercent: 5, // max 5% din bank per trade
    maxExposurePerSport: 50000, // max €50k exposure per sport
    maxExposurePerMarket: 20000, // max €20k exposure per market
    requireReconciliation: true,
};

export class GuardrailService {
    private config: GuardrailConfig;

    constructor(config?: Partial<GuardrailConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Verifică dacă stake-ul e permis (max % din bank)
     */
    async validateStake(stake: Decimal): Promise<void> {
        const bankAccount = await prisma.account.findUnique({
            where: { code: '1100-BANK-EUR' },
        });

        if (!bankAccount) {
            throw new Error('Bank account not found');
        }

        // Calculează bank balance
        const debits = await prisma.ledgerLine.aggregate({
            where: { debitAccountId: bankAccount.id },
            _sum: { amount: true },
        });

        const credits = await prisma.ledgerLine.aggregate({
            where: { creditAccountId: bankAccount.id },
            _sum: { amount: true },
        });

        const totalDebits = new Decimal(debits._sum.amount?.toString() || '0');
        const totalCredits = new Decimal(credits._sum.amount?.toString() || '0');
        const bankBalance = totalDebits.sub(totalCredits);

        const maxStake = bankBalance.mul(this.config.maxStakePercent).div(100);

        if (stake.gt(maxStake)) {
            throw new Error(
                `Stake ${stake.toFixed(2)} EUR depășește max permis ${maxStake.toFixed(2)} EUR (${this.config.maxStakePercent}% din bank)`
            );
        }
    }

    /**
     * Verifică exposure per sport
     */
    async validateSportExposure(sport: string, newStake: Decimal): Promise<void> {
        const pendingTrades = await prisma.trade.findMany({
            where: {
                sport,
                status: 'PENDING',
            },
        });

        const currentExposure = pendingTrades.reduce(
            (sum, trade) => sum.add(trade.stake),
            new Decimal(0)
        );

        const totalExposure = currentExposure.add(newStake);

        if (totalExposure.gt(this.config.maxExposurePerSport)) {
            throw new Error(
                `Exposure total pentru ${sport}: ${totalExposure.toFixed(2)} EUR depășește max ${this.config.maxExposurePerSport} EUR`
            );
        }
    }

    /**
     * Verifică exposure per market
     */
    async validateMarketExposure(market: string, newStake: Decimal): Promise<void> {
        const pendingTrades = await prisma.trade.findMany({
            where: {
                market,
                status: 'PENDING',
            },
        });

        const currentExposure = pendingTrades.reduce(
            (sum, trade) => sum.add(trade.stake),
            new Decimal(0)
        );

        const totalExposure = currentExposure.add(newStake);

        if (totalExposure.gt(this.config.maxExposurePerMarket)) {
            throw new Error(
                `Exposure total pentru market ${market}: ${totalExposure.toFixed(2)} EUR depășește max ${this.config.maxExposurePerMarket} EUR`
            );
        }
    }

    /**
     * Verifică dacă ledger-ul e balansat (reconciliation check)
     */
    async validateReconciliation(): Promise<void> {
        if (!this.config.requireReconciliation) {
            return;
        }

        const entries = await prisma.ledgerEntry.findMany({
            include: {
                ledger_lines: true,
            },
        });

        // 2. Compute balances
        const balances = new Map<string, Decimal>();

        for (const entry of entries) {
            let totalDebits = new Decimal(0);
            let totalCredits = new Decimal(0);

            for (const line of entry.ledger_lines) {
                if (line.debitAccountId) {
                    totalDebits = totalDebits.add(line.amount);
                }
                if (line.creditAccountId) {
                    totalCredits = totalCredits.add(line.amount);
                }
            }

            if (!totalDebits.equals(totalCredits)) {
                throw new Error(
                    `Ledger nu e balansat. Entry ${entry.id}: Debits ${totalDebits.toFixed(2)} ≠ Credits ${totalCredits.toFixed(2)}. Trade blocat până la reconciliation.`
                );
            }
        }
    }

    /**
     * Validare completă pentru un trade nou
     */
    async validateTradeCreation(data: {
        sport: string;
        market: string;
        stake: Decimal;
    }): Promise<void> {
        await this.validateReconciliation();
        await this.validateStake(data.stake);
        await this.validateSportExposure(data.sport, data.stake);
        await this.validateMarketExposure(data.market, data.stake);
    }
}

export const guardrailService = new GuardrailService();
