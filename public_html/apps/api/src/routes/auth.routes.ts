import { FastifyInstance } from 'fastify';
import { prisma, users_role as UserRole, users_status as UserStatus } from '@pariaza/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import speakeasy from 'speakeasy';
import { emailService } from '../services/email.service.js';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).optional(), // Optional - can be set later via email link
    name: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'NEUTRAL']).optional().default('NEUTRAL'),
    invitationCode: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    totpCode: z.string().min(6).max(14).optional(), // 6 for TOTP, 14 for backup codes (XXXX-XXXX-XXXX)
});

const refreshSchema = z.object({
    refreshToken: z.string(),
});

// Helper: Generate set-password token
async function generateSetPasswordToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex'); // Plain token to send in email
    const tokenHash = await bcrypt.hash(token, 10); // Hashed for DB storage
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    await prisma.passwordResetToken.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
            purpose: 'SET_PASSWORD',
        },
    });

    return token; // Return plain token for email
}

// ⭐ Rate limiting for 2FA (in-memory - use Redis in production)
// This Map persists across requests to track failed attempts per user
const failedAttempts = new Map<string, { count: number; blockedUntil?: Date }>();

export async function authRoutes(app: FastifyInstance) {
    // Register
    app.post('/auth/register', {
        schema: {
            tags: ['Auth'],
            body: zodToJsonSchema(registerSchema),
        },
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '15 minutes',
            },
        },
    }, async (request, reply) => {
        const { email, password, name, gender, invitationCode } = registerSchema.parse(request.body);

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return reply.code(409).send({ error: 'Conflict', message: 'Email already registered' });
        }

        // Hash password only if provided; otherwise set to null for set-password flow
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        // Check invitation code if provided
        let referrerId: string | null = null;
        let userStatus: UserStatus = UserStatus.PENDING_VERIFICATION;
        let ticketId: string | null = null;

        // Generate ticket ID for pending users
        if (!invitationCode) {
            ticketId = emailService.generateTicketId();
        }

        if (invitationCode) {
            const code = await prisma.invitationCode.findUnique({
                where: { code: invitationCode.toUpperCase() },
                include: { creator: true }
            });

            if (code && code.isActive) {
                // Check if code is valid
                const isExpired = code.expiresAt && new Date() > code.expiresAt;
                const isMaxedOut = code.usedCount >= code.maxUses;

                if (!isExpired && !isMaxedOut) {
                    referrerId = code.createdBy;
                    userStatus = UserStatus.ACTIVE; // Auto-activate with valid invitation code
                }
            }
        }

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword, // Can be null if not provided
                name,
                gender: gender || 'NEUTRAL', // Save gender with default NEUTRAL
                role: UserRole.INVESTOR,
                status: userStatus,
                ticketId,
                referredBy: referrerId,
                invitationCodeUsed: invitationCode?.toUpperCase() || null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                ticketId: true,
                createdAt: true,
                referrer: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
        });

        // If invitation code was used, increment usage count
        if (invitationCode && referrerId) {
            await prisma.invitationCode.update({
                where: { code: invitationCode.toUpperCase() },
                data: {
                    usedCount: {
                        increment: 1
                    }
                }
            });
        }

        // Send email notification based on status
        try {
            if (userStatus === UserStatus.ACTIVE && user.referrer) {
                // Generate set-password token if no password provided
                let setPasswordToken: string | null = null;
                if (!hashedPassword) {
                    setPasswordToken = await generateSetPasswordToken(user.id);
                }

                // Send welcome email with instant access
                await emailService.sendWelcomeEmail(
                    {
                        id: user.id,
                        name: user.name || user.email,
                        email: user.email
                    },
                    {
                        name: user.referrer.name || user.referrer.email,
                        email: user.referrer.email
                    },
                    setPasswordToken
                );
            } else if (userStatus === UserStatus.PENDING_VERIFICATION && user.ticketId) {
                // Send pending verification email with saved ticketId
                await emailService.sendPendingEmail(
                    {
                        id: user.id,
                        name: user.name || user.email,
                        email: user.email
                    },
                    user.ticketId
                );
            }
        } catch (emailError) {
            // Log email error but don't fail registration
            console.error('❌ FAILED TO SEND REGISTRATION EMAIL:', emailError);
            console.error('Email Error Details:', {
                userEmail: user.email,
                status: userStatus,
                errorMessage: emailError instanceof Error ? emailError.message : 'Unknown error',
                errorStack: emailError instanceof Error ? emailError.stack : undefined
            });
        }

        const message = userStatus === UserStatus.ACTIVE
            ? 'Registration successful. You can now log in!'
            : 'Registration successful. Please wait for admin approval.';

        reply.code(201).send({
            user,
            message,
        });
    });

    // Login
    app.post('/auth/login', {
        schema: {
            tags: ['Auth'],
            body: zodToJsonSchema(loginSchema),
        },
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '15 minutes',
            },
        },
    }, async (request, reply) => {
        const { email, password, totpCode } = loginSchema.parse(request.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
        }

        if (user.status !== UserStatus.ACTIVE) {
            return reply.code(403).send({ error: 'Forbidden', message: 'Account not active. Contact admin.' });
        }

        // Check if password is set - if null, user needs to set password via email link
        if (!user.password) {
            return reply.code(403).send({
                error: 'Forbidden',
                message: 'Please set your password using the link sent to your email.'
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
        }

        // ⭐ 2FA VALIDATION (TOTP + Backup Codes + Rate Limiting)
        if (user.twoFAEnabled && !totpCode) {
            return reply.code(403).send({
                error: 'Forbidden',
                message: '2FA code required',
                requires2FA: true
            });
        }


        // Note: failedAttempts Map is now defined globally (top of file) to persist across requests

        console.log('[2FA LOGIN] Starting 2FA validation:', {
            userId: user.id,
            email: user.email,
            twoFAEnabled: user.twoFAEnabled,
            totpCodeProvided: !!totpCode,
            totpCodeLength: totpCode?.length,
            totpCodePreview: totpCode ? `${totpCode.substring(0, 4)}...` : null
        });

        try {
            if (user.twoFAEnabled && totpCode) {
                const attemptKey = `2fa:${user.id}`;
                const attempts = failedAttempts.get(attemptKey);

                // Check if blocked
                if (attempts?.blockedUntil && attempts.blockedUntil > new Date()) {
                    const minutesLeft = Math.ceil((attempts.blockedUntil.getTime() - Date.now()) / 60000);
                    return reply.code(429).send({
                        error: 'Too Many Requests',
                        message: `Prea multe încercări. Încearcă din nou peste ${minutesLeft} minute.`
                    });
                }

                let isValid = false;
                const isBackupCode = totpCode.includes('-'); // Backup codes have format XXXX-XXXX-XXXX

                if (isBackupCode) {
                    // Verify backup code
                    const backupCodes = await prisma.backupCode.findMany({
                        where: { userId: user.id, usedAt: null }
                    });

                    console.log('[2FA LOGIN] Backup code attempt:', {
                        providedCode: totpCode,
                        availableCodesCount: backupCodes.length
                    });

                    for (const bc of backupCodes) {
                        const matches = await bcrypt.compare(totpCode, bc.codeHash);
                        console.log('[2FA LOGIN] Comparing with hash:', {
                            backupCodeId: bc.id,
                            matches
                        });
                        if (matches) {
                            // Mark as used
                            await prisma.backupCode.update({
                                where: { id: bc.id },
                                data: { usedAt: new Date() }
                            });
                            isValid = true;
                            console.log('[2FA LOGIN] Backup code validated successfully!');
                            break;
                        }
                    }

                    if (!isValid) {
                        console.warn('[2FA LOGIN] No matching backup code found for:', totpCode);
                    }
                } else {
                    // Verify TOTP code
                    if (!user.twoFASecret) {
                        return reply.code(500).send({ error: '2FA secret missing' });
                    }

                    isValid = speakeasy.totp.verify({
                        secret: user.twoFASecret,
                        encoding: 'base32',
                        token: totpCode,
                        window: 2 // ±60 seconds for time drift
                    });
                }

                if (!isValid) {
                    // Increment failed attempts
                    const current = attempts || { count: 0 };
                    current.count++;

                    if (current.count >= 5) {
                        current.blockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min block
                    }

                    failedAttempts.set(attemptKey, current);

                    return reply.code(401).send({
                        error: 'Unauthorized',
                        message: `Cod 2FA invalid. ${Math.max(0, 5 - current.count)} încercări rămase.`
                    });
                }

                // Success - reset attempts
                failedAttempts.delete(attemptKey);
            }
        } catch (twoFAError) {
            console.error('[2FA LOGIN] CRITICAL ERROR during 2FA validation:', {
                error: twoFAError instanceof Error ? twoFAError.message : String(twoFAError),
                stack: twoFAError instanceof Error ? twoFAError.stack : undefined,
                userId: user.id,
                totpCodeProvided: !!totpCode
            });
            return reply.code(500).send({
                error: 'Internal Server Error',
                message: 'Eroare la validarea codului 2FA. Te rog încearcă din nou.'
            });
        }

        // Create session
        const refreshToken = app.jwt.sign(
            { id: user.id, email: user.email, role: user.role, type: 'refresh' },
            { expiresIn: '7d' }
        );

        await prisma.session.create({
            data: {
                userId: user.id,
                refreshToken,
                userAgent: request.headers['user-agent'] || null,
                ipAddress: request.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: {},
        });

        const accessToken = app.jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            { expiresIn: '15m' }
        );

        reply.send({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            requiresBiometric: user.biometricEnabled || false, // ⭐ Inform frontend about biometric requirement
        });
    });

    // Refresh token
    app.post('/auth/refresh', {
        schema: {
            tags: ['Auth'],
            body: zodToJsonSchema(refreshSchema),
        },
    }, async (request, reply) => {
        const { refreshToken } = refreshSchema.parse(request.body);

        try {
            const decoded = app.jwt.verify(refreshToken) as any;

            if (decoded.type !== 'refresh') {
                return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid token type' });
            }

            const session = await prisma.session.findUnique({
                where: { refreshToken },
                include: { users: true },
            });

            if (!session || session.expiresAt < new Date()) {
                return reply.code(401).send({ error: 'Unauthorized', message: 'Session expired' });
            }

            const accessToken = app.jwt.sign(
                { id: session.users.id, email: session.users.email, role: session.users.role },
                { expiresIn: '15m' }
            );

            reply.send({ accessToken });
        } catch (err) {
            reply.code(401).send({ error: 'Unauthorized', message: 'Invalid refresh token' });
        }
    });

    // Logout
    app.post('/auth/logout', {
        schema: {
            tags: ['Auth'],
            body: zodToJsonSchema(refreshSchema),
        },
    }, async (request, reply) => {
        const { refreshToken } = refreshSchema.parse(request.body);

        await prisma.session.delete({
            where: { refreshToken },
        }).catch(() => {
            // Session might not exist, ignore error
        });

        reply.send({ message: 'Logged out successfully' });
    });

    // Forgot Password (Request Link)
    app.post('/auth/forgot-password', {
        schema: {
            tags: ['Auth'],
            body: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                },
                required: ['email'],
            },
        },
        config: {
            rateLimit: {
                max: 3,
                timeWindow: '15 minutes',
            },
        },
    }, async (request, reply) => {
        const { email } = request.body as { email: string };

        const user = await prisma.user.findUnique({ where: { email } });

        // Always return success to prevent email enumeration (security best practice)
        if (!user) {
            // Fake delay to mimic processing time
            await new Promise(resolve => setTimeout(resolve, 500));
            return reply.send({ message: 'If an account exists, a reset link has been sent.' });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = await bcrypt.hash(token, 10);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
                purpose: 'RESET_PASSWORD',
            },
        });

        // Send email
        try {
            await emailService.sendPasswordResetEmail({
                id: user.id,
                email: user.email,
                name: user.name || user.email,
            }, token);
            console.log(`✅ Password reset email sent to ${user.email}`);
        } catch (error) {
            console.error('❌ Failed to send password reset email:', error);
        }

        reply.send({ message: 'If an account exists, a reset link has been sent.' });
    });


    // Verify Session (Check if token is valid)
    app.get('/auth/verify', {
        schema: {
            tags: ['Auth'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        valid: { type: 'boolean' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                name: { type: 'string', nullable: true },
                                role: { type: 'string' },
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            await request.jwtVerify();
            const user = request.user as any;
            return {
                valid: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            };
        } catch (err) {
            return reply.code(401).send({ valid: false, message: 'Invalid token' });
        }
    });

    app.post('/auth/set-password', {
        schema: {
            tags: ['Auth'],
            body: {
                type: 'object',
                properties: {
                    token: { type: 'string' },
                    newPassword: { type: 'string', minLength: 8 },
                },
                required: ['token', 'newPassword'],
            },
        },
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '15 minutes',
            },
        },
    }, async (request, reply) => {
        const { token, newPassword } = request.body as { token: string; newPassword: string };

        // Find all valid (non-expired, non-used) tokens
        const tokens = await prisma.passwordResetToken.findMany({
            where: {
                expiresAt: { gt: new Date() },
                usedAt: null,
            },
            include: { user: true },
        });

        // Compare token hash to find matching one
        let validToken: any = null;
        for (const t of tokens) {
            const isValid = await bcrypt.compare(token, t.tokenHash);
            if (isValid) {
                validToken = t;
                break;
            }
        }

        if (!validToken) {
            return reply.code(400).send({
                error: 'Bad Request',
                message: 'Invalid or expired token. Please request a new password reset link.'
            });
        }

        // Hash and set new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: validToken.userId },
            data: { password: hashedPassword },
        });

        // Mark token as used
        await prisma.passwordResetToken.update({
            where: { id: validToken.id },
            data: { usedAt: new Date() },
        });

        // Send confirmation email
        await emailService.sendPasswordSetEmail({
            id: validToken.user.id,
            email: validToken.user.email,
            name: validToken.user.name || validToken.user.email
        });

        console.log(`✅ Password set successfully for user ${validToken.user.email}`);

        reply.send({
            message: 'Password set successfully. You can now log in with your new password.',
            email: validToken.user.email,
        });
    });
}
