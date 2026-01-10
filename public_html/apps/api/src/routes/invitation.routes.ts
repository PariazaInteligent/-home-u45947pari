import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@pariaza/database';
import { randomBytes } from 'crypto';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Generate unique invitation code
export function generateInvitationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
    let code = 'INV-';

    for (let i = 0; i < 9; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
}

// Generate invitation code endpoint
export async function generateInvitationCodeRoute(fastify: FastifyInstance) {
    fastify.post('/investor/invitation-codes/generate', {
        preHandler: [authenticate],
        schema: {
            tags: ['Investor'],
            summary: 'Generate a new invitation code',
            body: {
                type: 'object',
                properties: {
                    maxUses: { type: 'number', default: 1 },
                    expiresAt: { type: 'string', format: 'date-time', nullable: true }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        code: { type: 'string' },
                        createdAt: { type: 'string' },
                        maxUses: { type: 'number' },
                        usedCount: { type: 'number' },
                        isActive: { type: 'boolean' }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            const userId = request.user.id;
            const body = request.body as { maxUses?: number; expiresAt?: string };

            // Rate limiting: max 10 codes per day per user
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const codesCreatedToday = await prisma.invitationCode.count({
                where: {
                    createdBy: userId,
                    createdAt: {
                        gte: today
                    }
                }
            });

            if (codesCreatedToday >= 10) {
                return reply.code(429).send({
                    error: 'Rate limit exceeded',
                    message: 'Poți genera maximum 10 coduri pe zi'
                });
            }

            // Generate unique code
            let code: string;
            let codeExists = true;

            while (codeExists) {
                code = generateInvitationCode();
                const existing = await prisma.invitationCode.findUnique({
                    where: { code }
                });
                codeExists = !!existing;
            }

            // Create invitation code
            const invitationCode = await prisma.invitationCode.create({
                data: {
                    code: code!,
                    createdBy: userId,
                    maxUses: body.maxUses || 1,
                    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
                }
            });

            return {
                code: invitationCode.code,
                createdAt: invitationCode.createdAt.toISOString(),
                maxUses: invitationCode.maxUses,
                usedCount: invitationCode.usedCount,
                isActive: invitationCode.isActive
            };
        }
    });
}

// List user's invitation codes
export async function listInvitationCodesRoute(fastify: FastifyInstance) {
    fastify.get('/investor/invitation-codes', {
        preHandler: [authenticate],
        schema: {
            tags: ['Investor'],
            summary: 'List my invitation codes',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        codes: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    code: { type: 'string' },
                                    createdAt: { type: 'string' },
                                    expiresAt: { type: 'string', nullable: true },
                                    maxUses: { type: 'number' },
                                    usedCount: { type: 'number' },
                                    isActive: { type: 'boolean' }
                                }
                            }
                        }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            const userId = request.user.id;

            const codes = await prisma.invitationCode.findMany({
                where: {
                    createdBy: userId
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return {
                codes: codes.map(code => ({
                    code: code.code,
                    createdAt: code.createdAt.toISOString(),
                    expiresAt: code.expiresAt?.toISOString() || null,
                    maxUses: code.maxUses,
                    usedCount: code.usedCount,
                    isActive: code.isActive
                }))
            };
        }
    });
}

// List users referred by current user
export async function listReferralsRoute(fastify: FastifyInstance) {
    fastify.get('/investor/referrals', {
        preHandler: [authenticate],
        schema: {
            tags: ['Investor'],
            summary: 'List users I have referred',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        referrals: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string', nullable: true },
                                    email: { type: 'string' },
                                    joinedAt: { type: 'string' },
                                    invitationCode: { type: 'string', nullable: true }
                                }
                            }
                        },
                        totalReferrals: { type: 'number' }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            const userId = request.user.id;

            const referrals = await prisma.user.findMany({
                where: {
                    referredBy: userId
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    invitationCodeUsed: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return {
                referrals: referrals.map(user => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    joinedAt: user.createdAt.toISOString(),
                    invitationCode: user.invitationCodeUsed
                })),
                totalReferrals: referrals.length
            };
        }
    });
}

// Validate invitation code (public endpoint)
export async function validateInvitationCodeRoute(fastify: FastifyInstance) {
    fastify.post('/auth/validate-invitation', {
        schema: {
            tags: ['Auth'],
            summary: 'Validate an invitation code',
            body: {
                type: 'object',
                required: ['code'],
                properties: {
                    code: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        valid: { type: 'boolean' },
                        referrerName: { type: 'string', nullable: true },
                        message: { type: 'string' }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            const { code } = request.body as { code: string };

            const invitationCode = await prisma.invitationCode.findUnique({
                where: { code: code.toUpperCase() },
                include: {
                    creator: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                }
            });

            if (!invitationCode) {
                return {
                    valid: false,
                    referrerName: null,
                    message: 'Cod invalid'
                };
            }

            // Check if active
            if (!invitationCode.isActive) {
                return {
                    valid: false,
                    referrerName: null,
                    message: 'Cod dezactivat'
                };
            }

            // Check if expired
            if (invitationCode.expiresAt && new Date() > invitationCode.expiresAt) {
                return {
                    valid: false,
                    referrerName: null,
                    message: 'Cod expirat'
                };
            }

            // Check if max uses reached
            if (invitationCode.usedCount >= invitationCode.maxUses) {
                return {
                    valid: false,
                    referrerName: null,
                    message: 'Cod deja folosit'
                };
            }

            return {
                valid: true,
                referrerName: invitationCode.creator.name || invitationCode.creator.email,
                message: `Cod valid! Vei fi invitat de ${invitationCode.creator.name || invitationCode.creator.email}`
            };
        }
    });
}

export default async function invitationRoutes(fastify: FastifyInstance) {
    await generateInvitationCodeRoute(fastify);
    await listInvitationCodesRoute(fastify);
    await listReferralsRoute(fastify);
    await validateInvitationCodeRoute(fastify);
}
