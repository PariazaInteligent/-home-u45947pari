# Scenario 1: Manual Snapshot + Check-In Flow

**Date:** 2026-01-03  
**Tester:** Automated Browser + PowerShell  
**Objective:** Verify manual snapshot trigger and check-in award loyalty points correctly

## Test Execution

### Step 1: Admin Login

**Endpoint:** `POST /api/auth/login`  
**Credentials:**

- Email: <admin@pariazainteligent.ro>
- Password: password123

**Status:** ✅  
**Token expiration noted:** 15 minutes (standard JWT configuration)

### Step 2: Manual Snapshot Trigger

**Endpoint:** `POST /admin/snapshot/trigger`  
**Expected Behavior:**

- Create daily snapshot
- Calculate profitFlag based on fund value comparison
- Update profit-based streaks if applicable

**Status:** Testing in progress...

### Step 3: User Check-In

**Endpoint:** `POST /api/users/profile/checkin`  
**Expected Behavior:**

- Increment streakDays (or reset if skipped day)
- Award 10 loyalty points via CHECKIN rule
- Return updated values

**Status:** Pending...

### Step 4: Verify Loyalty Breakdown

**Endpoint:** `GET /api/users/me`  
**Expected Content:**

```json
{
  "loyalty": {
    "total": <number>,
    "breakdown": [
      {
        "ruleName": "Check-In Zilnic",
        "eventType": "CHECKIN",
        "totalPoints": 10,
        "occurrences": 1,
        "lastAwarded": "<timestamp>"
      }
    ]
  }
}
```

**Status:** Pending...

## Issues Encountered

- Swagger UI has inconsistent Authorization header handling
- JWT tokens expire in 15 minutes, requiring fresh login for long test sessions
- Switching to PowerShell-based API testing for reliability

## Results

*To be completed after PowerShell testing...*
