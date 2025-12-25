const fs = require('fs');
const path = require('path');

const emailServicePath = path.join(__dirname, '..', 'apps', 'api', 'src', 'services', 'email.service.ts');

console.log('Reading email.service.ts...');
let content = fs.readFileSync(emailServicePath, 'utf8');

// Remove any corrupted content from failed patch attempts
const exportLine = 'export const emailService = new EmailService();';
const exportIndex = content.lastIndexOf(exportLine);

if (exportIndex === -1) {
    console.error('ERROR: Could not find export line!');
    process.exit(1);
}

// Extract everything before export
let beforeExport = content.substring(0, exportIndex);

// Remove any partial/corrupted rejection email code
beforeExport = beforeExport.replace(/async sendRejectionEmail[\s\S]*?getRejectionEmailTemplate[\s\S]*?(\n\s*}[\s]*\n)/g, '');

// Clean up any trailing issues
beforeExport = beforeExport.trim();

// Add the new methods
const newMethods = `
  async sendRejectionEmail(user: EmailUser): Promise<boolean> {
    this.initialize();
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Skipping rejection email - service not configured');
      return false;
    }
    try {
      const html = this.getRejectionEmailTemplate(user);
      await this.transporter.sendMail({
        from: \`"\${process.env.SMTP_FROM_NAME}" <\${process.env.SMTP_FROM_EMAIL}>\`,
        to: user.email,
        subject: '📋 Cererea Ta de Înregistrare - Actualizare',
        html,
      });
      console.log(\`✅ Rejection email sent to \${user.email}\`);
      return true;
    } catch (error) {
      console.error(\`❌ Failed to send rejection email to \${user.email}:\`, error);
      return false;
    }
  }

  private getRejectionEmailTemplate(user: EmailUser): string {
    return \`<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Cererea Ta de Înregistrare</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #FEE2E2, #FCA5A5); font-family: sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr><td align="center">
      <div style="margin-bottom: 20px; text-align: center;">
        <div style="font-size: 80px;">🦉</div>
        <div style="background: white; border: 3px solid #DC2626; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto;">
          <p style="color: #DC2626; font-size: 18px; font-weight: 700; margin: 0;">
            👋 Am o veste importantă despre cererea ta de înregistrare.
          </p>
        </div>
      </div>
      <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px;">
        <tr>
          <td style="background: linear-gradient(135deg, #DC2626, #B91C1C); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800;">Cererea Ta de Înregistrare</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 25px;">Bună \${user.name || 'investitorule'},</p>
            <p style="color: #374151; font-size: 16px; margin: 0 0 25px;">Din păcate, cererea ta de înregistrare pe platforma <strong>Pariază Inteligent</strong> nu a putut fi aprobată în acest moment.</p>
            <div style="background: #FEF2F2; border: 2px solid #FCA5A5; border-radius: 12px; padding: 20px; margin: 25px 0;">
              <p style="color: #991B1B; font-size: 14px; margin: 0;"><strong>ℹ️ De ce?</strong><br>Această decizie a fost luată în urma analizării criteriilor noastre de eligibilitate.</p>
            </div>
            <div style="background: #DBEAFE; border: 2px solid #3B82F6; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
              <p style="color: #1E40AF; font-size: 14px; font-weight: 700; margin: 0 0 10px;">💬 Ai întrebări?</p>
              <p style="color: #374151; margin: 0;">Contactează-ne la <a href="mailto:support@pariazainteligent.ro" style="color: #3B82F6;">support@pariazainteligent.ro</a></p>
            </div>
            <p style="color: #374151; margin: 30px 0 0;">Îți mulțumim pentru interesul acordat platformei noastre!</p>
            <p style="color: #6B7280; margin: 30px 0 0;">Cu respect,<br><strong>Echipa Pariază Inteligent</strong></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>\`;
  }
`;

// Reconstruct file
const newContent = beforeExport + '\n' + newMethods + '\n}\n\n// Export singleton instance\n' + exportLine + '\n';

// Write back
fs.writeFileSync(emailServicePath, newContent, 'utf8');

console.log('✅ email.service.ts patched successfully!');
console.log('Please restart the API server.');
