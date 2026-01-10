import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../app.js';
import type { FastifyInstance } from 'fastify';
import { prisma } from '@pariaza/database';
import bcrypt from 'bcryptjs';

/**
 * Integration Test: /api/users/me Graceful Degradation
 * 
 * Tests the robust error handling when INVESTOR_ID_SECRET is missing.
 * The endpoint should:
 * - Return 200 OK (not 500)
 * - Set investorIdHash to null
 * - Include configWarning for admin users
 * - Hide configWarning from non-admin users
 */
describe('User Profile Robustness Tests', () => {
    let testApp: FastifyInstance;
    let adminToken: string;
    let investorToken: string;
    let adminId: string;
    let investorId: string;
    const originalSecret = process.env.INVESTOR_ID_SECRET;

    beforeAll(async () => {
        testApp = app;
        await testApp.ready();

        // Create test admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await prisma.user.create({
            data: {
                email: `admin-test-${Date.now()}@example.com`,
                password: adminPassword,
                name: 'Test Admin',
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });
        adminId = admin.id;

        // Create test investor user
        const investorPassword = await bcrypt.hash('investor123', 10);
        const investor = await prisma.user.create({
            data: {
                email: `investor-test-${Date.now()}@example.com`,
                password: investorPassword,
                name: 'Test Investor',
                role: 'INVESTOR',
                status: 'ACTIVE',
            },
        });
        investorId = investor.id;

        // Get admin token
        adminToken = testApp.jwt.sign({
            id: adminId,
            email: admin.email,
            role: 'ADMIN',
        });

        // Get investor token
        investorToken = testApp.jwt.sign({
            id: investorId,
            email: investor.email,
            role: 'INVESTOR',
        });
    });

    afterAll(async () => {
        // Restore original secret
        if (originalSecret) {
            process.env.INVESTOR_ID_SECRET = originalSecret;
        } else {
            delete process.env.INVESTOR_ID_SECRET;
        }

        // Cleanup test users
        await prisma.user.deleteMany({
            where: {
                id: { in: [adminId, investorId] },
            },
        }).catch(() => {
            // Ignore cleanup errors
        });
    });

    it('should return 200 OK when INVESTOR_ID_SECRET is missing', async () => {
        // Temporarily remove the secret to simulate missing config
        delete process.env.INVESTOR_ID_SECRET;

        const response = await testApp.inject({
            method: 'GET',
            url: '/api/users/me',
            headers: {
                authorization: `Bearer ${adminToken}`,
            },
        });

        // CRITICAL: Must return 200 OK, not 500
        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.user).toBeDefined();
    });

    it('should set investorIdHash to null when INVESTOR_ID_SECRET is missing', async () => {
        // Temporarily remove the secret
        delete process.env.INVESTOR_ID_SECRET;

        const response = await testApp.inject({
            method: 'GET',
            url: '/api/users/me',
            headers: {
                authorization: `Bearer ${adminToken}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);
        expect(body.user.investorIdHash).toBeNull();
    });

    it('should include configWarning for ADMIN users when INVESTOR_ID_SECRET is missing', async () => {
        // Temporarily remove the secret
        delete process.env.INVESTOR_ID_SECRET;

        const response = await testApp.inject({
            method: 'GET',
            url: '/api/users/me',
            headers: {
                authorization: `Bearer ${adminToken}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);
        expect(body.user.configWarning).toBeDefined();
        expect(body.user.configWarning).toContain('Security configuration missing');
    });

    it('should hide configWarning for INVESTOR users when INVESTOR_ID_SECRET is missing', async () => {
        // Temporarily remove the secret
        delete process.env.INVESTOR_ID_SECRET;

        const response = await testApp.inject({
            method: 'GET',
            url: '/api/users/me',
            headers: {
                authorization: `Bearer ${investorToken}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);
        // configWarning should NOT be present for non-admin users
        expect(body.user.configWarning).toBeUndefined();
        // But investorIdHash should still be null
        expect(body.user.investorIdHash).toBeNull();
    });

    it('should generate valid investorIdHash when INVESTOR_ID_SECRET is present', async () => {
        // Restore the secret
        process.env.INVESTOR_ID_SECRET = originalSecret || 'test-secret-for-integration';

        const response = await testApp.inject({
            method: 'GET',
            url: '/api/users/me',
            headers: {
                authorization: `Bearer ${adminToken}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);
        // Should have a valid hash when secret is present
        expect(body.user.investorIdHash).toBeDefined();
        expect(body.user.investorIdHash).not.toBeNull();
        expect(typeof body.user.investorIdHash).toBe('string');
        expect(body.user.investorIdHash.length).toBe(64); // SHA256 hex digest is 64 chars
        // No warning when secret is present
        expect(body.user.configWarning).toBeUndefined();
    });

    it('should return all profile fields correctly even with graceful degradation', async () => {
        // Remove secret to test graceful degradation
        delete process.env.INVESTOR_ID_SECRET;

        const response = await testApp.inject({
            method: 'GET',
            url: '/api/users/me',
            headers: {
                authorization: `Bearer ${investorToken}`,
            },
        });

        expect(response.statusCode).toBe(200);

        const body = JSON.parse(response.body);

        // Verify all expected fields are present despite graceful degradation
        expect(body.user.id).toBe(investorId);
        expect(body.user.email).toContain('investor-test');
        expect(body.user.name).toBe('Test Investor');
        expect(body.user.role).toBe('INVESTOR');
        expect(body.stats).toBeDefined();
        expect(body.league).toBeDefined();
        expect(body.loyalty).toBeDefined();
        expect(body.paymentMethods).toBeDefined();
        expect(body.activity).toBeDefined();
    });
});
