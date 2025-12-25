import { PrismaClient } from '@pariaza/database';
import { Decimal } from '';

const prisma = new PrismaClient();

interface SurgeSignals {
    pendingWithdrawalsCount: number;
    pendingWithdrawalsAmount: Decimal;
    withdrawalsLast24hAmount: Decimal;
    bankBalance: Decimal;
    bankUtilization: Decimal;
    systemRiskFlag: boolean;
}

interface SurgeCalculation {
    surgePct: Decimal;
    reasons: string[];
    snapshot: SurgeSignals;
}

/**
 * Calculează fees pentru withdrawal cu surge dinamic (0-25%)
 * Fee fix: 1.5%
 * Surge: bazat pe semnale deterministe cu praguri clare
 */
export async function calculateWithdrawalFees(
    amountRequested: Decimal
): Promise<{
    feeFixedPct: Decimal;
    feeSurgePct: Decimal;
    feeFixedAmount: Decimal;
    feeSurgeAmount: Decimal;
    feeTotalAmount: Decimal;
    amountPayout: Decimal;
    surgeReasons: string[];
    surgeSnapshot: SurgeSignals;
}> {
    const FEE_FIXED_PCT = new Decimal(0.015); // 1.5%
    const SURGE_CAP = new Decimal(0.25); // 25% max

    // Calculate fixed fee
    const feeFixedAmount = amountRequested.mul(FEE_FIXED_PCT);

    // Calculate surge
    const surgeCalc = await calculateSurge();

    const feeSurgeAmount = amountRequested.mul(surgeCalc.surgePct);
    const feeTotalAmount = feeFixedAmount.add(feeSurgeAmount);
    const amountPayout = amountRequested.sub(feeTotalAmount);

    return {
        feeFixedPct: FEE_FIXED_PCT,
        feeSurgePct: surgeCalc.surgePct,
        feeFixedAmount,
        feeSurgeAmount,
        feeTotalAmount,
        amountPayout,
        surgeReasons: surgeCalc.reasons,
        surgeSnapshot: surgeCalc.snapshot,
    };
}

/**
 * Surge engine cu praguri exacte și deterministe
 */
async function calculateSurge(): Promise<SurgeCalculation> {
    const SURGE_CAP = new Decimal(0.25);

    // Gather signals
    const signals = await gatherSurgeSignals();

    let surgePct = new Decimal(0);
    const reasons: string[] = [];

    // a) Pending count
    if (signals.pendingWithdrawalsCount >= 25) {
        surgePct = surgePct.add(0.07);
        reasons.push('pending_count_very_high_25');
    } else if (signals.pendingWithdrawalsCount >= 10) {
        surgePct = surgePct.add(0.03);
        reasons.push('pending_count_high_10');
    }

    // b) Utilization
    if (signals.bankUtilization.gte(0.60)) {
        surgePct = surgePct.add(0.15);
        reasons.push('utilization_critical_0_60');
    } else if (signals.bankUtilization.gte(0.40)) {
        surgePct = surgePct.add(0.10);
        reasons.push('utilization_high_0_40');
    } else if (signals.bankUtilization.gte(0.25)) {
        surgePct = surgePct.add(0.05);
        reasons.push('utilization_moderate_0_25');
    }

    // c) Withdrawals last 24h vs bank
    const withdrawals24hRatio = signals.bankBalance.gt(0)
        ? signals.withdrawalsLast24hAmount.div(signals.bankBalance)
        : new Decimal(0);

    if (withdrawals24hRatio.gte(0.20)) {
        surgePct = surgePct.add(0.10);
        reasons.push('withdrawals_24h_very_high_0_20');
    } else if (withdrawals24hRatio.gte(0.10)) {
        surgePct = surgePct.add(0.05);
        reasons.push('withdrawals_24h_high_0_10');
    }

    // d) System risk flag
    if (signals.systemRiskFlag) {
        surgePct = surgePct.add(0.05);
        reasons.push('system_risk_flag');
    }

    // Cap at 25%
    if (surgePct.gt(SURGE_CAP)) {
        surgePct = SURGE_CAP;
        reasons.push('surge_capped_at_25_pct');
    }

    return {
        surgePct,
        reasons,
        snapshot: signals,
    };
}

/**
 * Gather toate semnalele pentru surge calculation
 */
async function gatherSurgeSignals(): Promise<SurgeSignals> {
    // Pending withdrawals - folosim STRICT amountRequested
    const pendingStats = await prisma.withdrawal.aggregate({
        where: { status: 'PENDING' },
        _count: true,
        _sum: {
            amountRequested: true,
        },
    });

    const pendingWithdrawalsCount = pendingStats._count;
    const pendingWithdrawalsAmount = new Decimal(pendingStats._sum.amountRequested || 0);

    // Withdrawals last 24h (approved/paid) - strict amountRequested
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const withdrawals24hStats = await prisma.withdrawal.aggregate({
        where: {
            status: { in: ['APPROVED', 'PAID'] },
            approvedAt: { gte: last24h },
        },
        _sum: {
            amountRequested: true,
        },
    });

    const withdrawalsLast24hAmount = new Decimal(withdrawals24hStats._sum.amountRequested || 0);

    // Bank balance (din conturi ASSET cu code BANK)
    const bankAccount = await prisma.account.findFirst({
        where: { code: { contains: 'BANK' }, type: 'ASSET' },
    });

    let bankBalance = new Decimal(0);
    if (bankAccount) {
        // Simple calculation - în producție ar trebui să folosim ledgerService
        const credits = await prisma.ledgerLine.aggregate({
            where: { creditAccountId: bankAccount.id },
            _sum: { amount: true },
        });

        const debits = await prisma.ledgerLine.aggregate({
            where: { debitAccountId: bankAccount.id },
            _sum: { amount: true },
        });

        bankBalance = new Decimal(debits._sum.amount || 0).sub(credits._sum.amount || 0);
    }

    // Bank utilization
    const bankUtilization = bankBalance.gt(0)
        ? pendingWithdrawalsAmount.div(bankBalance)
        : new Decimal(0);

    // System risk flag - citim din system_config
    let systemRiskFlag = false;

    const reconciliationStatus = await prisma.$queryRaw<Array<{ value: string }>>`
        SELECT value FROM system_config WHERE key = 'reconciliation_status' LIMIT 1
    `;

    const settlementMissingCount = await prisma.$queryRaw<Array<{ value: string }>>`
        SELECT value FROM system_config WHERE key = 'settlement_missing_count' LIMIT 1
    `;

    const redFlags = await prisma.$queryRaw<Array<{ value: string }>>`
        SELECT value FROM system_config WHERE key = 'red_flags' LIMIT 1
    `;

    if (
        (reconciliationStatus.length > 0 && reconciliationStatus[0].value === 'FAIL') ||
        (settlementMissingCount.length > 0 && parseInt(settlementMissingCount[0].value) > 0) ||
        (redFlags.length > 0 && redFlags[0].value === 'true')
    ) {
        systemRiskFlag = true;
    }

    return {
        pendingWithdrawalsCount,
        pendingWithdrawalsAmount,
        withdrawalsLast24hAmount,
        bankBalance,
        bankUtilization,
        systemRiskFlag,
    };
}
