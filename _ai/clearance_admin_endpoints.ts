/**
 * Admin Routes - Clearance Level Management Endpoints
 * To be added to existing admin.routes.ts
 */

// Add these imports at the top:
import { ClearanceService } from '../services/clearance.service.js';

// Add these routes inside adminRoutes function:

// === CLEARANCE LEVEL MANAGEMENT ===

// GET All Clearance Configs
app.get('/admin/clearance/config', {
    preHandler: [authenticate, requireAdmin]
}, async (request, reply) => {
    const clearanceService = new ClearanceService();
    const configs = await clearanceService.getAllConfigs();
    reply.send({ success: true, configs });
});

// GET Single Clearance Config
app.get('/admin/clearance/config/:level', {
    preHandler: [authenticate, requireAdmin]
}, async (request, reply) => {
    const { level } = request.params as { level: string };
    const clearanceService = new ClearanceService();
    const config = await clearanceService.getConfig(Number(level));

    if (!config) {
        return reply.code(404).send({ error: 'Config not found' });
    }

    reply.send({ success: true, config });
});

// PATCH Update Clearance Config
app.patch('/admin/clearance/config/:level', {
    preHandler: [authenticate, requireAdmin]
}, async (request, reply) => {
    const { level } = request.params as { level: string };
    const updates = request.body as any;

    const clearanceService = new ClearanceService();
    const config = await clearanceService.updateConfig(Number(level), updates);

    // Audit log
    await prisma.auditLog.create({
        data: {
            userId: (request.user as any).id,
            action: 'CLEARANCE_CONFIG_UPDATE',
            metadata: JSON.stringify({ level, updates }),
            ipAddress: request.ip
        }
    });

    reply.send({ success: true, config, message: 'Config updated successfully' });
});

// POST Recalculate User Clearance
app.post('/admin/users/:id/clearance/recalculate', {
    preHandler: [authenticate, requireAdmin]
}, async (request, reply) => {
    const { id } = request.params as { id: string };

    const clearanceService = new ClearanceService();
    const result = await clearanceService.updateUserClearance(id, 'ADMIN_MANUAL_TRIGGER');

    reply.send({
        success: true,
        ...result,
        message: result.changed
            ? `Clearance level updated: ${result.oldLevel} → ${result.newLevel}`
            : 'No change needed - user already at correct level'
    });
});
