import { prisma } from '@pariaza/database';
import { Decimal } from 'decimal.js';
import { ledgerService } from './ledger.service.js';

export class UnitsService {
    /**
   * Calculate current NAV (Net Asset Value) per unit
   * NAV = (Total Bank Balance) / (Total Units Outstanding)
   * 
   * Reguli:
   * - NAV inițial = 10.00 când nu există units (configurat)
   * - Nu se emit units dacă bank <= 0
   * - Decimal precision pentru evitare rounding errors
   */
    async calculateNAV() {
        const INITIAL_NAV = new Decimal(10.00); // NAV pornește de la 10.00 EUR per unit

        // Get bank account balance
        const bankAccount = await prisma.account.findUnique({
            where: { code: '1100-BANK-EUR' },
        });

        if (!bankAccount) {
            throw new Error('Bank account not found');
        }

        const bankBalance = await ledgerService.getAccountBalance(bankAccount.id);

        // Verificare: nu emit units dacă bank <= 0
        if (bankBalance.balance.lte(0)) {
            throw new Error(`Bank balance ${bankBalance.balance.toFixed(2)} EUR <= 0. Nu se pot emite units.`);
        }

        // Get total units outstanding from investor equity lines
        const investorEquityAccount = await prisma.account.findUnique({
            where: { code: '2000-INVESTOR-EQUITY' },
        });

        if (!investorEquityAccount) {
            throw new Error('Investor equity account not found');
        }

        // Get all active deposits to sum units
        const deposits = await prisma.deposit.findMany({
            where: { status: 'APPROVED' },
        });

        const totalUnitsIssued = deposits.reduce(
            (sum, deposit) => sum.add(deposit.unitsIssued || 0),
            new Decimal(0)
        );

        // Get all approved withdrawals to subtract burned units
        const withdrawals = await prisma.withdrawal.findMany({
            where: { status: { in: ['APPROVED', 'PAID'] } },
        });

        const totalUnitsBurned = withdrawals.reduce(
            (sum, withdrawal) => sum.add(withdrawal.unitsBurned || 0),
            new Decimal(0)
        );

        const totalUnitsOutstanding = totalUnitsIssued.sub(totalUnitsBurned);

        // Prima depunere: NAV = 10.00 (nu împărțim la zero)
        if (totalUnitsOutstanding.isZero()) {
            return INITIAL_NAV;
        }

        const nav = bankBalance.balance.div(totalUnitsOutstanding);
        return nav;
    }

    /**
   * Issue units for a deposit at current NAV
   */
    async issueUnits(depositId: string, adminId: string, ipAddress?: string, userAgent?: string) {
        const deposit = await prisma.deposit.findUnique({
            where: { id: depositId },
            include: { users: true },
        });

        if (!deposit) {
            throw new Error('Deposit not found');
        }

        if (deposit.status !== 'PENDING') {
            throw new Error('Deposit already processed');
        }

        const nav = await this.calculateNAV();
        const units = new Decimal(deposit.amount.toString()).div(nav);

        // Get accounts
        const bankAccount = await prisma.account.findUnique({
            where: { code: '1100-BANK-EUR' },
        });
        const investorEquityAccount = await prisma.account.findUnique({
            where: { code: '2000-INVESTOR-EQUITY' },
        });

        if (!bankAccount || !investorEquityAccount) {
            throw new Error('Required accounts not found');
        }

        // Create ledger entry
        const { auditService } = await import('./audit.service.js');
        const ledgerEntry = await ledgerService.createEntry({
            description: `Depunere investitor ${deposit.users.name || deposit.users.email} - ${deposit.amount.toFixed(2)} EUR`,
            referenceType: 'deposit',
            referenceId: depositId,
            createdBy: adminId,
            lines: [
                {
                    debitAccountId: bankAccount.id,
                    amount: new Decimal(deposit.amount.toString()),
                    description: 'Cash in bank',
                },
                {
                    creditAccountId: investorEquityAccount.id,
                    userId: deposit.userId,
                    amount: new Decimal(deposit.amount.toString()),
                    description: `Units issued: ${units.toFixed(6)}`,
                },
            ],
        });

        // Update deposit
        const updated = await prisma.deposit.update({
            where: { id: depositId },
            data: {
                status: 'APPROVED',
                approvedBy: adminId,
                approvedAt: new Date(),
                unitsIssued: units,
                navAtIssue: nav,
                ledgerEntryId: ledgerEntry.id,
            },
        });

        // Audit log
        await auditService.logDepositApproval(
            depositId,
            adminId,
            {
                amount: deposit.amount.toFixed(2),
                units: units.toFixed(6),
                nav: nav.toFixed(4),
            },
            ipAddress,
            userAgent
        );

        return { deposit: updated, units, nav, ledgerEntry };
    }

    /**
   * Burn units for a withdrawal at current NAV
   */
    async burnUnits(userId: string, amount: Decimal, adminId: string, ipAddress?: string, userAgent?: string) {
        const nav = await this.calculateNAV();
        const units = amount.div(nav);

        // Check user has enough units - OBLIGATORIU: nu arzi units peste ce are
        const userDeposits = await prisma.deposit.findMany({
            where: { userId, status: 'APPROVED' },
        });

        const userWithdrawals = await prisma.withdrawal.findMany({
            where: { userId, status: { in: ['APPROVED', 'PAID'] } },
        });

        const userUnitsIssued = userDeposits.reduce(
            (sum, d) => sum.add(d.unitsIssued || 0),
            new Decimal(0)
        );

        const userUnitsBurned = userWithdrawals.reduce(
            (sum, w) => sum.add(w.unitsBurned || 0),
            new Decimal(0)
        );

        const userUnitsAvailable = userUnitsIssued.sub(userUnitsBurned);

        if (units.gt(userUnitsAvailable)) {
            throw new Error(
                `Insufficient units. Available: ${userUnitsAvailable.toFixed(6)}, Required: ${units.toFixed(6)}`
            );
        }

        return { units, nav };
    }

    /**
     * Get investor's units balance
     */
    async getInvestorUnits(userId: string) {
        const deposits = await prisma.deposit.findMany({
            where: { userId, status: 'APPROVED' },
        });

        const withdrawals = await prisma.withdrawal.findMany({
            where: { userId, status: { in: ['APPROVED', 'PAID'] } },
        });

        const unitsIssued = deposits.reduce(
            (sum, d) => sum.add(d.unitsIssued || 0),
            new Decimal(0)
        );

        const unitsBurned = withdrawals.reduce(
            (sum, w) => sum.add(w.unitsBurned || 0),
            new Decimal(0)
        );

        const unitsBalance = unitsIssued.sub(unitsBurned);
        const nav = await this.calculateNAV();
        const value = unitsBalance.mul(nav);

        return {
            unitsIssued,
            unitsBurned,
            unitsBalance,
            nav,
            value,
        };
    }
}

export const unitsService = new UnitsService();
