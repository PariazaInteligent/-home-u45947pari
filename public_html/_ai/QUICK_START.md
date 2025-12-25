# QUICK START - Next Session

## ⚡ Start Here

**Date:** 2025-12-25 17:22  
**Progress:** 63% (1.9/3 tasks complete)

---

## 🚨 BLOCKER - Fix This First

**Problem:** API server won't start (corrupted file)

**Quick Fix (5 minutes):**

```bash
# 1. Kill all node processes
taskkill /F /IM node.exe

# 2. Reset corrupted file
git checkout apps/api/src/services/email.service.ts

# 3. Open file in VS Code
code apps\api\src\services\email.service.ts

# 4. Find line ~568 (method generateTicketId)

# 5. After the closing } of generateTicketId(), BEFORE "export const emailService"
#    Paste this code:

  async sendRejectionEmail(user: EmailUser): Promise<boolean> {
    this.initialize();
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Skipping rejection email');
      return false;
    }
    try {
      const html = this.getRejectionEmailTemplate(user);
      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: '📋 Cererea Ta de Înregistrare - Actualizare',
        html,
      });
      console.log(`✅ Rejection email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Rejection email failed:`, error);
      return false;
    }
  }

  private getRejectionEmailTemplate(user: EmailUser): string {
    return `<!DOCTYPE html>
<html lang="ro">
<body style="margin:0;padding:0;background:#FEE2E2;font-family:sans-serif">
  <div style="max-width:600px;margin:40px auto;background:white;border-radius:20px">
    <div style="background:#DC2626;color:white;padding:30px;text-align:center">
      <h1>Cererea Ta de Înregistrare</h1>
    </div>
    <div style="padding:30px">
      <p>Bună ${user.name || 'investitorule'},</p>
      <p>Din păcate, cererea ta nu a fost aprobată.</p>
      <div style="background:#FEF2F2;padding:15px;border-radius:8px;margin:20px 0">
        <strong>ℹ️ De ce?</strong><br>Criteriile de eligibilitate.
      </div>
      <div style="background:#DBEAFE;padding:15px;border-radius:8px;text-align:center">
        <strong>Întrebări?</strong><br>
        <a href="mailto:support@pariazainteligent.ro">support@pariazainteligent.ro</a>
      </div>
      <p>Mulțumim!</p>
      <p><strong>Echipa Pariază Inteligent</strong></p>
    </div>
  </div>
</body>
</html>`;
  }

# 6. Save (Ctrl+S)

# 7. Restart servers
.\start-dev.bat

# 8. Wait 10 seconds, then test:
curl http://localhost:3001/health
# Should return {"status":"ok"}
```

**Verify API works:**

- Open browser: <http://localhost:3000>
- Should load WITHOUT database connection errors
- Login as admin and test rejection email

---

## ✅ What's Already Done

1. **Admin Redirect Fix** - 100% complete
   - File: `pariaza-inteligent/components/admin/AdminOverview.tsx`
   - Just needs browser refresh to test

2. **Rejection Email** - 90% complete
   - Endpoint ready: `apps/api/src/routes/admin.routes.ts`
   - Just needs method in email.service.ts (see above)

---

## 🎯 Next Task

### Task 3: Password Setup System (60 min)

After fixing blocker, implement password setup:

1. **Schema Update** - Add fields:

   ```sql
   ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
   ALTER TABLE users ADD COLUMN password_reset_expiry DATETIME;
   ALTER TABLE users ADD COLUMN password_set_at DATETIME;
   ```

2. **Activation Email** - Add set-password link

3. **Set Password Page** - Create `/set-password?token=XXX`

4. **API Endpoint** - `POST /auth/set-password`

5. **Admin Approve** - Generate token on approval

---

## 📚 Full Documentation

See these files for details:

- `_ai/session_summary_2025-12-25.md` - Complete summary
- `_ai/active_tasks.md` - Task breakdown
- `brain/.../implementation_plan.md` - Detailed implementation plan
- `brain/.../walkthrough.md` - What's been implemented

---

## 🔑 Credentials

**Admin:**

- Email: `admin@pariazainteligent.ro`
- Password: `password123`

**Test Email:** `tomizeimihaita@gmail.com`

---

**Good luck! 🚀**
