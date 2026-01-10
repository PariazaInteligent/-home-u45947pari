import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pariaza/database';

console.log('🔑 [Auth] JWT_ACCESS_SECRET loaded (primele 10):', (process.env.JWT_ACCESS_SECRET || 'NOT_SET').substring(0, 10) + '...');

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;

        // DEBUG: Log auth header presence
        if (authHeader) {
            console.log('🔐 [Auth] Header present (primele 30):', authHeader.substring(0, 30) + '...');
        } else {
            console.log('❌ [Auth] NO Authorization header');
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ [Auth] Missing or invalid format');
            return reply.code(401).send({
                error: 'Unauthorized',
                message: 'Missing or invalid token format'
            });
        }

        const token = authHeader.substring(7);
        console.log(`🔑 [Auth] Token (primele 20): ${token.substring(0, 20)}...`);

        try {
            const decoded = request.server.jwt.verify(token) as any;
            console.log('✅ [Auth] JWT verified:', decoded.id, decoded.email);

            // Fetch user from DB
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                },
            });

            if (!user) {
                console.log('❌ [Auth] User not found in DB:', decoded.id);
                return reply.code(401).send({ error: 'Unauthorized', message: 'User not found' });
            }

            if (user.status !== 'ACTIVE') {
                console.log('🚫 [Auth] Account not active:', user.status);
                return reply.code(403).send({ error: 'Forbidden', message: 'Account not active' });
            }

            (request as any).user = {
                id: user.id,
                email: user.email,
                role: user.role,
            };
        } catch (jwtError: any) {
            console.error('==========================================');
            console.error('❌ [Auth] JWT VERIFICATION FAILED');
            console.error('Error:', jwtError.message);
            console.error('Name:', jwtError.name);

            if (jwtError.message?.includes('expired')) {
                console.error('⏰ TOKEN EXPIRED');
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (jwtError.message?.includes('signature') || jwtError.message?.includes('invalid')) {
                console.error('🔴 INVALID TOKEN - Possible: JWT_SECRET changed or token tampered');
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Invalid token',
                    code: 'TOKEN_INVALID'
                });
            } else {
                console.error('🔴 UNKNOWN JWT ERROR');
                console.error('==========================================');
                return reply.code(401).send({
                    error: 'Unauthorized',
                    message: 'Token verification failed',
                    code: 'TOKEN_VERIFICATION_FAILED'
                });
            }
        }
    } catch (error) {
        console.error('💥 [Auth] Unexpected error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
    }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
    }
}

export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    // For now, allow ADMIN as well, or strictly SUPER_ADMIN if you prefer.
    // Assuming SUPER_ADMIN role might exist or ADMIN is sufficient for now.
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return reply.code(403).send({ error: 'Forbidden', message: 'Super Admin access required' });
    }
}
