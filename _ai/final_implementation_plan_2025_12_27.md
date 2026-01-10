# Email + Set Password Implementation Plan

## Current State Analysis

### ✅ EXISTĂ DEJA

**Database Schema (`schema.prisma`):**

- User model cu: `email`, `password`, `status` (PENDING_VERIFICATION, ACTIVE, SUSPENDED)
- `ticketId` pentru pending users
- ❌ **NU există tabel `password_reset_tokens`**

**Auth Routes (`auth.routes.ts`):**

- `POST /auth/register` - setează DEJA password hash la înregistrare (linia 47, 80)
- `POST /auth/login` - verifică status=ACTIVE + password valid (linia 184-188)
- ❌ **NU verifică dacă password există** (presupune că există mereu)

**Email Service (`email.service.ts`):**

- ✅ `sendWelcomeEmail()` - pt cod invitație (AUTO ACTIVE)
- ✅ `sendPendingEmail()` - pt fără cod (PENDING + ticketId)
- ✅ `sendActivationEmail()` - pt admin approve
- ❌ `sendRejectionEmail()` - **APELAT dar NU IMPLEMENTAT** (admin.routes.ts:241)

**Admin Routes (`admin.routes.ts`):**

- `POST /admin/users/:id/approve` - setează status=ACTIVE + trimite activation email
- `POST /admin/users/:id/reject` - DELETE user + apelează sendRejectionEmail (missing)

### ❌ LIPSEȘTE

1. **Table `password_reset_tokens`**
2. **Endpoint `POST /auth/request-set-password`**
3. **Endpoint `POST /auth/set-password`**
4. **Function `emailService.sendRejectionEmail()`**
5. **Set password links în email templates**

## PROBLEMĂ CRITICĂ IDENTIFICATĂ

> [!WARNING]
> **Registration flow ACTUAL pune DEJA parola la register!**
>
> În `auth.routes.ts` linia 40,47:
>
> ```ts
> const { email, password, name, invitationCode } = registerSchema.parse(request.body);
> const hashedPassword = await bcrypt.hash(password, 10);
> ```
>
> User-ul introdus cere:
>
> - Register fără parolă
> - Set password prin email link DUPĂ approve
>
> **DECIZIE NECESARĂ:**
>
> **Opțiunea A:** Schimb flow-ul (breaking change):
>
> - Register FĂRĂ password în schema
> - Password = `null` sau hash dummy la create
> - Login verifică: `if (!user.password) return "setează parola din email"`
> - Email cu link set-password trimis la approve
>
> **Opțiunea B:** Păstrez flow actual (backward compatible):
>
> - Register CU password (cum e acum)
> - Add OPȚIONAL "reset password" prin email
> - Approve trimite "contul e activ, login cu parola de la register"
>
> **Care din cele două variante vrei?**

## Proposed Implementation (Opțiunea A - conform cerințe)

### 1. Database Migration

**Fișier nou:** `packages/database/prisma/migrations/XXX_add_password_tokens/migration.sql`

```sql
CREATE TABLE `password_reset_tokens` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `token_hash` VARCHAR(191) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `purpose` VARCHAR(50) NOT NULL DEFAULT 'SET_PASSWORD',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
  INDEX `password_reset_tokens_user_id_idx`(`user_id`),
  CONSTRAINT `password_reset_tokens_user_id_fkey` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Schema update:**

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String    @map("user_id")
  tokenHash String    @unique @map("token_hash")
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  purpose   String    @default("SET_PASSWORD") @db.VarChar(50)
  createdAt DateTime  @default(now()) @map("created_at")
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("password_reset_tokens")
}

model User {
  // ... existing fields
  passwordResetTokens PasswordResetToken[]
}
```

### 2. Auth Routes Changes

**File:** `apps/api/src/routes/auth.routes.ts`

#### Modificare Register (linia 9-14)

```ts
// BEFORE
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
    invitationCode: z.string().optional(),
});

// AFTER
const registerSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    invitationCode: z.string().optional(),
    // password REMOVED - va fi setat prin link
});
```

#### Modificare Register Handler (linia 39-88)

```ts
// Remove password hashing
// const hashedPassword = await bcrypt.hash(password, 10);

const user = await prisma.user.create({
    data: {
        email,
        password: '', // EMPTY - va fi setat prin set-password link
        name,
        // ... rest unchanged
    },
});

// Generate set-password token for AUTO ACTIVE users
if (userStatus === UserStatus.ACTIVE) {
    const token = await generateSetPasswordToken(user.id);
    await emailService.sendWelcomeEmailWithSetPassword(user, token, referrer);
}
```

#### Modificare Login (linia 176-191)

```ts
const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
    return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
}

if (user.status !== UserStatus.ACTIVE) {
    return reply.code(403).send({ error: 'Forbidden', message: 'Account not active. Contact admin.' });
}

// NEW: Check if password is set
if (!user.password || user.password === '') {
    return reply.code(403).send({ 
        error: 'Forbidden', 
        message: 'Please set your password using the link sent to your email.' 
    });
}

const validPassword = await bcrypt.compare(password, user.password);
```

#### Add New Endpoints

```ts
// Generate set-password token
async function generateSetPasswordToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 min

    await prisma.passwordResetToken.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
            purpose: 'SET_PASSWORD',
        },
    });

    return token;
}

// POST /auth/set-password
app.post('/auth/set-password', async (request, reply) => {
    const { token, newPassword } = request.body;

    // Find valid token
    const tokens = await prisma.passwordResetToken.findMany({
        where: {
            expiresAt: { gt: new Date() },
            usedAt: null,
        },
        include: { user: true },
    });

    let validToken = null;
    for (const t of tokens) {
        if (await bcrypt.compare(token, t.tokenHash)) {
            validToken = t;
            break;
        }
    }

    if (!validToken) {
        return reply.code(400).send({ error: 'Invalid or expired token' });
    }

    // Set password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: validToken.userId },
        data: { password: hashedPassword },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
        where: { id: validToken.id },
        data: { usedAt: new Date() },
    });

    reply.send({ message: 'Password set successfully. You can now log in.' });
});
```

### 3. Admin Routes Changes

**File:** `apps/api/src/routes/admin.routes.ts`

#### Approve User (linia 186-193)

```ts
// Send activation email WITH set-password link
try {
    const token = await generateSetPasswordToken(user.id);
    await emailService.sendActivationEmailWithSetPassword({
        id: user.id,
        name: user.name || user.email,
        email: user.email,
    }, token);
    console.log(`✅ Activation email with set-password link sent to ${user.email}`);
} catch (emailError) {
    console.error('❌ Failed to send activation email:', emailError);
}
```

### 4. Email Service Changes

**File:** `apps/api/src/services/email.service.ts`

#### Add Missing Method (după linia 159)

```ts
/**
 * Send rejection email (when admin rejects)
 */
async sendRejectionEmail(user: EmailUser): Promise<boolean> {
    this.initialize();
    if (!this.isConfigured || !this.transporter) {
        console.log('📧 Skipping rejection email - service not configured');
        return false;
    }

    try {
        const html = this.getRejectionEmailTemplate(user);
        await this.transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
            to: user.email,
            subject: '❌ Cererea Ta A Fost Refuzată',
            html,
        });
        console.log(`✅ Rejection email sent to ${user.email}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send rejection email to ${user.email}:`, error);
        return false;
    }
}
```

#### Update Existing Templates (add set-password links)

- `sendWelcomeEmail` → `sendWelcomeEmailWithSetPassword`
- `sendActivationEmail` → `sendActivationEmailWithSetPassword`
- Add CTA button: `https://pariazainteligent.ro/set-password?token=${token}`

#### [NEW] [SetPasswordPage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/SetPasswordPage.tsx)

### Login Redesign

#### [MODIFY] [App.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/App.tsx)

- Add `/login` to `isStandaloneRoute` regex to hide Navbar.

#### [MODIFY] [LoginPage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/LoginPage.tsx)

- Redesign with Duolingo aesthetics (Mascot, Card UI, Green/Purple buttons).
- Ensure role-agnostic but playful interface.

## Verification Plan

## Phase 6: Admin Header Redesign

### Goal

Transform the Admin Header into a robust, personality-driven component (Duolingo style).

### Implementation

#### [NEW] [components/admin/AdminHeader.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/admin/AdminHeader.tsx)

- **Visuals:** White card style with shadow, branded font.
- **Features:**
  - Search Bar (Chunky, rounded).
  - Notification Bell (Animated).
  - User Profile (Avatar + Name + Role Badge).
  - Mobile Menu Toggle integration.

#### [MODIFY] [components/AdminConsolePage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/AdminConsolePage.tsx)

- Replace inline header code with `<AdminHeader />`.

#### [MODIFY] [App.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/App.tsx)

- Implement `verifySession` function using `POST /auth/verify`.
- Update `RouteGuard` to use `verifySession`.
- Add "Access Denied" / "Session Expired" UI with Duolingo mascot.

#### [NEW] [components/SessionExpiredModal.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/SessionExpiredModal.tsx)

- Create a reusable modal for session expiration.

#### [MODIFY] [auth.routes.ts](file:///c:/Users/tomiz/Desktop/-home-u45947pari/public_html/apps/api/src/routes/auth.routes.ts)

- Ensure `/auth/verify` endpoint exists and returns 401 for invalid tokens.

### Password Recovery Flow

### Password Recovery Flow

#### [MODIFY] [auth.routes.ts](file:///c:/Users/tomiz/Desktop/-home-u45947pari/public_html/apps/api/src/routes/auth.routes.ts)

- Add `POST /auth/forgot-password` endpoint.
- Generate `RESET_PASSWORD` token.

#### [MODIFY] [email.service.ts](file:///c:/Users/tomiz/Desktop/-home-u45947pari/public_html/apps/api/src/services/email.service.ts)

- Add `sendPasswordResetEmail` and template.

#### [NEW] [ForgotPasswordPage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/ForgotPasswordPage.tsx)

- Create Duolingo-style email request page.

#### [MODIFY] [App.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/App.tsx)

- Add `/forgot-password` route.

#### [MODIFY] [LoginPage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/LoginPage.tsx)

- Link "Recuperare?" button.

#### Add Rejection Template

```ts
private getRejectionEmailTemplate(user: EmailUser): string {
    return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Cererea Refuzată</title>
</head>
<body style="background: linear-gradient(to bottom right, #FECACA, #FCA5A5); font-family: sans-serif; padding: 40px;">
  <table width="600" style="background: white; border-radius: 24px; margin: 0 auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
    <tr>
      <td style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 40px; text-align: center;">
        <h1 style="color: white; font-size: 32px; margin: 0;">Cererea Refuzată</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <div style="font-size: 60px; text-align: center; margin-bottom: 20px;">😔</div>
        <p style="color: #374151; font-size: 16px; line-height: 1.7; text-align: center;">
          Ne pare rău, ${user.name}, dar cererea ta de acces nu a putut fi aprobată în acest moment.
        </p>
        <p style="color: #6B7280; font-size: 14px; text-align: center; margin-top: 30px;">
          Pentru mai multe informații, contactează-ne la 
          <a href="mailto:support@pariazainteligent.ro" style="color: #EF4444; font-weight: 600;">
            support@pariazainteligent.ro
          </a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
}
```

## Testing Protocol (Step-by-Step with Email Confirmation)

> [!IMPORTANT]
> **OBLIGATORIU:** Aștept confirmare utilizator după FIECARE email trimis

### Test 1: Register fără cod (PENDING)

**Action:**

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "tomizeimihaita@gmail.com", "name": "Mihaita Test"}'
```

**Expected:**

- DB: user status=PENDING_VERIFICATION, password='', ticketId=MM-XXX
- Email: "Cererea ta e în așteptare" cu ticketId

**Pause:** ❓ "Ai primit emailul de pending?"

---

### Test 2: Admin Approve (ACTIVE + set-password email)

**Action:** Click "Aprobă" în admin pentru user

**Expected:**

- DB: user status=ACTIVE
- DB: password_reset_tokens cu token nou, expires_at=+60min
- Email: "Aprobat + setează parola" cu link `https://...?token=XXX`

**Pause:** ❓ "Ai primit emailul de aprobare cu link set-password?"

---

### Test 3: Set Password din link

**Action:**

```bash
curl -X POST http://localhost:3001/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"token": "TOKEN_FROM_EMAIL", "newPassword": "TestPassword123!"}'
```

**Expected:**

- DB: user password=hash
- DB: password_reset_tokens marked used_at=now()
- Response: "Password set successfully"

**Test login:**

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "tomizeimihaita@gmail.com", "password": "TestPassword123!"}'
```

**Expected:** accessToken + refreshToken

**Pause:** ❓ "Login funcționează? Status OK?"

---

### Test 4: Register cu cod (AUTO ACTIVE + set-password)

**Action:**

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tomizeimihaita+invite@gmail.com", 
    "name": "Invite Test",
    "invitationCode": "VALID_CODE_HERE"
  }'
```

**Expected:**

- DB: user status=ACTIVE, password=''
- DB: password_reset_tokens created
- Email: "Bun venit! Setează parola" cu link

**Pause:** ❓ "Ai primit emailul de welcome cu link set-password?"

---

### Test 5: Reject User

**Action:** Click "Refuză" în admin pentru user nou

**Expected:**

- DB: user DELETED
- Email: "Cererea refuzată"

**Pause:** ❓ "Ai primit emailul de refuz?"

## Deliverables After Each Test

După fiecare test, raportez:

```
✅ Endpoint lovituri: 
  - POST /auth/register → 201
  - POST /admin/users/:id/approve → 200

✅ DB state:
  - User status: ACTIVE
  - Password hash: SET (nu NULL)

✅ Logs:
  - "Email queued: Contul Tău A Fost Activat!"
  - Subject: "✅ Contul Tău A Fost Activat!"
```

## Phase 7: Real-Admin Notifications

### Goal

Implement real-time (polling) notifications for pending user approvals in the Admin Header.

### Backend Changes

#### [MODIFY] [admin.routes.ts](file:///c:/Users/tomiz/Desktop/-home-u45947pari/public_html/apps/api/src/routes/admin.routes.ts)

- Add `GET /admin/notifications` endpoint.
- Logic: Check `prisma.user.count({ where: { status: 'PENDING_VERIFICATION' } })`.
- Return structured JSON matching frontend `Notification` interface.

### Frontend Changes

#### [MODIFY] [AdminConsolePage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/AdminConsolePage.tsx)

- Add `fetchNotifications` function.
- Poll every 30 seconds.
- Map backend response to `AdminHeader` props.

### Verification Plan

1. **Manual Test:**
   - Create a new user (register without invite).
   - Login as Admin.
   - Verify bell icon has badge.

## Phase 8: Notification Scroll-to-Section

### Goal

Clicking "New User Request" notification should scroll to "Cereri de Aprobare" on `/admin` instead of redirecting to `/admin/users`.

### Backend Changes

#### [MODIFY] [admin.routes.ts](file:///c:/Users/tomiz/Desktop/-home-u45947pari/public_html/apps/api/src/routes/admin.routes.ts)

- Change `actionLink` from `/admin/users` to `/admin#approval-requests`.

### Frontend Changes

#### [MODIFY] [AdminOverview.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/admin/AdminOverview.tsx)

- Add `id="approval-requests"` to the main "Cereri de Aprobare" container (around line 273).

#### [MODIFY] [AdminHeader.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/admin/AdminHeader.tsx)

## Phase 9: Admin Header Customization

### Goal

Display real Admin user data (Name, Email, Role) in the header and add "Investor View" button.

### Backend Changes

#### [MODIFY] [auth.routes.ts](file:///c:/Users/tomiz/Desktop/-home-u45947pari/public_html/apps/api/src/routes/admin.routes.ts)

- Update `GET /auth/verify` to return `name` in the user object.

### Frontend Changes

#### [MODIFY] [App.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/App.tsx)

- Upgrade `userRole` state to `currentUser` object (id, email, name, role).
- Pass `currentUser` to `AdminConsolePage`.

#### [MODIFY] [AdminConsolePage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/AdminConsolePage.tsx)

- Accept `user` prop.
- Pass `user` data to `AdminHeader`.

#### [MODIFY] [AdminHeader.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/admin/AdminHeader.tsx)

- Accept `user` prop.
- Display `user.name` (fallback to email), `user.email`, `user.role`.
- Avatar: Show initials from `user.name` or "AD".
- REPLACE "ADMIN_ZONE" badge with "INVESTOR VIEW" button (actions `onSwitchToInvestor` or navigation).

## Phase 10: Admin Polish & Logout Fix

### Goal

Remove redundant UI elements and fix the logout flow to ensure clean session termination.

### Frontend Changes

#### [MODIFY] [AdminConsolePage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/AdminConsolePage.tsx)

- Remove the "Investor View" button from the sidebar (bottom section).

#### [MODIFY] [App.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/App.tsx)

- Update `handleLogout` to async function.
- Call `POST /auth/logout` with `refreshToken` before clearing local storage.
- Ensure strict cleanup of all auth-related local storage items.

### Investigation

- Investigate "Owl" blocking behavior (likely `LoginPage` or `SessionExpiredPage` logic) to ensure rapid re-login works smoothly.

## Phase 11: Fix Rapid Re-login Race Condition

### Goal

Prevent "Security Owl" (Session Expired) from appearing during valid rapid re-login by fixing race condition in `App.tsx`.

### Investigation Findings

- **Issue:** `RouteGuard` logic aggressively redirects to `/session-expired` if `userRole` is missing when accessing admin routes. During rapid re-login, the state might be briefly null while verifying.
- **Root Cause:** In `App.tsx`, `RouteGuard` has this logic:

  ```typescript
  if (userRole === null) {
    if (requiredRole === 'admin') return <Navigate to="/session-expired" replace />;
    return <Navigate to="/login" replace />;
  }
  ```

  This means ANY unauthenticated access to `/admin` goes to the Owl, even if it's just a cold start or a fresh login before state settles.

### Changes

#### [MODIFY] [App.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/App.tsx)

- Update `RouteGuard` logic: Only separate `session-expired` if we explicitly have a "expired" state, or just default to `/login`.
- **Change:** Redirect unauthenticated Admin access to `/login` (with `?redirect=/admin` if needed), NOT `/session-expired`.
- **Reasoning:** `/session-expired` should be for when a *valid* session dies while active, or explicit backend 401. Fresh navigation should just go to login.

#### [MODIFY] [AdminConsolePage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/AdminConsolePage.tsx)

- None needed if `RouteGuard` is fixed.

## Phase 13: Normalizing User Role Case

### Goal

Fix incorrect redirection for Admins (going to Dashboard instead of Admin Console).

### Root Cause Analysis

- **Defect:** `LoginPage.tsx` passes the raw backend user object (with `role: 'ADMIN'`) to `onLoginSuccess`.
- **Impact:** `App.tsx` expects lowercase `'admin'`. `RouteGuard` sees `userRole` ('ADMIN') != `'admin'`, so it treats the user as an Investor and redirects to `/dashboard`.

### Changes

#### [MODIFY] [LoginPage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/LoginPage.tsx)

- Update `handleLoginSuccess` logic to normalize the user object before passing it up.
- Construct `normalizedUser` with `role: 'admin' | 'investor'`.
- Pass `normalizedUser` to `onLoginSuccess`.

### Verification Plan

- Login as Admin.
- Verify redirection goes to `/admin`.
- Verify `App` state holds lowercase role.

## Phase 14: Profile Page Redesign

### Goal

Create a standalone, Duolingo-inspired Profile Page without global header/footer.

### Design Requirements

- **Layout:** Standalone (No Navbar/Footer).
- **Style:** Playful, "Duolingo-like", card-based, friendly visuals.
- **Content:** User stats, gamification elements (XP, level - visual only if backend support missing), clear actions.

### Changes

#### [MODIFY] [App.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/App.tsx)

- Add `/profile` to `isStandaloneRoute` to hide Header/Footer.

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/ProfilePage.tsx)

- Complete rewrite of the UI.
- Remove internal header bar.
- Implement "Hero" section with Avatar.
- Add "Stats" cards (Streaks, Wins, etc.).
- Add "Settings/Edit" controls in a friendly way.

### Verification Plan

- Navigate to `/profile`.
- Verify no Header/Footer.
- Check responsive playful design.

## Phase 15: Restore Profile Functionality

### Goal

Merge the playful "Duolingo" design with the robust functionality of the original profile page.

### Missing Features to Restore

- **Financial Data:** Withdrawal methods, currency.
- **Interactive Toggles:** Real state for 2FA, Biometrics, Notifications.
- **Detailed Security:** Password last changed date, ID Hash.
- **Save Workflow:** Explicit save action or clear auto-save feedback.

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/ProfilePage.tsx)

- Expand "Overview" to include Financial snapshots.
- Transform "Settings" view into a detailed, interactive control panel (not just a menu).
- Re-add state variables (`notifications`, `biometrics`, `2fa`).
- Use `TiltCard` for the main ID section again (hybrid of new Hero + old ID card).

### Verification Plan

- Verify "Financial Data" is visible.
- Click toggles and verify visual state change.
- Check "Save" button appearance/behavior.

## Phase 16: Final Profile Polish (Restoring "Lost" Features)

### Goal

Bring back specific details and interactivity from the original design that were lost in the redesign, ensuring 100% feature parity.

### Missing Features to Restore

- **Visuals:** Avatar "Scan" animation, "Clearance Level" indicator, "High Security" badge.
- **Data:** "Sesiuni" (Sessions) counter.
- **Settings:** "Rapoarte Zilnice" (Daily Reports), "Sunete Interfață" (UI Sounds).
- **Actions:** Explicit "Update" buttons for Password and Financials (previously present).

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/tomiz/Desktop/-home-u45947pari/pariaza-inteligent/components/ProfilePage.tsx)

- Add "Scan" animation css/div to Avatar.
- Add "Clearance Level" to Hero/ID Card.
- Add "High Security" badge to Settings header.
- Add missing toggles to Settings section.
- Add "Sesiuni" to Stats grid.

### Verification Plan

- Visually verify Scan animation.
- Check all 5 toggles are present.
- Verify "Clearance Level" is visible.
