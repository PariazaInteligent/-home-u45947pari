import { FastifyInstance } from 'fastify';
import { prisma } from '';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { users_role as UserRole, users_status as UserStatus } from '@prisma/client';
import { emailService } from '';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
    invitationCode: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    totpCode: z.string().length(6).optional(),
});

const refreshSchema = z.object({
    refreshToken: z.string(),
});

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
        const { email, password, name, invitationCode } = registerSchema.parse(request.body);

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return reply.code(409).send({ error: 'Conflict', message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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
                password: hashedPassword,
                name,
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
                    }
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

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
        }

        // 2FA check (simplified - full TOTP verification needed in production)
        if (user.twoFAEnabled && !totpCode) {
            return reply.code(403).send({ error: 'Forbidden', message: '2FA code required' });
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
}
