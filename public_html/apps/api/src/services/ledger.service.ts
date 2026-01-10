import { prisma } from '@pariaza/database';
import { Decimal } from 'decimal.js';

interface LedgerLineInput {
    debitAccountId?: string;
    creditAccountId?: string;
    amount: Decimal;
    userId?: string;
    description?: string;
}

interface CreateLedgerEntryInput {
    description: string;
    referenceType?: string;
    referenceId?: string;
    createdBy?: string;
    lines: LedgerLineInput[];
}

export class LedgerService {
    /**
     * Create a balanced ledger entry with double-entry lines
     * Throws if debits != credits
     */
    async createEntry(input: CreateLedgerEntryInput) {
        // Verify balance
        let totalDebits = new Decimal(0);
        let totalCredits = new Decimal(0);

        for (const line of input.lines) {
            if (line.debitAccountId) {
                totalDebits = totalDebits.add(line.amount);
            }
            if (line.creditAccountId) {
                totalCredits = totalCredits.add(line.amount);
            }
        }

        if (!totalDebits.equals(totalCredits)) {
            throw new Error(
                `Ledger entry must balance. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`
            );
        }

        // Create entry with lines in transaction
        const entry = await prisma.ledgerEntry.create({
            data: {
                description: input.description,
                referenceType: input.referenceType,
                referenceId: input.referenceId,
                createdBy: input.createdBy || 'system',
                ledger_lines: {
                    create: input.lines.map((line) => ({
                        debitAccountId: line.debitAccountId,
                        creditAccountId: line.creditAccountId,
                        amount: line.amount,
                        userId: line.userId,
                        description: line.description,
                    })),
                },
            },
            include: {
                ledger_lines: {
                    include: {
                        accounts_ledger_lines_debitAccountIdToaccounts: true,
                        accounts_ledger_lines_creditAccountIdToaccounts: true,

                    },
                },
            },
        });

        return entry;
    }

    /**
     * Create a reversal entry for an existing entry
     * Copies all lines but flips debits/credits
     */
    async createReversal(originalEntryId: string, reason: string, createdBy?: string) {
        const original = await prisma.ledgerEntry.findUnique({
            where: { id: originalEntryId },
            include: { ledger_lines: true },
        });

        if (!original) {
            throw new Error('Original entry not found');
        }



        // Create reversal (flip debits/credits)
        const reversalLines: LedgerLineInput[] = original.ledger_lines.map((line) => ({
            debitAccountId: line.creditAccountId || undefined,
            creditAccountId: line.debitAccountId || undefined,
            amount: line.amount,
            userId: line.userId || undefined,
            description: `Reversal: ${line.description || ''}`,
        }));

        const reversal = await this.createEntry({
            description: `Reversal: ${original.description} - ${reason}`,
            referenceType: 'reversal',
            referenceId: originalEntryId,
            createdBy,
            lines: reversalLines,
        });



        return reversal;
    }

    /**
     * Get account balance (sum of debits - sum of credits for ASSET/EXPENSE, credits - debits for others)
     * @param accountId - Account ID to get balance for
     * @param userId - Optional user ID to filter lines by (for scoped balances)
     */
    async getAccountBalance(accountId: string, userId?: string) {
        const account = await prisma.account.findUnique({ where: { id: accountId } });
        if (!account) {
            throw new Error('Account not found');
        }

        // Build where clause with optional userId filter
        const debitWhere: any = { debitAccountId: accountId };
        const creditWhere: any = { creditAccountId: accountId };

        if (userId) {
            debitWhere.userId = userId;
            creditWhere.userId = userId;
        }

        const debits = await prisma.ledgerLine.aggregate({
            where: debitWhere,
            _sum: { amount: true },
        });

        const credits = await prisma.ledgerLine.aggregate({
            where: creditWhere,
            _sum: { amount: true },
        });

        const totalDebits = new Decimal(debits._sum.amount?.toString() || '0');
        const totalCredits = new Decimal(credits._sum.amount?.toString() || '0');

        // ASSET/EXPENSE: debit increases, credit decreases
        // LIABILITY/EQUITY/REVENUE: credit increases, debit decreases
        const balance =
            account.type === 'ASSET' || account.type === 'EXPENSE'
                ? totalDebits.sub(totalCredits)
                : totalCredits.sub(totalDebits);

        return {
            account,
            balance,
            totalDebits,
            totalCredits,
        };
    }

    /**
     * Verify ledger integrity - all entries balance
     */
    async verifyIntegrity() {
        const entries = await prisma.ledgerEntry.findMany({
            include: { ledger_lines: true },
        });

        const unbalanced: string[] = [];

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
                unbalanced.push(
                    `Entry ${entry.id}: Debits ${totalDebits.toFixed(2)} != Credits ${totalCredits.toFixed(2)}`
                );
            }
        }

        return {
            totalEntries: entries.length,
            balanced: unbalanced.length === 0,
            errors: unbalanced,
        };
    }
}

export const ledgerService = new LedgerService();
