/**
 * API Enrichment - /me endpoint clearance object
 * Add to user.routes.ts in GET /me response
 */

// ADD THESE IMPORTS AT TOP:
import { ClearanceService } from '../services/clearance.service.js';

// IN GET /api/users/me ENDPOINT, ADD AFTER loyalty breakdown:

// Get clearance info
const clearanceService = new ClearanceService();
const currentClearance = await clearanceService.getConfig(user.clearanceLevel || 1);
const nextClearance = await clearanceService.getNextLevelRequirements(user.clearanceLevel || 1);
const clearanceProgress = await clearanceService.getUserProgress(userId);

// ADD TO RESPONSE OBJECT:
return reply.send({
    success: true,
    user: {
        // ... existing user fields
        clearanceLevel: user.clearanceLevel || 1,
    },
    // ... existing stats, league, loyalty fields

    // NEW CLEARANCE OBJECT:
    clearance: {
        level: user.clearanceLevel || 1,
        levelName: currentClearance?.levelName || 'Beginner',
        iconEmoji: currentClearance?.iconEmoji || '🌱',
        description: currentClearance?.description || '',
        requirements: {
            streak: currentClearance?.requiredStreak || 0,
            loyalty: currentClearance?.requiredLoyalty || 0,
            tier: currentClearance?.requiredTier || 'ENTRY',
            investment: Number(currentClearance?.requiredInvestment || 0)
        },
        nextLevel: nextClearance ? {
            level: nextClearance.level,
            levelName: nextClearance.levelName,
            iconEmoji: nextClearance.iconEmoji,
            requirements: {
                streak: nextClearance.requiredStreak,
                loyalty: nextClearance.requiredLoyalty,
                tier: nextClearance.requiredTier,
                investment: Number(nextClearance.requiredInvestment)
            }
        } : null,
        progress: clearanceProgress?.progress || null
    }
});

// EXPECTED RESPONSE STRUCTURE:
/*
{
  "clearance": {
    "level": 2,
    "levelName": "Active",
    "iconEmoji": "⭐",
    "description": "Active investor - 7-day streak + €500 invested",
    "requirements": {
      "streak": 7,
      "loyalty": 50,
      "tier": "INVESTOR",
      "investment": 500
    },
    "nextLevel": {
      "level": 3,
      "levelName": "Verified",
      "iconEmoji": "💎",
      "requirements": {
        "streak": 30,
        "loyalty": 200,
        "tier": "PRO",
        "investment": 2000
      }
    },
    "progress": {
      "streak": { "current": 15, "required": 30, "percentage": 50 },
      "loyalty": { "current": 150, "required": 200, "percentage": 75 },
      "investment": { "current": 1200, "required": 2000, "percentage": 60 },
      "tier": { "current": "PRO", "required": "PRO", "met": true }
    }
  }
}
*/
