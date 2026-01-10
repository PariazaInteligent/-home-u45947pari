import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { handleAvatarUpload } from '../middleware/upload.js';
import { prisma, DepositStatus, WithdrawalStatus } from '@pariaza/database';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export default async function userRoutes(fastify: FastifyInstance) {

    // ... (all existing endpoints remain unchanged)

    // ============================================================================
    // 2FA (Two-Factor Authentication) ENDPOINTS
    // ============================================================================

    /**
     * POST /api/users/2fa/enable-request
     * Generate TOTP secret + QR code (does NOT save to DB yet)
     */
    fastify.post('/2fa/enable-request', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;

            // 1. Validate current password
            const { currentPassword } = body;

            if (!currentPassword) {
                return reply.code(400).send({ error: 'Current password is required' });
            }

            // 2. Get user and verify password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, name: true, password: true, twoFAEnabled: true }
            });

            if (!user || !user.password) {
                return reply.code(404).send({ error: 'User not found' });
            }

            // 3. Check if 2FA already enabled
            if (user.twoFAEnabled) {
                return reply.code(400).send({
                    error: '2FA este deja activată',
                    message: 'Pentru a reseta 2FA, dezactivează mai întâi setarea curentă.'
                });
            }

            // 4. Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return reply.code(400).send({ error: 'Parola curentă este incorectă' });
            }

            // 5. Generate TOTP secret
            const secret = speakeasy.generateSecret({
                name: `Pariaza Inteligent (${user.email})`,
                issuer: 'Pariaza Inteligent',
                length: 32
            });

            // 6. Generate QR code as data URL
            const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

            // 7. Store secret temporarily in session/cache (for 10 minutes)
            // For simplicity, we'll return it and expect frontend to send it back
            // In production, use Redis or session storage

            return reply.send({
                success: true,
                qrCodeDataUrl,
                manualSecret: secret.base32,
                message: 'Scanează QR code cu Google Authenticator'
            });

        } catch (error) {
            fastify.log.error('Error enabling 2FA (request):', error);
            return reply.code(500).send({ error: 'Failed to generate 2FA setup' });
        }
    });

    /**
     * POST /api/users/2fa/enable-confirm
     * Verify TOTP code + save secret to DB + enable 2FA + generate backup codes
     */
    fastify.post('/2fa/enable-confirm', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;

            const { totpCode, secret } = body;

            // 1. Validate inputs
            if (!totpCode || !secret) {
                return reply.code(400).send({ error: 'TOTP code and secret are required' });
            }

            if (totpCode.length !== 6 || !/^\d{6}$/.test(totpCode)) {
                return reply.code(400).send({ error: 'Codul trebuie să aibă 6 cifre' });
            }

            // 2. Verify TOTP code
            const isValidCode = speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token: totpCode,
                window: 2 // Accept codes ±60 seconds for time drift
            });

            if (!isValidCode) {
                return reply.code(400).send({
                    error: 'Cod invalid',
                    message: 'Codul introdus este incorect. Verifică aplicația Google Authenticator.'
                });
            }

            // 3. Generate 10 backup codes
            const backupCodes: string[] = [];
            const backupCodeHashes: string[] = [];

            for (let i = 0; i < 10; i++) {
                // Generate random 12-char hex code
                const code = crypto.randomBytes(6).toString('hex').toUpperCase();
                const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
                backupCodes.push(formatted);

                // Hash for DB storage
                const codeHash = await bcrypt.hash(formatted, 10);
                backupCodeHashes.push(codeHash);
            }

            // 4. Save to DB in transaction (2FA secret + backup codes)
            await prisma.$transaction(async (tx) => {
                // Enable 2FA and save secret
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        twoFAEnabled: true,
                        twoFASecret: secret
                    }
                });

                // Save backup codes
                for (const codeHash of backupCodeHashes) {
                    await tx.backupCode.create({
                        data: {
                            userId,
                            codeHash
                        }
                    });
                }

                // Audit log
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: '2FA_ENABLED',
                        metadata: JSON.stringify({
                            timestamp: new Date().toISOString(),
                            backupCodesGenerated: 10
                        }),
                        resourceType: 'user',
                        resourceId: userId
                    }
                });
            });

            // 5. Send email with backup codes
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true, name: true }
                });

                if (user) {
                    const { emailService } = await import('../services/email.service.js');
                    await emailService.send2FAEnabledEmail(user, backupCodes);
                }
            } catch (emailError) {
                fastify.log.error('Failed to send 2FA enabled email:', emailError);
                // Don't fail the request if email fails
            }

            return reply.send({
                success: true,
                backupCodes, // Return to frontend for immediate display
                message: '2FA activată cu succes! Salvează codurile backup într-un loc sigur.'
            });

        } catch (error) {
            fastify.log.error('Error confirming 2FA:', error);
            return reply.code(500).send({ error: 'Failed to enable 2FA' });
        }
    });

    /**
     * POST /api/users/2fa/disable
     * Disable 2FA + delete secret + delete backup codes
     */
    fastify.post('/2fa/disable', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;

            const { currentPassword } = body;

            // 1. Validate password
            if (!currentPassword) {
                return reply.code(400).send({ error: 'Current password is required' });
            }

            // 2. Get user and verify password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true, twoFAEnabled: true, email: true, name: true }
            });

            if (!user || !user.password) {
                return reply.code(404).send({ error: 'User not found' });
            }

            if (!user.twoFAEnabled) {
                return reply.code(400).send({ error: '2FA nu este activată' });
            }

            // 3. Verify password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return reply.code(400).send({ error: 'Parola curentă este incorectă' });
            }

            // 4. Disable 2FA and delete backup codes (transaction)
            await prisma.$transaction(async (tx) => {
                // Disable 2FA
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        twoFAEnabled: false,
                        twoFASecret: null
                    }
                });

                // Delete all backup codes
                await tx.backupCode.deleteMany({
                    where: { userId }
                });

                // Audit log
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: '2FA_DISABLED',
                        metadata: JSON.stringify({
                            timestamp: new Date().toISOString()
                        }),
                        resourceType: 'user',
                        resourceId: userId
                    }
                });
            });

            // 5. Send confirmation email
            try {
                const { emailService } = await import('../services/email.service.js');
                await emailService.send2FADisabledEmail({ email: user.email, name: user.name || user.email });
            } catch (emailError) {
                fastify.log.error('Failed to send 2FA disabled email:', emailError);
            }

            return reply.send({
                success: true,
                message: '2FA dezactivată cu succes'
            });

        } catch (error) {
            fastify.log.error('Error disabling 2FA:', error);
            return reply.code(500).send({ error: 'Failed to disable 2FA' });
        }
    });

    /**
     * POST /api/users/2fa/regenerate-backup-codes
     * Delete old backup codes and generate 10 new ones
     */
    fastify.post('/2fa/regenerate-backup-codes', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;

            const { currentPassword } = body;

            // 1. Validate password
            if (!currentPassword) {
                return reply.code(400).send({ error: 'Current password is required' });
            }

            // 2. Get user and verify password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true, twoFAEnabled: true, email: true, name: true }
            });

            if (!user || !user.password) {
                return reply.code(404).send({ error: 'User not found' });
            }

            if (!user.twoFAEnabled) {
                return reply.code(400).send({ error: '2FA nu este activată. Activează 2FA mai întâi.' });
            }

            // 3. Verify password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return reply.code(400).send({ error: 'Parola curentă este incorectă' });
            }

            // 4. Generate new backup codes
            const backupCodes: string[] = [];
            const backupCodeHashes: string[] = [];

            for (let i = 0; i < 10; i++) {
                const code = crypto.randomBytes(6).toString('hex').toUpperCase();
                const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
                backupCodes.push(formatted);

                const codeHash = await bcrypt.hash(formatted, 10);
                backupCodeHashes.push(codeHash);
            }

            // 5. Replace backup codes in DB (transaction)
            await prisma.$transaction(async (tx) => {
                // Delete old codes
                await tx.backupCode.deleteMany({
                    where: { userId }
                });

                // Create new codes
                for (const codeHash of backupCodeHashes) {
                    await tx.backupCode.create({
                        data: {
                            userId,
                            codeHash
                        }
                    });
                }

                // Audit log
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: 'BACKUP_CODES_REGENERATED',
                        metadata: JSON.stringify({
                            timestamp: new Date().toISOString(),
                            codesGenerated: 10
                        }),
                        resourceType: 'backup_codes',
                        resourceId: userId
                    }
                });
            });

            // 6. Send email with new backup codes
            try {
                const { emailService } = await import('../services/email.service.js');
                await emailService.send2FABackupCodesRegeneratedEmail({ email: user.email, name: user.name || user.email }, backupCodes);
            } catch (emailError) {
                fastify.log.error('Failed to send backup codes email:', emailError);
            }

            return reply.send({
                success: true,
                backupCodes,
                message: 'Coduri backup regenerate! Codurile vechi sunt acum invalide.'
            });

        } catch (error) {
            fastify.log.error('Error regenerating backup codes:', error);
            return reply.code(500).send({ error: 'Failed to regenerate backup codes' });
        }
    });

    // ============================================================================
    // END OF 2FA ENDPOINTS
    // ============================================================================
}
