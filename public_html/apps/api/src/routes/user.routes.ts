import { FastifyInstance } from 'fastify';
import { prisma, users_status as UserStatus, DepositStatus, WithdrawalStatus } from '@pariaza/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { handleAvatarUpload } from '../middleware/upload.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { emailService } from '../services/email.service.js';

export default async function userRoutes(fastify: FastifyInstance) {

    // GET /api/users/me - Full profile payload
    fastify.get('/me', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        const userId = (request.user as any).id;

        // Fetch user with all gamification fields
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                gender: true,
                avatarType: true,
                avatarUrl: true,
                streakDays: true,
                loyaltyPoints: true,
                tier: true,
                clearanceLevel: true,
                lastCheckinAt: true,
                preferences: true,
                twoFAEnabled: true, // ⭐ 2FA status for frontend
                biometricEnabled: true, // ⭐ Biometric status for frontend
            },
        });

        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }

        // Calculate avatarFinalUrl
        let avatarFinalUrl: string;
        if (user.avatarType === 'CUSTOM' && user.avatarUrl) {
            // Custom avatar with cache bust
            avatarFinalUrl = `http://localhost:3001${user.avatarUrl}?t=${Date.now()}`;
        } else {
            // Default avatar based on gender
            const gender = user.gender || 'NEUTRAL';
            if (gender === 'MALE') {
                avatarFinalUrl = 'http://localhost:3000/avatars/default-male.png';
            } else if (gender === 'FEMALE') {
                avatarFinalUrl = 'http://localhost:3000/avatars/default-female.png';
            } else {
                avatarFinalUrl = 'http://localhost:3000/avatars/default-neutral.png';
            }
        }

        // Fetch payout methods
        // Fetch payment methods
        const paymentMethods = await prisma.paymentMethod.findMany({
            where: { userId },
            select: {
                id: true,
                type: true,
                label: true,
                holderName: true,
                detailsMasked: true,
                currency: true,
                country: true,
                isDefault: true,
                verifiedAt: true,
            },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        // Calculate stats
        // 1. Total sessions
        const totalSessions = await prisma.session.count({
            where: { userId }
        });

        // 2. NAV/SHARES-BASED CALCULATIONS (Correct Logic)
        // Import UnitsService
        const { unitsService } = await import('../services/units.service.js');
        const { Decimal } = await import('decimal.js');

        // Get user's shares and current value
        const userUnits = await unitsService.getInvestorUnits(userId);

        // Principal invested = sum of all deposit amounts (what user actually put in)
        const userDeposits = await prisma.deposit.findMany({
            where: { userId, status: DepositStatus.APPROVED },
            select: { amount: true }
        });
        const principalInvested = userDeposits.reduce(
            (sum, d) => sum + Number(d.amount),
            0
        );

        // Current value = shares × NAV (from UnitsService)
        const currentValue = Number(userUnits.value);

        // Profit generated = current value - principal
        const profitGenerated = currentValue - principalInvested;

        // Get total shares outstanding for sharePercent calculation
        const allDeposits = await prisma.deposit.findMany({
            where: { status: DepositStatus.APPROVED },
            select: { unitsIssued: true }
        });
        const allWithdrawals = await prisma.withdrawal.findMany({
            where: { status: { in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] } },
            select: { unitsBurned: true }
        });
        const totalSharesIssued = allDeposits.reduce(
            (sum, d) => sum.add(d.unitsIssued || 0),
            new Decimal(0)
        );
        const totalSharesBurned = allWithdrawals.reduce(
            (sum, w) => sum.add(w.unitsBurned || 0),
            new Decimal(0)
        );
        const totalShares = totalSharesIssued.sub(totalSharesBurned);

        // Share percent (shares-based, NOT money-based) - 4 decimal precision
        const sharePercentExact = totalShares.gt(0)
            ? Number(userUnits.unitsBalance.div(totalShares).mul(100))
            : 0;

        // Net return percent = (profit / principal) × 100
        const netReturnPercent = principalInvested > 0
            ? (profitGenerated / principalInvested) * 100
            : 0;

        // 3. Total fund value - NAV-BASED (Correct: NAV × totalShares)
        // This ensures: currentValue = totalFundValue × sharePercent
        const currentNAV = await unitsService.calculateNAV();
        const totalFundValue = Number(totalShares.mul(currentNAV));

        // DEPRECATED: Old calculation for backwards compatibility (DO NOT USE FOR LOGIC)
        const userDepositsSum = principalInvested; // Keep same value
        const userWithdrawalsAgg = await prisma.withdrawal.aggregate({
            where: { userId, status: WithdrawalStatus.APPROVED },
            _sum: { amountPayout: true }
        });
        const userWithdrawalsSum = Number(userWithdrawalsAgg._sum?.amountPayout ?? 0);
        const investmentValue = userDepositsSum - userWithdrawalsSum; // DEPRECATED
        const sharePercent = sharePercentExact; // Use new calculation

        // 6. Check if checked in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCheckedIn = user.lastCheckinAt ?
            new Date(user.lastCheckinAt).setHours(0, 0, 0, 0) === today.getTime() :
            false;

        // 7. League info based on tier - USE CACHE SERVICE
        const tierValue = user.tier || 'ENTRY';

        // Get language from Accept-Language header (fallback to 'ro')
        const acceptLang = request.headers['accept-language'];
        const userLang = acceptLang?.split(',')[0]?.substring(0, 2) || 'ro';

        // Import cache service
        const { getTierCacheService } = await import('../services/tier-cache.service');
        const tierCacheService = getTierCacheService(prisma);

        // Get tier from cache (or DB if cache miss)
        const cachedTier = await tierCacheService.getTier(tierValue, userLang);

        const leagueInfo = cachedTier ? {
            code: cachedTier.tierCode,
            name: cachedTier.tierName,
            feeDiscountPercent: cachedTier.feeDiscountPct,
            benefitsUrl: `/benefits/${cachedTier.tierCode.toLowerCase()}`,
            iconEmoji: cachedTier.iconEmoji,
            thresholds: cachedTier.thresholds,
            benefits: cachedTier.benefits,
            version: cachedTier.version
        } : {
            // Fallback if tier not found
            code: 'ENTRY',
            name: 'Entry League',
            feeDiscountPercent: 0,
            benefitsUrl: '/benefits/entry',
            iconEmoji: '🌱',
            thresholds: { minInvestment: 0, minStreak: 0, minLoyalty: 0 },
            benefits: [],
            version: 1
        };
        const lang = request.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'ro';
        const leagueTier = await tierCacheService.getTier(user.tier, lang);

        // Get loyalty breakdown
        const { LoyaltyService } = await import('../services/loyalty.service.js');
        const loyaltyService = new LoyaltyService();
        const loyaltyBreakdown = await loyaltyService.getUserLoyaltyBreakdown(user.id);

        // Security: ID Hash (HMAC-SHA256)
        // Security: ID Hash (HMAC-SHA256)
        const secret = process.env.INVESTOR_ID_SECRET;
        let investorIdHash: string | null = null;
        let configWarning: string | null = null;

        try {
            if (secret) {
                investorIdHash = crypto.createHmac('sha256', secret)
                    .update(user.id)
                    .digest('hex');
            } else {
                // Robustness: Log distinct warning server-side, do NOT crash endpoint
                fastify.log.warn('[SECURITY WARNING] INVESTOR_ID_SECRET is missing. ID Hash disabled.');
                configWarning = 'Security configuration missing (ID Hash). Report to admin.';
            }
        } catch (err) {
            fastify.log.error('[SECURITY ERROR] Failed to generate ID Hash:', err);
            configWarning = 'Security error during hash generation.';
            investorIdHash = null; // Ensure it's null
        }

        // Stats: Member Since & Total Days
        const now = new Date();
        const createdAt = new Date(user.createdAt);
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const monthNames = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
            "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];
        const memberSinceLabel = `${monthNames[createdAt.getMonth()]} ${createdAt.getFullYear()}`;

        return reply.send({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                gender: user.gender,
                role: user.role,
                status: user.status,
                avatarType: user.avatarType || 'DEFAULT',
                avatarUrl: user.avatarUrl,
                avatarFinalUrl,
                joinedAt: user.createdAt,
                updatedAt: user.updatedAt,
                streakDays: user.streakDays || 0,
                loyaltyPoints: user.loyaltyPoints || 0,
                tier: tierValue,
                clearanceLevel: user.clearanceLevel || 1,
                lastCheckinAt: user.lastCheckinAt,
                twoFAEnabled: user.twoFAEnabled || false, // ⭐ 2FA status
                biometricEnabled: user.biometricEnabled || false, // ⭐ Biometric status
                // NEW FIELDS
                investorIdHash,
                // Only show configWarning to admins (security: hide internal errors from regular users)
                ...(user.role === 'ADMIN' && configWarning && { configWarning }),
                memberSinceLabel,
                totalDays,
                preferences: (user as any).preferences || {
                    emailNotifications: true,
                    dailyReports: true,
                    uiSounds: true
                }
            },

            stats: {
                // NEW: NAV/Shares-based fields (USE THESE)
                principalInvested: Number(principalInvested.toFixed(2)),
                profitGenerated: Number(profitGenerated.toFixed(2)),
                currentValue: Number(currentValue.toFixed(2)),
                sharePercentExact: Number(sharePercentExact.toFixed(4)),
                netReturnPercent: Number(netReturnPercent.toFixed(2)),
                totalFundValue: Number(totalFundValue.toFixed(2)),
                totalSessions,

                // DEPRECATED (kept for backwards compatibility, DO NOT USE)
                investmentValue: Number(investmentValue.toFixed(2)), // DEPRECATED: use currentValue instead
                sharePercent: Number(sharePercent.toFixed(4)), // DEPRECATED: use sharePercentExact instead
            },
            league: {
                code: leagueTier?.tierCode || user.tier,
                name: leagueTier?.tierName || 'Entry League',
                feeDiscountPercent: leagueTier?.feeDiscountPct || 0,
                benefits: leagueTier?.benefits || [],
                version: leagueTier?.version || 1,
                iconEmoji: leagueTier?.iconEmoji || '🌱',
                benefitsUrl: leagueTier?.tierCode ? `/benefits/${leagueTier.tierCode.toLowerCase()}` : '/benefits/entry',
                thresholds: leagueTier?.thresholds || { minInvestment: 0, minStreak: 0, minLoyalty: 0 }
            },
            loyalty: {
                total: user.loyaltyPoints,
                breakdown: loyaltyBreakdown
            },
            paymentMethods: paymentMethods.map(pm => ({
                id: pm.id,
                type: pm.type,
                label: pm.label,
                holderName: pm.holderName,
                detailsMasked: pm.detailsMasked,
                currency: pm.currency,
                country: pm.country,
                isDefault: pm.isDefault,
                isVerified: !!pm.verifiedAt, // map VerifiedAt to boolean for frontend convenience if needed, otherwise just pass date or boolean
            })),
            activity: {
                todayCheckedIn,
                nextGoalText: todayCheckedIn ?
                    'Revino mâine pentru +10 puncte' :
                    'Verifică randamentul pentru +10 puncte'
            },
            // DEBUG: Only in dev (set DEBUG_PROFILE=1 in env)
            ...(process.env.DEBUG_PROFILE === '1' && {
                debug: {
                    fundCalcSource: 'ALIGNED_APPROVED_WITHDRAWALS',
                    // approvedDepositsSum: allDepositsSum,
                    // approvedWithdrawalsSum: allWithdrawalsSum,
                    // tradingProfit,
                    totalFundValue,
                    userDepositsSum,
                    userWithdrawalsSum,
                    investmentValue,
                    sharePercent,
                    calculatedInvestmentValue: Number((totalFundValue * sharePercent / 100).toFixed(2)),
                    note: 'Fund = Deposits(APPROVED) - Withdrawals(APPROVED) + TradingProfit - ALIGNED with investmentValue'
                }
            })
        });
    });

    // POST /api/users/avatar - Upload avatar
    fastify.post('/avatar', {
        preHandler: [authenticate]
    }, handleAvatarUpload);

    // DELETE /api/users/avatar - Reset to default avatar
    fastify.delete('/avatar', {
        preHandler: [authenticate]
    }, async (request: any, reply) => {
        try {
            const userId = request.user.id;

            // Get current avatar
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { avatarUrl: true }
            });

            if (user?.avatarUrl) {
                // Delete file
                const filename = user.avatarUrl.split('/').pop();
                if (filename) {
                    const filePath = path.join(process.cwd(), 'public', 'uploads', 'avatars', filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            }

            // Reset to DEFAULT avatar type
            await prisma.user.update({
                where: { id: userId },
                data: {
                    avatarType: 'DEFAULT',
                    avatarUrl: null
                }
            });

            return reply.send({
                success: true,
                message: 'Avatar resetat la default'
            });
        } catch (error) {
            fastify.log.error('Error removing avatar:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    // POST /api/profile/checkin - Scalable & Idempotent Check-in
    fastify.post('/profile/checkin', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const now = new Date();
            const today = new Date(now);
            today.setHours(0, 0, 0, 0); // Normalize to midnight

            // Transaction: CheckIn(Unique) + UserUpdate + Audit
            try {
                const result = await prisma.$transaction(async (tx) => {
                    // 1. Create CheckIn (Will throw P2002 if already checked in today)
                    await tx.checkIn.create({
                        data: {
                            userId,
                            date: today
                        }
                    });

                    // 2. Fetch current user data for streak calc
                    const user = await tx.user.findUniqueOrThrow({
                        where: { id: userId },
                        select: { streakDays: true, lastCheckinAt: true, loyaltyPoints: true }
                    });

                    // 3. Calculate Streak
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    let lastCheckinDate: Date | null = user.lastCheckinAt ? new Date(user.lastCheckinAt) : null;
                    if (lastCheckinDate) lastCheckinDate.setHours(0, 0, 0, 0);

                    let newStreakDays = user.streakDays || 0;
                    // If checked in yesterday, increment. Else reset to 1.
                    if (lastCheckinDate && lastCheckinDate.getTime() === yesterday.getTime()) {
                        newStreakDays++;
                    } else {
                        newStreakDays = 1;
                    }

                    // 4. Update User (Streak + Points + LastCheckin)
                    const pointsAwarded = 10;
                    const updatedUser = await tx.user.update({
                        where: { id: userId },
                        data: {
                            streakDays: newStreakDays,
                            lastCheckinAt: now,
                            loyaltyPoints: { increment: pointsAwarded }
                        },
                        select: { streakDays: true, loyaltyPoints: true }
                    });

                    // 5. Audit Log
                    await tx.auditLog.create({
                        data: {
                            userId,
                            action: 'CHECKIN',
                            metadata: JSON.stringify({
                                streak: newStreakDays,
                                points: pointsAwarded,
                                date: today.toISOString()
                            }),
                            resourceType: 'user',
                            resourceId: userId
                        }
                    });

                    return {
                        streakDays: updatedUser.streakDays,
                        loyaltyPoints: updatedUser.loyaltyPoints,
                        pointsAwarded,
                        message: `Check-in reușit! +${pointsAwarded} Puncte. Streak: ${newStreakDays} zile.`
                    };
                });

                // Transaction Success
                return reply.send({
                    success: true,
                    alreadyCheckedIn: false,
                    streakDays: result.streakDays,
                    loyaltyPoints: result.loyaltyPoints,
                    pointsAwarded: result.pointsAwarded,
                    message: result.message
                });

            } catch (err: any) {
                // Handle Unique Constraint Violation (P2002) - Idempotent Success
                if (err.code === 'P2002') {
                    // Fetch latest data to return accurate state even if no update happened
                    const currentUser = await prisma.user.findUnique({
                        where: { id: userId },
                        select: { streakDays: true, loyaltyPoints: true }
                    });

                    return reply.send({
                        success: true,
                        alreadyCheckedIn: true, // Frontend knows to disable button
                        streakDays: currentUser?.streakDays || 0,
                        loyaltyPoints: currentUser?.loyaltyPoints || 0,
                        pointsAwarded: 0,
                        message: 'Ai verificat deja randamentul astăzi! Revino mâine.'
                    });
                }

                // Other errors
                throw err;
            }

        } catch (error) {
            fastify.log.error(`[CHECKIN ERROR] User ${(request as any).user?.id}:`, error);
            return reply.code(500).send({ error: 'Check-in failed. Please try again.' });
        }
    });

    // GET /api/users/preferences - Get user preferences
    fastify.get('/preferences', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;

            let prefs = await prisma.userPreference.findUnique({
                where: { userId }
            });

            // Create default if missing
            if (!prefs) {
                prefs = await prisma.userPreference.create({
                    data: { userId }
                });
            }

            return reply.send({ success: true, preferences: prefs });
        } catch (error) {
            fastify.log.error('Error fetching preferences:', error);
            return reply.code(500).send({ error: 'Failed to fetch preferences' });
        }
    });

    // PATCH /api/users/preferences - Update user preferences
    fastify.patch('/preferences', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any; // Validation normally via schema

            // Allow specific fields only
            const updateData: any = {};
            if (typeof body.emailNotifications === 'boolean') updateData.emailNotifications = body.emailNotifications;
            if (typeof body.dailyReports === 'boolean') updateData.dailyReports = body.dailyReports;
            if (typeof body.uiSounds === 'boolean') updateData.uiSounds = body.uiSounds;

            if (Object.keys(updateData).length === 0) {
                return reply.code(400).send({ error: 'No valid fields to update' });
            }

            const updatedPrefs = await prisma.userPreference.upsert({
                where: { userId },
                create: { userId, ...updateData },
                update: updateData
            });

            // Audit
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'UPDATE_PREFERENCES',
                    metadata: JSON.stringify(updateData),
                    resourceType: 'user_preference',
                    resourceId: updatedPrefs.id
                }
            });

            return reply.send({ success: true, preferences: updatedPrefs });

        } catch (error) {
            fastify.log.error('Error updating preferences:', error);
            return reply.code(500).send({ error: 'Failed to update preferences' });
        }
    });

    // GET /api/users/password-stats - Get password change statistics
    fastify.get('/password-stats', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;

            // 1. Query audit_logs pentru ultimul PASSWORD_CHANGED
            const lastPasswordChange = await prisma.auditLog.findFirst({
                where: {
                    userId,
                    action: 'PASSWORD_CHANGED'
                },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            });

            let lastChangeDate: Date;
            if (lastPasswordChange) {
                lastChangeDate = lastPasswordChange.createdAt;
            } else {
                // Fallback: users.updatedAt (prima setare parolă)
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { updatedAt: true }
                });
                lastChangeDate = user?.updatedAt || new Date();
            }

            // 2. Calculate days since change (FLOOR pentru zile COMPLETE doar!)
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - lastChangeDate.getTime());
            const daysSinceChange = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // 3. Determine color code
            let colorCode: string;
            if (daysSinceChange < 30) {
                colorCode = 'green';
            } else if (daysSinceChange < 60) {
                colorCode = 'yellow';
            } else if (daysSinceChange < 90) {
                colorCode = 'orange';
            } else {
                colorCode = 'red';
            }

            return reply.send({
                success: true,
                lastPasswordChangeDate: lastChangeDate.toISOString(),
                daysSinceChange,
                colorCode
            });

        } catch (error) {
            fastify.log.error('Error fetching password stats:', error);
            return reply.code(500).send({ error: 'Failed to fetch password stats' });
        }
    });

    // POST /api/users/change-password - Change user password
    fastify.post('/change-password', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;

            // 1. Validate request
            const { currentPassword, newPassword } = body;

            if (!currentPassword || !newPassword) {
                return reply.code(400).send({ error: 'Current password and new password are required' });
            }

            // 2. Validate new password strength
            if (newPassword.length < 8) {
                return reply.code(400).send({ error: 'Parola nouă trebuie să aibă minim 8 caractere' });
            }

            if (!/[A-Z]/.test(newPassword)) {
                return reply.code(400).send({ error: 'Parola nouă trebuie să conțină cel puțin o majusculă' });
            }

            if (!/[a-z]/.test(newPassword)) {
                return reply.code(400).send({ error: 'Parola nouă trebuie să conțină cel puțin o minusculă' });
            }

            if (!/[0-9]/.test(newPassword)) {
                return reply.code(400).send({ error: 'Parola nouă trebuie să conțină cel puțin un număr' });
            }

            // 3. Check if new password is different from current
            if (currentPassword === newPassword) {
                return reply.code(400).send({ error: 'Parola nouă trebuie să fie diferită de cea curentă' });
            }

            // 4. Get user and verify current password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, password: true }
            });

            if (!user || !user.password) {
                return reply.code(404).send({ error: 'User not found or password not set' });
            }

            // 5. Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return reply.code(400).send({ error: 'Parola curentă este incorectă' });
            }

            // 6. Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // 7. Update password in DB + Create audit log (transaction)
            await prisma.$transaction(async (tx) => {
                // Update user password
                await tx.user.update({
                    where: { id: userId },
                    data: { password: hashedPassword }
                });

                // Create audit log
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: 'PASSWORD_CHANGED',
                        ipAddress: (request as any).ip || null,
                        userAgent: request.headers['user-agent'] || null,
                        metadata: JSON.stringify({
                            timestamp: new Date().toISOString()
                        }),
                        resourceType: 'user',
                        resourceId: userId
                    }
                });
            });

            return reply.send({
                success: true,
                message: 'Parola a fost schimbată cu succes',
                lastChangeDate: new Date().toISOString()
            });

        } catch (error) {
            fastify.log.error('Error changing password:', error);
            return reply.code(500).send({ error: 'Failed to change password' });
        }
    });

    // ============================================================================
    // 2FA (Two-Factor Authentication) ENDPOINTS
    // ============================================================================

    /**
     * POST /api/users/2fa/enable-request
     * Generate TOTP secret + QR code (does NOT save to DB yet)
     */
    fastify.post('/2fa/enable-request', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;

            // 1. Validate current password
            const { currentPassword } = body;

            if (!currentPassword) {
                return reply.code(400).send({ error: 'Current password is required' });
            }

            // 2. Get user and verify password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, name: true, password: true, twoFAEnabled: true }
            });

            if (!user || !user.password) {
                return reply.code(404).send({ error: 'User not found' });
            }

            // 3. Check if 2FA already enabled
            if (user.twoFAEnabled) {
                return reply.code(400).send({
                    error: '2FA este deja activată',
                    message: 'Pentru a reseta 2FA, dezactivează mai întâi setarea curentă.'
                });
            }

            // 4. Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return reply.code(400).send({ error: 'Parola curentă este incorectă' });
            }

            // 5. Generate TOTP secret
            const secret = speakeasy.generateSecret({
                name: `Pariaza Inteligent (${user.email})`,
                issuer: 'Pariaza Inteligent',
                length: 32
            });

            // 6. Generate QR code as data URL
            const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

            // 7. Store secret temporarily in session/cache (for 10 minutes)
            // For simplicity, we'll return it and expect frontend to send it back
            // In production, use Redis or session storage

            return reply.send({
                success: true,
                qrCodeDataUrl,
                manualSecret: secret.base32,
                message: 'Scanează QR code cu Google Authenticator'
            });

        } catch (error) {
            fastify.log.error('Error enabling 2FA (request):', error);
            return reply.code(500).send({ error: 'Failed to generate 2FA setup' });
        }
    });

    /**
     * POST /api/users/2fa/enable-confirm
     * Verify TOTP code + save secret to DB + enable 2FA + generate backup codes
     */
    fastify.post('/2fa/enable-confirm', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;

            const { totpCode, secret } = body;

            // 1. Validate inputs
            if (!totpCode || !secret) {
                return reply.code(400).send({ error: 'TOTP code and secret are required' });
            }

            if (totpCode.length !== 6 || !/^\d{6}$/.test(totpCode)) {
                return reply.code(400).send({ error: 'Codul trebuie să aibă 6 cifre' });
            }

            // 2. Verify TOTP code
            console.log('[2FA CONFIRM] Validating TOTP:', {
                totpCodeLength: totpCode.length,
                totpCode: totpCode,
                secretLength: secret.length,
                secretPreview: secret.substring(0, 10) + '...',
                userId
            });

            let isValidCode = false;
            try {
                isValidCode = speakeasy.totp.verify({
                    secret,
                    encoding: 'base32',
                    token: totpCode,
                    window: 6 // Accept codes ±180 seconds (3 minutes) for time drift
                });
                console.log('[2FA CONFIRM] TOTP validation SUCCESS:', { isValidCode });
            } catch (verifyError: any) {
                console.error('[2FA CONFIRM] Speakeasy error:', verifyError.message);
                return reply.code(500).send({ error: 'Eroare validare TOTP', message: String(verifyError.message) });
            }

            if (!isValidCode) {
                // Generate current expected code for debugging
                const expectedCode = speakeasy.totp({
                    secret,
                    encoding: 'base32'
                });

                console.warn('[2FA CONFIRM] Invalid TOTP code:', {
                    providedCode: totpCode,
                    expectedCode: expectedCode,
                    timeDrift: 'Check if server/client time is in sync'
                });

                return reply.code(400).send({
                    error: 'Cod invalid',
                    message: 'Codul introdus este incorect. Verifică aplicația Google Authenticator și încearcă din nou.'
                });
            }

            console.log('[2FA CONFIRM] TOTP validated successfully, proceeding to backup codes generation...');

            // 3. Generate 10 backup codes
            const backupCodes: string[] = [];
            const backupCodeHashes: string[] = [];

            for (let i = 0; i < 10; i++) {
                // Generate random 12-char hex code
                const code = crypto.randomBytes(6).toString('hex').toUpperCase();
                const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
                backupCodes.push(formatted);

                // Hash for DB storage
                const codeHash = await bcrypt.hash(formatted, 10);
                backupCodeHashes.push(codeHash);
            }

            console.log('[2FA CONFIRM] Generated', backupCodes.length, 'backup codes, starting DB transaction...');

            // 4. Save to DB in transaction (2FA secret + backup codes)
            await prisma.$transaction(async (tx) => {
                // Enable 2FA and save secret
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        twoFAEnabled: true,
                        twoFASecret: secret
                    }
                });

                // Save backup codes
                for (const codeHash of backupCodeHashes) {
                    await tx.backupCode.create({
                        data: {
                            userId,
                            codeHash
                        }
                    });
                }

                // Audit log
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: '2FA_ENABLED',
                        metadata: JSON.stringify({
                            timestamp: new Date().toISOString(),
                            backupCodesGenerated: 10
                        }),
                        resourceType: 'user',
                        resourceId: userId
                    }
                });

                console.log('[2FA CONFIRM] DB transaction completed successfully, proceeding to email...');
            });

            // 5. Send email with backup codes
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { email: true, name: true }
                });

                if (user) {
                    const { emailService } = await import('../services/email.service.js');
                    await emailService.send2FAEnabledEmail(user, backupCodes);
                }
            } catch (emailError) {
                fastify.log.error('Failed to send 2FA enabled email:', emailError);
                // Don't fail the request if email fails
            }

            return reply.send({
                success: true,
                backupCodes, // Return to frontend for immediate display
                message: '2FA activată cu succes! Salvează codurile backup într-un loc sigur.'
            });

        } catch (error: any) {
            console.error('[2FA CONFIRM] CRITICAL ERROR:', error);
            console.error('[2FA CONFIRM] Error message:', error.message);
            console.error('[2FA CONFIRM] Error stack:', error.stack);
            return reply.code(500).send({ error: 'Failed to enable 2FA', details: error.message });
        }
    });

    /**
     * POST /api/users/2fa/disable
     * Disable 2FA + delete secret + delete backup codes
     */
    fastify.post('/2fa/disable', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;

            const { currentPassword } = body;

            // 1. Validate password
            if (!currentPassword) {
                return reply.code(400).send({ error: 'Current password is required' });
            }

            // 2. Get user and verify password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true, twoFAEnabled: true, email: true, name: true }
            });

            if (!user || !user.password) {
                return reply.code(404).send({ error: 'User not found' });
            }

            if (!user.twoFAEnabled) {
                return reply.code(400).send({ error: '2FA nu este activată' });
            }

            // 3. Verify password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return reply.code(400).send({ error: 'Parola curentă este incorectă' });
            }

            // 4. Disable 2FA and delete backup codes (transaction)
            await prisma.$transaction(async (tx) => {
                // Disable 2FA
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        twoFAEnabled: false,
                        twoFASecret: null
                    }
                });

                // Delete all backup codes
                await tx.backupCode.deleteMany({
                    where: { userId }
                });

                // Audit log
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: '2FA_DISABLED',
                        metadata: JSON.stringify({
                            timestamp: new Date().toISOString()
                        }),
                        resourceType: 'user',
                        resourceId: userId
                    }
                });
            });

            // 5. Send confirmation email
            try {
                const { emailService } = await import('../services/email.service.js');
                await emailService.send2FADisabledEmail({ email: user.email, name: user.name || user.email });
            } catch (emailError) {
                fastify.log.error('Failed to send 2FA disabled email:', emailError);
            }

            return reply.send({
                success: true,
                message: '2FA dezactivată cu succes'
            });

        } catch (error) {
            fastify.log.error('Error disabling 2FA:', error);
            return reply.code(500).send({ error: 'Failed to disable 2FA' });
        }
    });

    /**
     * POST /api/users/2fa/regenerate-backup-codes
     * Delete old backup codes and generate 10 new ones
     */
    fastify.post('/2fa/regenerate-backup-codes', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;

            const { currentPassword } = body;

            // 1. Validate password
            if (!currentPassword) {
                return reply.code(400).send({ error: 'Current password is required' });
            }

            // 2. Get user and verify password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true, twoFAEnabled: true, email: true, name: true }
            });

            if (!user || !user.password) {
                return reply.code(404).send({ error: 'User not found' });
            }

            if (!user.twoFAEnabled) {
                return reply.code(400).send({ error: '2FA nu este activată. Activează 2FA mai întâi.' });
            }

            // 3. Verify password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return reply.code(400).send({ error: 'Parola curentă este incorectă' });
            }

            // 4. Generate new backup codes
            const backupCodes: string[] = [];
            const backupCodeHashes: string[] = [];

            for (let i = 0; i < 10; i++) {
                const code = crypto.randomBytes(6).toString('hex').toUpperCase();
                const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
                backupCodes.push(formatted);

                const codeHash = await bcrypt.hash(formatted, 10);
                backupCodeHashes.push(codeHash);
            }

            // 5. Replace backup codes in DB (transaction)
            await prisma.$transaction(async (tx) => {
                // Delete old codes
                await tx.backupCode.deleteMany({
                    where: { userId }
                });

                // Create new codes
                for (const codeHash of backupCodeHashes) {
                    await tx.backupCode.create({
                        data: {
                            userId,
                            codeHash
                        }
                    });
                }

                // Audit log
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: 'BACKUP_CODES_REGENERATED',
                        metadata: JSON.stringify({
                            timestamp: new Date().toISOString(),
                            codesGenerated: 10
                        }),
                        resourceType: 'backup_codes',
                        resourceId: userId
                    }
                });
            });

            // 6. Send email with new backup codes
            try {
                const { emailService } = await import('../services/email.service.js');
                await emailService.send2FABackupCodesRegeneratedEmail({ email: user.email, name: user.name || user.email }, backupCodes);
            } catch (emailError) {
                fastify.log.error('Failed to send backup codes email:', emailError);
            }

            return reply.send({
                success: true,
                backupCodes,
                message: 'Coduri backup regenerate! Codurile vechi sunt acum invalide.'
            });

        } catch (error) {
            fastify.log.error('Error regenerating backup codes:', error);
            return reply.code(500).send({ error: 'Failed to regenerate backup codes' });
        }
    });


    // ============================================================================
    // BIOMETRIC LOGIN ENDPOINTS (WebAuthn/FIDO2) - @simplewebauthn/server
    // ============================================================================

    // Temporary storage for registration challenges (in production, use Redis)
    const registrationChallenges = new Map<string, string>();

    /**
     * POST /api/users/biometric/register-options
     * Step 1: Generate WebAuthn registration options
     */
    fastify.post('/biometric/register-options', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;
            const { currentPassword } = body;

            // Validate password
            if (!currentPassword) {
                return reply.code(400).send({ error: 'Parola curentă este necesară' });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, name: true, password: true, biometricEnabled: true }
            });

            if (!user || !user.password) {
                return reply.code(404).send({ error: 'User not found' });
            }

            // Verify password
            const validPassword = await bcrypt.compare(currentPassword, user.password);
            if (!validPassword) {
                return reply.code(401).send({ error: 'Parolă incorectă' });
            }

            // Check if already enabled
            if (user.biometricEnabled) {
                return reply.code(409).send({ error: 'Login Biometric este deja activ' });
            }

            // Generate WebAuthn registration options
            const { webAuthnService } = await import('../services/webauthn.service.js');
            const options = await webAuthnService.generateRegistrationOptions(
                user.id,
                user.name || 'User',
                user.email
            );

            // Store challenge temporarily (in production, use Redis with TTL)
            registrationChallenges.set(userId, options.challenge);

            return reply.send({ options });
        } catch (error) {
            fastify.log.error('Error generating registration options:', error);
            return reply.code(500).send({ error: 'Eroare generare opțiuni biometric' });
        }
    });

    /**
     * POST /api/users/biometric/register-verify
     * Step 2: Verify WebAuthn registration response and enable biometric
     */
    fastify.post('/biometric/register-verify', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;
            const { registrationResponse } = body;

            if (!registrationResponse) {
                return reply.code(400).send({ error: 'Răspuns biometric lipsă' });
            }

            // Get stored challenge
            const expectedChallenge = registrationChallenges.get(userId);
            if (!expectedChallenge) {
                return reply.code(400).send({ error: 'Challenge expirat. Încearcă din nou.' });
            }

            // Verify registration response
            const { webAuthnService } = await import('../services/webauthn.service.js');
            const verification = await webAuthnService.verifyRegistrationResponse(
                registrationResponse,
                expectedChallenge
            );

            if (!verification.verified || !verification.registrationInfo) {
                return reply.code(400).send({ error: 'Verificare biometrică eșuată' });
            }

            const { credential } = verification.registrationInfo;

            // Get user data for email
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, name: true, twoFAEnabled: true }
            });

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            // Save to database (credential has: id, publicKey, counter)
            // ✅ Prisma Client synced - using dedicated biometricCredentialId field
            await prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        biometricEnabled: true,
                        biometricPublicKey: webAuthnService.bufferToBase64url(credential.publicKey),
                        biometricCredentialId: credential.id, // Base64url credential ID from @simplewebauthn
                        biometricChallenge: String(credential.counter) // Counter for replay protection
                    }
                });

                // Audit log
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: 'BIOMETRIC_ENABLED',
                        ipAddress: request.ip || 'unknown',
                        userAgent: request.headers['user-agent'] || null,
                        metadata: JSON.stringify({ method: 'WebAuthn', credentialType: 'platform' })
                    }
                });
            });

            // Clear challenge
            registrationChallenges.delete(userId);

            // Send email notification
            try {
                await emailService.sendBiometricEnabledEmail(
                    { email: user.email, name: user.name || user.email },
                    user.twoFAEnabled
                );
            } catch (emailError) {
                fastify.log.error('Failed to send biometric enabled email:', emailError);
            }

            return reply.send({ success: true, message: 'Login Biometric activat cu succes!' });
        } catch (error) {
            fastify.log.error('Error verifying registration:', error);
            return reply.code(500).send({ error: 'Eroare activare biometric' });
        }
    });

    /**
     * POST /api/users/biometric/enable
     * Enable biometric login (WebAuthn) - store public key
     */
    fastify.post('/biometric/enable', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;

            const { currentPassword, publicKey, challenge } = body;

            // 1. Validate inputs
            if (!currentPassword) {
                return reply.code(400).send({ error: 'Parola curentă este necesară' });
            }

            if (!publicKey || !challenge) {
                return reply.code(400).send({ error: 'Date biometrice incomplete' });
            }

            // 2. Get user and verify password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    password: true,
                    email: true,
                    name: true,
                    biometricEnabled: true,
                    twoFAEnabled: true
                }
            });

            if (!user || !user.password) {
                return reply.code(404).send({ error: 'User not found' });
            }

            // 3. Check if biometric already enabled
            if (user.biometricEnabled) {
                return reply.code(400).send({
                    error: 'Login Biometric este deja activat',
                    message: 'Pentru a reseta, dezactivează mai întâi setarea curentă.'
                });
            }

            // 4. Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return reply.code(401).send({ error: 'Parola curentă este incorectă' });
            }

            // 5. Enable biometric in DB (transaction)
            await prisma.$transaction(async (tx) => {
                // Update user with biometric data
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        biometricEnabled: true,
                        biometricPublicKey: publicKey,
                        biometricChallenge: challenge,
                        biometricLastUsed: null // Not used yet
                    }
                });

                // Audit log
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: 'BIOMETRIC_ENABLED',
                        metadata: JSON.stringify({
                            timestamp: new Date().toISOString(),
                            device: request.headers['user-agent'] || 'Unknown'
                        }),
                        resourceType: 'user',
                        resourceId: userId,
                        ipAddress: (request as any).ip || null,
                        userAgent: request.headers['user-agent'] || null
                    }
                });
            });

            // 6. Send email notification
            try {
                const { emailService } = await import('../services/email.service.js');
                await emailService.sendBiometricEnabledEmail({
                    email: user.email,
                    name: user.name || user.email
                }, user.twoFAEnabled);
            } catch (emailError) {
                fastify.log.error('Failed to send biometric enabled email:', emailError);
                // Don't fail the request if email fails
            }

            return reply.send({
                success: true,
                message: 'Login Biometric activat cu succes!'
            });

        } catch (error) {
            fastify.log.error('Error enabling biometric:', error);
            return reply.code(500).send({ error: 'Failed to enable biometric login' });
        }
    });

    /**
     * POST /api/users/biometric/disable
     * Disable biometric login - remove public key
     */
    fastify.post('/biometric/disable', {
        preHandler: [authenticate]
    }, async (request, reply) => {
        try {
            const userId = (request as any).user.id;
            const body = request.body as any;

            const { currentPassword } = body;

            // 1. Validate password
            if (!currentPassword) {
                return reply.code(400).send({ error: 'Parola curentă este necesară' });
            }

            // 2. Get user and verify password
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true, biometricEnabled: true, email: true, name: true }
            });

            if (!user || !user.password) {
                return reply.code(404).send({ error: 'User not found' });
            }

            if (!user.biometricEnabled) {
                return reply.code(400).send({ error: 'Login Biometric nu este activat' });
            }

            // 3. Verify password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return reply.code(401).send({ error: 'Parola curentă este incorectă' });
            }

            // 4. Disable biometric (transaction)
            await prisma.$transaction(async (tx) => {
                // Clear biometric data
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        biometricEnabled: false,
                        biometricPublicKey: null,
                        biometricChallenge: null,
                        biometricLastUsed: null
                    }
                });

                // Audit log
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: 'BIOMETRIC_DISABLED',
                        metadata: JSON.stringify({
                            timestamp: new Date().toISOString()
                        }),
                        resourceType: 'user',
                        resourceId: userId
                    }
                });
            });

            // 5. Send confirmation email
            try {
                const { emailService } = await import('../services/email.service.js');
                await emailService.sendBiometricDisabledEmail({
                    email: user.email,
                    name: user.name || user.email
                });
            } catch (emailError) {
                fastify.log.error('Failed to send biometric disabled email:', emailError);
            }

            return reply.send({
                success: true,
                message: 'Login Biometric dezactivat cu succes'
            });

        } catch (error) {
            fastify.log.error('Error disabling biometric:', error);
            return reply.code(500).send({ error: 'Failed to disable biometric login' });
        }
    });

    // ============================================================================
    // END OF BIOMETRIC LOGIN ENDPOINTS
    // ============================================================================

    // ============================================================================
    // END OF 2FA ENDPOINTS
    // ============================================================================
}
