import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'Unauthorized', message: 'Missing or invalid token' });
        }

        const token = authHeader.substring(7);

        const decoded = request.server.jwt.verify(token) as any;

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
            return reply.code(401).send({ error: 'Unauthorized', message: 'User not found' });
        }

        if (user.status !== 'ACTIVE') {
            return reply.code(403).send({ error: 'Forbidden', message: 'Account not active' });
        }

        // Set user on request (folosind augmented FastifyRequest type)
        request.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
    } catch (err) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid token' });
    }
}
