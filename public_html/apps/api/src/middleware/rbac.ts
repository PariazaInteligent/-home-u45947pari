import { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user || request.user.role === 'INVESTOR') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
    }
}

export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user || request.user.role !== 'SUPER_ADMIN') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Super admin access required' });
    }
}
