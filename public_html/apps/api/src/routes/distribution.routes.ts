import { FastifyInstance } from 'fastify';
import { prisma } from '';
import { authenticate } from '';
import { requireAdmin, requireSuperAdmin } from '';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const createRoundSchema = z.object({
    periodStart: z.string(),
    periodEnd: z.string(),
    reason: z.string().optional(),
});

const executeRoundSchema = z.object({
    roundId: z.string(),
});

export async function distributionRoutes(app: FastifyInstance) {
    // Placeholder: Create distribution round
    app.post('/distributions/rounds', {
        schema: {
            tags: ['Distributions'],
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(createRoundSchema),
        },
        preHandler: [authenticate, requireAdmin],
    }, async (request, reply) => {
        reply.code(501).send({ error: 'Not Implemented', message: 'Distribution creation coming soon' });
    });

    // Execute distribution (FOARTE STRICT rate limit: 1/5min)
    app.post('/distributions/execute', {
        schema: {
            tags: ['Distributions'],
            security: [{ bearerAuth: [] }],
            body: zodToJsonSchema(executeRoundSchema),
        },
        preHandler: [authenticate, requireSuperAdmin],
        config: {
            rateLimit: {
                max: 1,
                timeWindow: '5 minutes',
                errorResponseBuilder: () => ({
                    error: 'Too Many Requests',
                    message: 'Poate fi executată doar 1 distribuție la 5 minute.',
                }),
            },
        },
    }, async (request, reply) => {
        reply.code(501).send({ error: 'Not Implemented', message: 'Distribution execute coming soon' });
    });
}
