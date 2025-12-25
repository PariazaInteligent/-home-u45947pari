// Load environment variables FIRST
import './config/env.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const app = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
});

// CORS
await app.register(cors, {
    origin: (origin, cb) => {
        const allowedOrigins = ['http://localhost:3000', 'http://localhost:3002'];
        if (!origin || allowedOrigins.includes(origin)) {
            cb(null, true);
        } else {
            cb(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
});

// Rate limiting - endpoint-specific
// Nu folosim global, ci configurăm per route cu decoratori

// Login & Register: STRICT (anti brute-force)
const strictRateLimit = {
    max: 5, // 5 requests
    timeWindow: '15 minutes',
    errorResponseBuilder: () => ({
        error: 'Too Many Requests',
        message: 'Prea multe încercări. Încercați din nou peste 15 minute.',
    }),
};

// Admin endpoints: MEDIU + burst control
const adminRateLimit = {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
        error: 'Too Many Requests',
        message: 'Limită requests depășită. Așteptați 1 minut.',
    }),
};

// Distribution execute: FOARTE STRICT
const distributionExecuteLimit = {
    max: 1,
    timeWindow: '5 minutes',
    errorResponseBuilder: () => ({
        error: 'Too Many Requests',
        message: 'Poate fi executată doar 1 distribuție la 5 minute.',
    }),
};

// Wallet & Trades: MEDIU
const mediumRateLimit = {
    max: 50,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
        error: 'Too Many Requests',
        message: 'Limită requests depășită. Așteptați 1 minut.',
    }),
};

// JWT
await app.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET!,
    sign: {
        expiresIn: '15m',
    },
});

// Swagger documentation
await app.register(swagger, {
    openapi: {
        info: {
            title: 'Pariaza Inteligent API',
            description: 'Production-ready value betting platform API with double-entry ledger',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
});

await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
    },
});

// Health check
app.get('/health', async () => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'ok', database: 'connected' };
    } catch (error) {
        return { status: 'error', database: 'disconnected' };
    }
});

// Register routes
import { authRoutes } from './routes/auth.routes.js';
import { ledgerRoutes } from './routes/ledger.routes.js';
import { tradeRoutes } from './routes/trade.routes.js';
import { walletRoutes } from './routes/wallet.routes.js';
import { distributionRoutes } from './routes/distribution.routes.js';
import { publicRoutes } from './routes/public.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import invitationRoutes from './routes/invitation.routes.js';

await app.register(authRoutes);
await app.register(ledgerRoutes);
await app.register(tradeRoutes);
await app.register(walletRoutes);
await app.register(distributionRoutes);
await app.register(publicRoutes);
await app.register(adminRoutes);
await app.register(invitationRoutes);

// Graceful shutdown
const closeGracefully = async (signal: string) => {
    app.log.info(`Received signal to terminate: ${signal}`);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

export function build() {
    return app;
}

export { app, prisma };
