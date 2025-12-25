# Fix pentru email.service.ts

API-ul nu pornește din cauza unor caractere corupte în fișier.

## Pași pentru Fix

1. **Deschide:** `apps\api\src\services\email.service.ts`

2. **Găsește metoda:** `generateTicketId()` (aproape de sfârșitul fișierului)

3. **După închiderea acestei metode** (după ultimul `}` al metodei `generateTicketId`), **ÎNAINTE de linia:**

   ```typescript
   export const emailService = new EmailService();
   ```

4. **Adaugă EXACT acest cod** (copy-paste):

```typescript
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
        subject: '📋 Cererea Ta de Înregistrare',
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
    return `<!DOCTYPE html><html><body style="background:#FEE2E2;font-family:sans-serif;padding:40px"><div style="max-width:600px;margin:0 auto;background:white;border-radius:20px;overflow:hidden"><div style="background:#DC2626;color:white;padding:30px;text-align:center"><h1>Cererea Ta</h1></div><div style="padding:30px"><p>Bună ${user.name || 'investitorule'},</p><p>Din păcate, cererea ta nu a fost aprobată.</p><p style="background:#FEF2F2;padding:15px;border-radius:8px">Această decizie a fost luată după analizarea criteriilor noastre.</p><p style="background:#DBEAFE;padding:15px;border-radius:8px;text-align:center"><strong>Ai întrebări?</strong><br><a href="mailto:support@pariazainteligent.ro">support@pariazainteligent.ro</a></p><p>Îți mulțumim!</p><p><strong>Echipa Pariază Inteligent</strong></p></div></div></body></html>`;
  }
```

1. **Salvează fișierul**

2. **Verifică** că API-ul pornește (ar trebui să dispară erorile)
