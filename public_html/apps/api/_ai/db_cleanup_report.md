# Database Cleanup Report

**Generated:** 2026-01-03T14:38:21.644Z

## Summary

Cleaned database and reset to 2 users with realistic test data.

### Users Kept
- **admin@pariazainteligent.ro** (ADMIN) - ID: `cmj8xneyg000aknjwuf6g0bj1`
- **tomizeimihaita@gmail.com** (INVESTOR) - ID: `cmjvl64v300073rwndeokxtot`

### Fund Statistics
- **Total Units Issued:** 110.000000
- **Current NAV:** 10.00 EUR
- **Total Fund Value:** 1100.00 EUR

---

## Table Counts

| Table | Before | After | Deleted |
|-------|--------|-------|---------|
| user | 69 | 2 | 67 |
| session | 194 | 188 | 6 |
| deposit | 57 | 2 | 55 |
| withdrawal | 246 | 0 | 246 |
| trade | 1 | 0 | 1 |
| ledgerEntry | 5 | 2 | 3 |
| ledgerLine | 10 | 4 | 6 |
| auditLog | 7 | 7 | 0 |
| adminNote | 0 | 0 | 0 |
| distributionRound | 1 | 0 | 1 |
| distributionAllocation | 3 | 0 | 3 |
| loyaltyEvent | 1 | 1 | 0 |
| passwordResetToken | 3 | 2 | 1 |
| dailySnapshot | 1 | 0 | 1 |
| payoutMethod | 0 | 0 | 0 |

---

## Deposits Created

| User | Amount (EUR) | Units Issued | NAV at Issue |
|------|--------------|--------------|--------------|
| admin@pariazainteligent.ro | 1000.00 | 100.000000 | 10.00 |
| tomizeimihaita@gmail.com | 100.00 | 10.000000 | 10.00 |

**Total:** 1100.00 EUR, 110.000000 units

---

## Verification

### Admin (admin@pariazainteligent.ro)
- **Principal Invested:** 1000.00 EUR
- **Units Owned:** 100.000000
- **Current Value:** 1000.00 EUR
- **Profit:** +0.00 EUR
- **Share:** 90.9091%

### Investor (tomizeimihaita@gmail.com)
- **Principal Invested:** 100.00 EUR
- **Units Owned:** 10.000000
- **Current Value:** 100.00 EUR
- **Profit:** +0.00 EUR
- **Share:** 9.0909%

---

## Formula Validation

✅ **currentValue = totalFundValue × sharePercent**
- Admin: 1100.00 × 0.909091 = 1000.00 EUR ✓
- Investor: 1100.00 × 0.090909 = 100.00 EUR ✓

✅ **Sum of currentValues = totalFundValue**
- 1000.00 + 100.00 = 1100.00 EUR ✓

---

## Next Steps

1. ✅ Database cleaned
2. ✅ Realistic test data created
3. 🔄 Visual verification in /profile needed
4. 🔄 Check Admin/Landing "Total Fond" displays 1100 EUR

Run: `npm run dev` and navigate to `/profile` for both users.
