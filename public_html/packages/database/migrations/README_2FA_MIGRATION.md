# Migration Required: 2FA Columns

## Issue
Tests fail because the `users` table is missing columns from the Prisma schema:
- `two_fa_enabled`
- `two_fa_secret`
- `email_verified`
- `email_verified_at`
- `updated_at`

## Solution
Run the SQL migration manually:

**File**: `public_html/packages/database/migrations/20241217_add_2fa_columns_to_users.sql`

### Via PHPMyAdmin
1. Open PHPMyAdmin (pariazainteligent.ro)
2. Select database: `u45947pari_pariaza_inteligent`
3. Go to SQL tab
4. Copy and paste the SQL from the migration file
5. Click "Go"

### Via mysql CLI
```bash
mysql -u u45947pari_api -p -h pariazainteligent.ro u45947pari_pariaza_inteligent < packages/database/migrations/20241217_add_2fa_columns_to_users.sql
```

## After Migration
1. Verify columns exist: `SHOW COLUMNS FROM users;`
2. Re-run tests: `cd apps/api && pnpm test:integration`

## Note
This migration is **idempotent** (uses `IF NOT EXISTS`) and **safe** (adds columns with defaults, no data loss).
