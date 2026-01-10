# E2E Testing Guide - Streak & Loyalty System

**Date:** 2026-01-03  
**Status:** Infrastructure Complete, Ready for E2E Verification

---

## Testing Strategy

### ❌ Why Swagger UI is NOT suitable for E2E

- JWT `accessToken` expires in 15 minutes
- No session persistence (no `refreshToken` auto-renew)
- Cannot simulate real user flow: Login → Actions → Refresh Page → Persist

### ✅ Recommended Approaches

#### Option 1: Real Frontend Flow (Best)

```
1. Login via UI → saves refreshToken
2. Perform actions (/checkin, /me)
3. Refresh browser → auto-renew via /auth/refresh
4. Verify data persists
```

#### Option 2: HTTP Collection (Postman/Insomnia)

- Pre-request script to auto-refresh expired tokens
- Environment variables: `accessToken`, `refreshToken`
- Sequential scenario execution

#### Option 3: Swagger UI (Smoke Test Only)

- **Get fresh token PER scenario** (don't reuse if >15min)
- Validates individual endpoints, NOT multi-step flows

---

## The 4 E2E Scenarios

### Scenario 1: Manual Snapshot + Check-In ✅

**Goal:** Verify basic flow: snapshot → check-in → loyalty award

**API Endpoints:**

1. `POST /auth/login` → get `accessToken` and `refreshToken`
2. `POST /admin/snapshot/trigger` → create daily snapshot
3. `POST /api/users/profile/checkin` → award 10 loyalty points
4. `GET /api/users/me` → verify loyalty breakdown

**Step-by-Step (Swagger UI Smoke Test):**

1. Login as `admin@pariazainteligent.ro` / `password123`
2. Copy `accessToken`
3. Authorize in Swagger (paste token without "Bearer" prefix)
4. Execute `/admin/snapshot/trigger`:

   ```json
   {
     "success": true,
     "snapshot": {
       "id": "cm...",
       "profitFlag": true,  // or false depending on fund change
       "totalFundValue": "1234.56",
       "snapshotDate": "2026-01-03"
     }
   }
   ```

5. Execute `/api/users/profile/checkin`:

   ```json
   {
     "success": true,
     "streakDays": 1,  // or incremented value
     "loyaltyPoints": 10,
     "pointsAwarded": 10,
     "message": "Prima verificare! +10 puncte..."
   }
   ```

6. Execute `/api/users/me`:

   ```json
   {
     "user": {
       "streakDays": 1,
       "loyaltyPoints": 10
     },
     "loyalty": {
       "total": 10,
       "breakdown": [
         {
           "ruleName": "Check-In Zilnic",
           "eventType": "CHECKIN",
           "totalPoints": 10,
           "occurrences": 1,
           "lastAwarded": "2026-01-03T23:45:00.000Z"
         }
       ]
     }
   }
   ```

**✅ Pass Criteria:**

- Snapshot created with correct `profitFlag`
- `streakDays` incremented
- `loyaltyPoints` = 10
- `loyalty.breakdown` shows "Check-In Zilnic" entry

---

### Scenario 2: 7-Day Streak Milestone 🏆

**Goal:** Verify milestone bonus (50 points) triggers at 7-day streak

**Prerequisites:**

```sql
-- Manually set user's streak to 6 days
UPDATE users SET streakDays = 6 WHERE email = 'admin@pariazainteligent.ro';
```

**API Endpoints:**

1. `POST /api/users/profile/checkin` → should award 60 points total (10 + 50)
2. `GET /api/users/me` → verify milestone in breakdown

**Step-by-Step (Swagger UI Smoke Test):**

1. Fresh login → get new token
2. Authorize
3. Execute `/api/users/profile/checkin`:

   ```json
   {
     "success": true,
     "streakDays": 7,
     "loyaltyPoints": 60,  // Previous 0 + 10 (checkin) + 50 (milestone)
     "pointsAwarded": 10,  // This endpoint only shows check-in points
     "message": "Streak continuat! Ai acum 7 zile consecutive. +10 puncte!"
   }
   ```

4. Execute `/api/users/me`:

   ```json
   {
     "loyalty": {
       "total": 60,
       "breakdown": [
         {
           "ruleName": "Check-In Zilnic",
           "eventType": "CHECKIN",
           "totalPoints": 10,
           "occurrences": 1
         },
         {
           "ruleName": "Streak 7 Zile Consecutive",
           "eventType": "STREAK_MILESTONE",
           "totalPoints": 50,
           "occurrences": 1,
           "lastAwarded": "2026-01-03T23:50:00.000Z"
         }
       ]
     }
   }
   ```

**✅ Pass Criteria:**

- `streakDays` = 7
- `loyaltyPoints` = 60
- `loyalty.breakdown` contains TWO entries (checkin + milestone)
- Milestone shows `totalPoints: 50`, `occurrences: 1`

---

### Scenario 3: Profit-Based HYBRID Streak 📈

**Goal:** Verify ALL users' streaks increment on profit day (no individual check-in needed)

**Prerequisites:**

```sql
-- Create profit scenario: add deposit + winning trade
INSERT INTO deposits (userId, amount, status, approvedAt)
VALUES ('user_id_here', 1000.00, 'APPROVED', NOW());

INSERT INTO trades (createdBy, sport, event, market, selection, odds, stake, potentialWin, status, resultAmount, settledAt)
VALUES ('user_id_here', 'Football', 'Test Match', 'Winner', 'Home', 2.00, 50.00, 100.00, 'SETTLED_WIN', 100.00, NOW());
```

**API Endpoints:**

1. `POST /admin/snapshot/trigger` → should create `profitFlag: true`
2. Query database → verify all `streakDays` incremented

**Step-by-Step (Swagger UI Smoke Test):**

1. Fresh login → get token
2. Execute `/admin/snapshot/trigger`:

   ```json
   {
     "success": true,
     "snapshot": {
       "profitFlag": true,  // ✅ CRITICAL: Must be true
       "totalFundValue": "1050.00"  // > yesterday's value
     }
   }
   ```

3. **Check database directly:**

   ```sql
   SELECT id, email, streakDays FROM users;
   -- All streakDays should have incremented by 1
   ```

**✅ Pass Criteria:**

- Snapshot created with `profitFlag: true`
- **ALL users' `streakDays` incremented** (check DB)
- No individual `/checkin` calls needed

---

### Scenario 4: Loss Day with Fallback 📉

**Goal:** Verify check-in streaks preserved on loss day (fallback mode)

**Prerequisites:**

```sql
-- Create yesterday's snapshot with HIGHER value
UPDATE daily_snapshots 
SET totalFundValue = 2000.00 
WHERE snapshotDate = (CURDATE() - INTERVAL 1 DAY);

-- Set test user's streak from previous check-ins
UPDATE users 
SET streakDays = 5 
WHERE email = 'admin@pariazainteligent.ro';
```

**API Endpoints:**

1. `POST /admin/snapshot/trigger` → should create `profitFlag: false`
2. `POST /api/users/profile/checkin` → streak preserved via fallback
3. `GET /api/users/me` → verify streak still intact

**Step-by-Step (Swagger UI Smoke Test):**

1. Fresh login
2. Execute `/admin/snapshot/trigger`:

   ```json
   {
     "success": true,
     "snapshot": {
       "profitFlag": false,  // ✅ Loss day
       "totalFundValue": "1950.00"  // < yesterday's 2000
     }
   }
   ```

3. Execute `/api/users/profile/checkin`:

   ```json
   {
     "success": true,
     "streakDays": 6,  // 5 + 1, preserved via fallback!
     "loyaltyPoints": 10,
     "pointsAwarded": 10
   }
   ```

4. **Check database for users who DIDN'T check-in:**

   ```sql
   SELECT id, email, streakDays FROM users 
   WHERE lastCheckinAt IS NULL OR lastCheckinAt < CURDATE();
   -- Their streakDays should be UNCHANGED (fallback preserved them)
   ```

**✅ Pass Criteria:**

- Snapshot created with `profitFlag: false`
- Check-in user's streak incremented (6 = 5 + 1)
- Non-check-in users' streaks PRESERVED (not reset to 0)

---

## Cron Job Verification

**Schedule:** Daily at 00:05 AM (`5 0 * * *`)

**How to Verify:**

1. Restart API server:

   ```powershell
   cd public_html/apps/api
   pnpm run dev
   ```

2. Check console log:

   ```
   [Cron] Scheduled daily snapshot job for 00:05 AM
   ```

3. Wait until 00:05 or manually trigger:

   ```powershell
   # Check logs at 00:05 next day
   # Should see:
   # [Cron] Running daily snapshot job...
   # [DailySnapshot] Starting daily snapshot creation...
   # [DailySnapshot] Snapshot created: cm...
   # [Cron] Daily snapshot completed successfully
   ```

---

## Summary Checklist

- [x] **Cron activated** at 00:05
- [x] **DailySnapshotService** implements HYBRID mode
- [x] **LoyaltyService** evaluates rules correctly
- [x] **Admin endpoints** wired (/admin/snapshot/trigger, /admin/streak/config, /admin/loyalty/rules)
- [x] **User endpoints** functional (/api/users/profile/checkin, /api/users/me)
- [x] **/me returns loyalty.breakdown** with all required fields
- [ ] **E2E Scenario 1** tested (Snapshot + Check-In)
- [ ] **E2E Scenario 2** tested (7-Day Milestone)
- [ ] **E2E Scenario 3** tested (Profit HYBRID)
- [ ] **E2E Scenario 4** tested (Loss Fallback)

**Next Action:** Execute the 4 scenarios using **real frontend flow** or **HTTP collection with auto-token-renew** to eliminate token expiration blocker.
