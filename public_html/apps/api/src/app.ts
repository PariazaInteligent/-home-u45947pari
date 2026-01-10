// Load environment variables FIRST
import './config/env.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@pariaza/database';

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

// GLOBAL ERROR HANDLER - STACKTRACE OBLIGATORIU
app.setErrorHandler((err, req, reply) => {
    console.error('==========================================');
    console.error('🔥 FASTIFY GLOBAL ERROR HANDLER TRIGGERED');
    console.error('URL:', req.method, req.url);
    console.error('ERROR:', err);
    console.error('Message:', err.message);
    console.error('Code:', (err as any).code);
    console.error('Meta:', (err as any).meta);
    console.error('Stack:', err.stack);
    console.error('==========================================');

    reply.status(500).send({
        error: err.message,
        code: (err as any).code,
        meta: (err as any).meta,
    });
});

// CORS
await app.register(cors, {
    origin: (origin, cb) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001', // Swagger UI + same-origin
            'http://localhost:3002'
        ];
        // Allow requests without Origin header (same-origin, Swagger UI, direct fetch)
        if (!origin) {
            cb(null, true);
            return;
        }
        if (allowedOrigins.includes(origin)) {
            cb(null, true);
        } else {
            // Return false instead of throwing error (avoids 500)
            cb(null, false);
        }
    },
    credentials: true,
});

// Multipart support for file uploads
import multipart from '@fastify/multipart';
await app.register(multipart, {
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    }
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
    secret: process.env.JWT_ACCESS_SECRET || 'dev_secret_key_12345',
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

// Serve static files for avatars
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await app.register(fastifyStatic, {
    root: path.join(__dirname, '../public/uploads'),
    prefix: '/uploads/',
    decorateReply: false
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
import { broadcastRoutes } from './routes/broadcast.routes.js';
import { notificationRoutes } from './routes/notification.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';
import { trackingRoutes } from './routes/tracking.routes.js';
import { maintenanceRoutes } from './routes/maintenance.routes.js';
import { broadcastHistoryRoutes } from './routes/broadcast-history.routes.js';
import { scheduledBroadcastRoutes } from './routes/scheduled-broadcast.routes.js';
import { migrationRoutes } from './routes/migration.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
import userRoutes from './routes/user.routes.js';
import paymentMethodRoutes from './routes/payment-method.routes.js';
import { dailyReportsTestRoutes } from './routes/daily-reports-test.routes.js';

await app.register(authRoutes);
await app.register(ledgerRoutes);
await app.register(tradeRoutes);
await app.register(walletRoutes);
await app.register(distributionRoutes);
await app.register(publicRoutes);
await app.register(adminRoutes);
await app.register(broadcastRoutes);  // Broadcast email system
await app.register(notificationRoutes); // Broadcast notifications
await app.register(analyticsRoutes); // Analytics & insights
await app.register(trackingRoutes); // Open/click tracking (NO AUTH - public pixels/redirects)
await app.register(maintenanceRoutes); // Admin maintenance operations
await app.register(broadcastHistoryRoutes); // Broadcast history & transparency
await app.register(migrationRoutes); // Migration utilities
// await app.register(scheduledBroadcastRoutes); // Scheduled broadcasts (Sprint 3) - DISABLED: routes moved to broadcast.routes.ts
await app.register(invitationRoutes);
await app.register(userRoutes, { prefix: '/api/users' });
await app.register(paymentMethodRoutes, { prefix: '/api/payment-methods' });
await app.register(dailyReportsTestRoutes); // Daily reports testing endpoints

// === CRON JOBS ===
import cron from 'node-cron';
import { DailySnapshotService } from './services/daily-snapshot.service.js';
import { initBroadcastCronJobs } from './jobs/broadcast-check.job.js';

// Daily Snapshot + Streak Update (00:05 AM)
cron.schedule('5 0 * * *', async () => {
    app.log.info('[Cron] Running daily snapshot job...');
    try {
        const snapshotService = new DailySnapshotService();
        await snapshotService.createDailySnapshot();
        app.log.info('[Cron] Daily snapshot completed successfully');
    } catch (error) {
        app.log.error('[Cron] Daily snapshot failed:', error);
    }
});

app.log.info('[Cron] Scheduled daily snapshot job for 00:05 AM');

// Initialize Broadcast Opportunity Cron Jobs
initBroadcastCronJobs();

// Initialize Daily Reports Cron Job
import { initDailyReportsJob } from './jobs/daily-reports.job.js';
initDailyReportsJob();

// Initialize Scheduled Broadcast Scheduler (Sprint 3)
import { startBroadcastScheduler } from './scheduler/broadcast-scheduler.js';
startBroadcastScheduler();

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
