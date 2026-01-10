/**
 * Auto-Trigger Snippets - Clearance Level Recalculation
 * Add these to existing files to trigger clearance updates on events
 */

// ===================================================================
// 1. CHECK-IN TRIGGER (user.routes.ts)
// ===================================================================
// Location: After loyalty points are awarded in /profile/checkin

// ADD AFTER THIS LINE:
// await loyaltyService.evaluateAndAwardPoints(userId, 'CHECKIN', ...);

// INSERT THIS CODE:
const { ClearanceService } = await import('../services/clearance.service.js');
const clearanceService = new ClearanceService();
await clearanceService.updateUserClearance(userId, 'CHECKIN_TRIGGER');


// ===================================================================
// 2. TIER CHANGE TRIGGER (tier.service.ts)
// ===================================================================
// Location: In recalculateUserTier() after tier update

// ADD AFTER THIS BLOCK:
// if (changed) {
//   await prisma.user.update({
//     where: { id: userId },
//     data: { tier: newTier }
//   });
// }

// INSERT THIS CODE:
if (changed) {
    await prisma.user.update({
        where: { id: userId },
        data: { tier: newTier }
    });

    // Trigger clearance recalculation
    const { ClearanceService } = await import('./clearance.service.js');
    const clearanceService = new ClearanceService();
    await clearanceService.updateUserClearance(userId, 'TIER_CHANGE_TRIGGER');
}


// ===================================================================
// 3. DEPOSIT APPROVAL TRIGGER (admin.routes.ts or deposit service)
// ===================================================================
// Location: After deposit status changes to APPROVED

// ADD AFTER deposit approval:
const { ClearanceService } = await import('../services/clearance.service.js');
const clearanceService = new ClearanceService();
await clearanceService.updateUserClearance(deposit.userId, 'DEPOSIT_APPROVED');


// ===================================================================
// 4. WITHDRAWAL APPROVAL TRIGGER (admin.routes.ts or withdrawal service)
// ===================================================================
// Location: After withdrawal status changes to APPROVED

// ADD AFTER withdrawal approval:
const { ClearanceService } = await import('../services/clearance.service.js');
const clearanceService = new ClearanceService();
await clearanceService.updateUserClearance(withdrawal.userId, 'WITHDRAWAL_APPROVED');
