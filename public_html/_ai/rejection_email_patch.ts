// ==================== ADD TO email.service.ts ====================

  /**
   * Send rejection email (when admin rejects)
   */
  async sendRejectionEmail(user: EmailUser): Promise < boolean > {
    // Lazy init on first use
    this.initialize();

    if(!this.isConfigured || !this.transporter) {
    console.log('📧 Skipping rejection email - service not configured');
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
    console.error(`❌ Failed to send rejection email to ${user.email}:`, error);
    return false;
}
  }

  private getRejectionEmailTemplate(user: EmailUser): string {
    return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cererea Ta de Înregistrare</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #FEE2E2, #FECACA, #FCA5A5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Prof. Investino Mascot - Thoughtful -->
        <div style="margin-bottom: 20px; text-align: center;">
          <div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">🦉</div>
          <div style="background: white; border: 3px solid #DC2626; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <p style="color: #DC2626; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.4;">
              👋 Hei! Am o veste importantă despre cererea ta de înregistrare. Citește mai jos pentru detalii.
            </p>
          </div>
        </div>

        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #DC2626, #B91C1C); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                Cererea Ta de Înregistrare
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
                Bună ${user.name || 'investitorule'},
              </p>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
                Din păcate, cererea ta de înregistrare pe platforma <strong>Pariază Inteligent</strong> nu a putut fi aprobată în acest moment.
              </p>

              <!-- Info Box -->
              <div style="background: #FEF2F2; border: 2px solid #FCA5A5; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <p style="color: #991B1B; font-size: 14px; font-weight: 600; margin: 0; line-height: 1.6;">
                  <strong>ℹ️ De ce?</strong><br>
                  Această decizie a fost luată în urma analizării criteriilor noastre de eligibilitate și nu reflectă calitatea ta ca investitor.
                </p>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
                Înțelegem că aceasta poate fi o dezamăgire, dar dorim să menținem standardele comunității noastre la cel mai înalt nivel.
              </p>

              <!-- Contact Box -->
              <div style="background: #DBEAFE; border: 2px solid #3B82F6; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
                <p style="color: #1E40AF; font-size: 14px; font-weight: 700; margin: 0 0 10px;">
                  💬 Ai întrebări sau nelămuriri?
                </p>
                <p style="color: #374151; font-size: 15px; margin: 0;">
                  Contactează-ne la <a href="mailto:support@pariazainteligent.ro" style="color: #3B82F6; text-decoration: none; font-weight: 700;">support@pariazainteligent.ro</a>
                </p>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 30px 0 0;">
                Î ți mulțumim pentru interesul acordat platformei noastre și îți dorim mult succes în viitor!
              </p>

              <p style="color: #6B7280; font-size: 15px; margin: 30px 0 0;">
                Cu respect,<br>
                <strong style="color: #374151;">Echipa Pariază Inteligent</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F9FAFB; padding: 25px 30px; text-align: center; border-top: 2px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 13px; margin: 0 0 5px; font-weight: 600;">
                © 2025 Pariază Inteligent. Toate drepturile rezervate.
              </p>
              <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
                Acest email a fost trimis automat. Te rugăm să nu răspunzi direct.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
}

// ==================== END ====================
