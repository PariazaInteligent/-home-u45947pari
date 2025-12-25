$emailServiceFile = "c:\Users\tomiz\Desktop\-home-u45947pari\public_html\apps\api\src\services\email.service.ts"
$adminRoutesFile = "c:\Users\tomiz\Desktop\-home-u45947pari\public_html\apps\api\src\routes\admin.routes.ts"

Write-Host "=== Patching Email Service ===" -ForegroundColor Cyan

# Read content
$content = Get-Content $emailServiceFile -Raw

# Find the line before export
$exportLine = "export const emailService = new EmailService();"
$position = $content.LastIndexOf($exportLine)

if ($position -lt 0) {
    Write-Host "ERROR: Could not find export line!" -ForegroundColor Red
    exit 1
}

# Prepare the new method to insert
$newMethod = @"

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
        from: `"`${process.env.SMTP_FROM_NAME}`" <`${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: '📋 Cererea Ta de Înregistrare - Actualizare',
        html,
      });
      console.log(`✅ Rejection email sent to `${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send rejection email to `${user.email}:`, error);
      return false;
    }
  }

  private getRejectionEmailTemplate(user: EmailUser): string {
    return ``<!DOCTYPE html>
<html lang="ro">
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #FEE2E2, #FCA5A5); font-family: sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr><td align="center">
      <div style="margin-bottom: 20px; text-align: center;">
        <div style="font-size: 80px;">🦉</div>
        <div style="background: white; border: 3px solid #DC2626; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto;">
          <p style="color: #DC2626; font-size: 18px; font-weight: 700; margin: 0;">
            👋 Am o veste importantă despre cererea ta.
          </p>
        </div>
      </div>
      <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px;">
        <tr><td style="background: linear-gradient(135deg, #DC2626, #B91C1C); padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800;">Cererea Ta de Înregistrare</h1>
        </td></tr>
        <tr><td style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 25px;">Bună `${user.name || 'investitorule'}`,</p>
          <p style="color: #374151; font-size: 16px; margin: 0 0 25px;">Din păcate, cererea ta de înregistrare pe platforma <strong>Pariază Inteligent</strong> nu a putut fi aprobată în acest moment.</p>
          <div style="background: #FEF2F2; border: 2px solid #FCA5A5; border-radius: 12px; padding: 20px; margin: 25px 0;">
            <p style="color: #991B1B; font-size: 14px; margin: 0;"><strong>ℹ️ De ce?</strong><br>Această decizie a fost luată în urma analizării criteriilor noastre de eligibilitate.</p>
          </div>
          <div style="background: #DBEAFE; border: 2px solid #3B82F6; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
            <p style="color: #1E40AF; font-size: 14px; font-weight: 700; margin: 0 0 10px;">💬 Ai întrebări?</p>
            <p style="color: #374151; margin: 0;">Contactează-ne la <a href="mailto:support@pariazainteligent.ro" style="color: #3B82F6;">support@pariazainteligent.ro</a></p>
          </div>
          <p style="color: #374151; margin: 30px 0 0;">Îți mulțumim pentru interes!</p>
          <p style="color: #6B7280; margin: 30px 0 0;">Cu respect,<br><strong>Echipa Pariază Inteligent</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>``;
  }

"@

# Insert before export
$newContent = $content.Substring(0, $position) + $newMethod + $content.Substring($position)

# Write back
Set-Content $emailServiceFile -Value $newContent -NoNewline

Write-Host "✅ Email service patched successfully!" -ForegroundColor Green

Write-Host "`n=== Patching Admin Routes ===" -ForegroundColor Cyan

# Read admin routes
$adminContent = Get-Content $adminRoutesFile -Raw

# Find and replace the reject endpoint
$oldReject = @"
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        // Delete the user
        await prisma.user.delete({
            where: { id },
        });

        reply.send({ message: 'User rejected and deleted' });
    });
"@

$newReject = @"
    }, async (request, reply) => {
        const { id } = request.params as { id: string };

        // Get user details BEFORE deleting
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true },
        });

        if (!user) {
            return reply.code(404).send({ error: 'User not found' });
        }

        // Delete the user
        await prisma.user.delete({
            where: { id },
        });

        // Send rejection email
        try {
            await emailService.sendRejectionEmail({
                id: user.id,
                name: user.name || user.email,
                email: user.email,
            });
            console.log(`📧 Rejection email sent to `${user.email}`);
        } catch (emailError) {
            console.error('❌ Failed to send rejection email:', emailError);
        }

        reply.send({ message: 'User rejected and deleted' });
    });
"@

if ($adminContent.Contains("Delete the user")) {
    $adminContent = $adminContent.Replace($oldReject, $newReject)
    Set-Content $adminRoutesFile -Value $adminContent -NoNewline
    Write-Host "✅ Admin routes patched successfully!" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Could not find target in admin routes - manual patch needed" -ForegroundColor Yellow
}

Write-Host "`n=== DONE! ===" -ForegroundColor Green
Write-Host "Please restart the API server (npm run dev in apps/api)" -ForegroundColor Cyan
