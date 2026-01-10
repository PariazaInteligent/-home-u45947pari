import { prisma } from '@pariaza/database';
import { Decimal } from 'decimal.js';

interface AuditLogData {
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    changes?: any;
    metadata?: any;
}

export class AuditService {
    async log(data: AuditLogData) {
        return await prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                resourceType: data.resourceType,
                resourceId: data.resourceId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                changes: data.changes ? JSON.stringify(data.changes) : undefined,
                metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
            },
        });
    }

    async logTradeCreation(tradeId: string, userId: string, tradeData: any, ip?: string, ua?: string) {
        return await this.log({
            userId,
            action: 'TRADE_CREATED',
            resourceType: 'trade',
            resourceId: tradeId,
            ipAddress: ip,
            userAgent: ua,
            metadata: tradeData,
        });
    }

    async logTradeUpdate(tradeId: string, userId: string, before: any, after: any, ip?: string, ua?: string) {
        return await this.log({
            userId,
            action: 'TRADE_UPDATED',
            resourceType: 'trade',
            resourceId: tradeId,
            ipAddress: ip,
            userAgent: ua,
            changes: { before, after },
        });
    }

    async logTradeSettlement(tradeId: string, userId: string, settlementData: any, ip?: string, ua?: string) {
        return await this.log({
            userId,
            action: 'TRADE_SETTLED',
            resourceType: 'trade',
            resourceId: tradeId,
            ipAddress: ip,
            userAgent: ua,
            metadata: settlementData,
        });
    }

    async logDepositApproval(depositId: string, userId: string, depositData: any, ip?: string, ua?: string) {
        return await this.log({
            userId,
            action: 'DEPOSIT_APPROVED',
            resourceType: 'deposit',
            resourceId: depositId,
            ipAddress: ip,
            userAgent: ua,
            metadata: depositData,
        });
    }

    async logWithdrawalApproval(withdrawalId: string, userId: string, withdrawalData: any, ip?: string, ua?: string) {
        return await this.log({
            userId,
            action: 'WITHDRAWAL_APPROVED',
            resourceType: 'withdrawal',
            resourceId: withdrawalId,
            ipAddress: ip,
            userAgent: ua,
            metadata: withdrawalData,
        });
    }

    async logDistributionExecution(roundId: string, userId: string, distributionData: any, ip?: string, ua?: string) {
        return await this.log({
            userId,
            action: 'DISTRIBUTION_EXECUTED',
            resourceType: 'distribution_round',
            resourceId: roundId,
            ipAddress: ip,
            userAgent: ua,
            metadata: distributionData,
        });
    }
}

export const auditService = new AuditService();
