import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailUser {
  id: string;
  name: string;
  email: string;
}

interface ReferrerDetails {
  name: string;
  email: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASSWORD,
      SMTP_FROM_NAME,
      SMTP_FROM_EMAIL,
    } = process.env;

    // Debug: Check which env vars are loaded
    console.log('ðŸ” Email Config Check:', {
      SMTP_HOST: SMTP_HOST ? 'SET' : 'MISSING',
      SMTP_PORT: SMTP_PORT ? 'SET' : 'MISSING',
      SMTP_USER: SMTP_USER ? 'SET' : 'MISSING',
      SMTP_PASSWORD: SMTP_PASSWORD ? 'SET' : 'MISSING',
    });

    // Check if SMTP is configured
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
      console.warn('âš ï¸ SMTP not configured. Email service disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '465', 10),
        secure: SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false, // For self-signed certificates
        },
      });

      this.isConfigured = true;
      console.log('âœ… Email service initialized successfully');
    } catch (error) {
      console.error('âŒ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send welcome email for instant activation (with valid invitation code)
   */
  async sendWelcomeEmail(user: EmailUser, referrer?: ReferrerDetails): Promise<boolean> {
    // Lazy init on first use
    this.initialize();

    if (!this.isConfigured || !this.transporter) {
      console.log('ðŸ“§ Skipping welcome email - service not configured');
      return false;
    }

    try {
      const html = this.getWelcomeEmailTemplate(user, referrer);

      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: 'ðŸŽ‰ Bun Venit! Contul TÄƒu Este Activ',
        html,
      });

      console.log(`âœ… Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`âŒ Failed to send welcome email to ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Send pending verification email (registration without valid code)
   */
  async sendPendingEmail(user: EmailUser, ticketId: string): Promise<boolean> {
    // Lazy init on first use
    this.initialize();

    if (!this.isConfigured || !this.transporter) {
      console.log('ðŸ“§ Skipping pending email - service not configured');
      return false;
    }

    try {
      const html = this.getPendingEmailTemplate(user, ticketId);

      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: 'â³ Cererea Ta Este Ã®n Procesare',
        html,
      });

      console.log(`âœ… Pending email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`âŒ Failed to send pending email to ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Send account activation email (when admin approves)
   */
  async sendActivationEmail(user: EmailUser): Promise<boolean> {
    // Lazy init on first use
    this.initialize();

    if (!this.isConfigured || !this.transporter) {
      console.log('ðŸ“§ Skipping activation email - service not configured');
      return false;
    }

    try {
      const html = this.getActivationEmailTemplate(user);

      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: 'âœ… Contul TÄƒu A Fost Activat!',
        html,
      });

      console.log(`âœ… Activation email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`âŒ Failed to send activation email to ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<boolean> {
    // Lazy init on first use
    this.initialize();

    if (!this.isConfigured || !this.transporter) {
      console.log('âŒ Cannot test connection - service not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('âœ… SMTP connection test successful');
      return true;
    } catch (error) {
      console.error('âŒ SMTP connection test failed:', error);
      return false;
    }
  }

  /**
   * Generic email sending method for broadcasts
   */
  async sendEmail(options: { to: string; subject: string; html: string }): Promise<boolean> {
    // Lazy init on first use
    this.initialize();

    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Skipping email - service not configured');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `\"${process.env.SMTP_FROM_NAME}\" <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`✅ Email sent to ${options.to}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Broadcast email template (Duolingo style)
   */
  /**
   * Broadcast email template with context-aware designs
   */
  getBroadcastEmailTemplate(subject: string, message: string, adminName: string, design: string = 'standard'): string {
    const platformUrl = process.env.PLATFORM_URL || 'http://localhost:3000';
    const unsubscribeUrl = `${platformUrl}/profile`;

    // Design configurations
    const designs: any = {
      standard: {
        bgGradient: 'linear-gradient(to bottom right, #E0F2FE, #BAE6FD, #7DD3FC)',
        headerBg: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
        emoji: '📧 owl', // Special handling
        mascotBorder: '#0EA5E9',
        cardTitleColor: '#0EA5E9',
        textColor: '#0C4A6E',
      },
      celebration: {
        bgGradient: 'linear-gradient(to bottom right, #ECFCCB, #D9F99D, #BEF264)',
        headerBg: 'linear-gradient(135deg, #84CC16, #65A30D)',
        emoji: '🎉',
        mascotBorder: '#84CC16',
        cardTitleColor: '#84CC16',
        textColor: '#1A2E05',
      },
      premium: {
        bgGradient: 'linear-gradient(to bottom right, #FEF9C3, #FEF08A, #FDE047)',
        headerBg: 'linear-gradient(135deg, #EAB308, #CA8A04)',
        emoji: '💎',
        mascotBorder: '#EAB308',
        cardTitleColor: '#EAB308',
        textColor: '#422006',
      },
      alert: {
        bgGradient: 'linear-gradient(to bottom right, #FEE2E2, #FECACA, #FCA5A5)',
        headerBg: 'linear-gradient(135deg, #EF4444, #DC2626)',
        emoji: '⚠️',
        mascotBorder: '#EF4444',
        cardTitleColor: '#EF4444',
        textColor: '#7F1D1D',
      },
      newsletter: {
        bgGradient: 'linear-gradient(to bottom right, #F3E8FF, #E9D5FF, #D8B4FE)',
        headerBg: 'linear-gradient(135deg, #A855F7, #9333EA)',
        emoji: '📰',
        mascotBorder: '#A855F7',
        cardTitleColor: '#A855F7',
        textColor: '#3B0764',
      }
    };

    const config = designs[design] || designs.standard;

    // Custom mascot logic based on design
    let mascotHtml = '';
    if (design === 'celebration') {
      mascotHtml = '<div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">🦉🎊</div>';
    } else if (design === 'alert') {
      mascotHtml = '<div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">🦉⚠️</div>';
    } else if (design === 'premium') {
      mascotHtml = '<div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">🦉💎</div>';
    } else {
      mascotHtml = '<div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">📧🦉</div>';
    }

    return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background: ${config.bgGradient}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <div style="margin-bottom: 20px; text-align: center;">
          ${mascotHtml}
          <div style="background: white; border: 3px solid ${config.mascotBorder}; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <p style="color: ${config.cardTitleColor}; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.4;">📣 NOTIFICARE IMPORTANTĂ! 🎯</p>
          </div>
        </div>
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          <tr>
            <td style="background: ${config.headerBg}; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">${subject}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <div style="background: ${config.bgGradient}; border: 3px solid ${config.mascotBorder}; border-radius: 16px; padding: 30px; margin: 0 0 30px;">
                <div style="color: ${config.textColor}; font-size: 16px; line-height: 1.8; margin: 0;">${message}</div>
              </div>
              
              <!-- Footer Action -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${platformUrl}" style="display: inline-block; background: ${config.headerBg}; color: white; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: all 0.3s;">
                      🚀 INTRA ÎN CONT
                    </a>
                  </td>
                </tr>
              </table>

              <div style="text-align: right; margin-top: 30px; padding-top: 20px; border-top: 2px solid #E5E7EB;">
                <p style="color: #6B7280; font-size: 14px; margin: 0; font-weight: 600;">📝 Trimis de: <strong style="color: ${config.cardTitleColor};">${adminName}</strong></p>
                <p style="color: #9CA3AF; font-size: 12px; margin: 5px 0 0 0;">🦉 Echipa Pariază Inteligent</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background: #F8FAFC; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0 0 10px 0; color: #64748B; font-size: 12px;">Primești acest email pentru că ai activat notificările email.</p>
              <p style="margin: 0; color: #64748B; font-size: 12px;"><a href="${unsubscribeUrl}" style="color: ${config.cardTitleColor}; text-decoration: none; font-weight: 600;">Dezactivează notificările</a> din pagina de profil.</p>
              <p style="margin: 15px 0 0 0; color: #94A3AF; font-size: 11px;">&copy; ${new Date().getFullYear()} Pariază Inteligent. Toate drepturile rezervate.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // ==================== EMAIL TEMPLATES ====================

  private getWelcomeEmailTemplate(user: EmailUser, referrer?: ReferrerDetails): string {
    const platformUrl = process.env.PLATFORM_URL || 'http://localhost:3000';
    const loginUrl = `${platformUrl}/login`;

    return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bun Venit!</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #E0F2FE, #F3E8FF, #FEF3C7); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Prof. Investino Mascot -->
        <div style="margin-bottom: 20px; text-align: center;">
          <div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">ðŸ¦‰</div>
          <div style="background: white; border: 3px solid #10B981; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <p style="color: #10B981; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.4;">
              ðŸŽ‰ Yay! Contul tÄƒu este ACTIV! Bine ai venit Ã®n familia noastrÄƒ de investitori! Hai sÄƒ Ã®ncepem aventura!
            </p>
          </div>
        </div>

        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10B981, #059669); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                Bine ai venit, ${user.name}! ðŸ’š
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Success Badge -->
              <div style="background: linear-gradient(135deg, #D1FAE5, #A7F3D0); border: 2px solid #10B981; border-radius: 16px; padding: 20px; margin: 0 0 30px; text-align: center;">
                <p style="color: #065F46; font-size: 14px; font-weight: 700; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1.5px;">
                  âœ… INSTANT ACCESS - COD VALID!
                </p>
                <p style="color: #047857; font-size: 18px; font-weight: 600; margin: 0;">
                  Contul tÄƒu este <strong>100% ACTIV</strong> È™i gata de utilizare!
                </p>
              </div>

              ${referrer ? `
              <div style="background: linear-gradient(135deg, #F3E8FF, #E9D5FF); border: 2px solid #A855F7; border-radius: 16px; padding: 20px; margin: 0 0 30px;">
                <p style="color: #6B21A8; font-size: 13px; font-weight: 700; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">
                  ðŸŽ INVITAT DE
                </p>
                <p style="color: #7C3AED; font-size: 16px; font-weight: 600; margin: 0;">
                  <strong>${referrer.name}</strong> te-a invitat sÄƒ faci parte din comunitate! ðŸ¤
                </p>
              </div>
              ` : ''}

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                PlatformÄƒ de investiÈ›ii sportive bazatÄƒ pe analizÄƒ statisticÄƒ avansatÄƒ este acum disponibilÄƒ pentru tine! ðŸ“Š
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); transition: all 0.3s;">
                      ðŸš€ EXPLOREAZÄ‚ DASHBOARD-UL
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Login Info -->
              <div style="background: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="color: #6B7280; font-size: 12px; font-weight: 700; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                  ðŸ” CREDENÈšIALELE TALE
                </p>
                <p style="color: #374151; font-size: 15px; margin: 0 0 8px; text-align: center;">
                  <strong>Email:</strong> ${user.email}
                </p>
                <p style="color: #374151; font-size: 15px; margin: 0; text-align: center;">
                  <strong>ParolÄƒ:</strong> Parola aleasÄƒ la Ã®nregistrare
                </p>
              </div>

              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                ÃŽntÃ¢mpini probleme? Scrie-ne la <a href="mailto:support@pariazainteligent.ro" style="color: #10B981; text-decoration: none; font-weight: 600;">support@pariazainteligent.ro</a> ðŸ’Œ
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F9FAFB; padding: 25px 30px; text-align: center; border-top: 2px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 13px; margin: 0 0 5px; font-weight: 600;">
                Â© 2025 PariazÄƒ Inteligent. Toate drepturile rezervate.
              </p>
              <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
                Acest email a fost trimis automat. Te rugÄƒm sÄƒ nu rÄƒspunzi direct.
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

  private getPendingEmailTemplate(user: EmailUser, ticketId: string): string {
    const platformUrl = process.env.PLATFORM_URL || 'http://localhost:3000';

    return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cererea Ta Est Ã®n Procesare</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #FAE8FF, #FED7AA, #FECACA); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Prof. Investino Mascot -->
        <div style="margin-bottom: 20px; text-align: center;">
          <div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">ðŸ¦‰</div>
          <div style="background: white; border: 3px solid #A855F7; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <p style="color: #A855F7; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.4;">
              ðŸ‘‹ Hei! Nu te Ã®ngrijora! Cererea ta e la noi È™i o verificÄƒm cu atenÈ›ie. Administratorii noÈ™tri sunt super rapizi! âš¡
            </p>
          </div>
        </div>

        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #A855F7, #7C3AED); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                Cerere PrimitÄƒ, ${user.name}! ðŸ’œ
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Waiting Badge -->
              <div style="background: linear-gradient(135deg, #F3E8FF, #E9D5FF); border: 2px solid #A855F7; border-radius: 16px; padding: 20px; margin: 0 0 30px; text-align: center;">
                <p style="color: #6B21A8; font-size: 14px; font-weight: 700; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1.5px;">
                  â° ÃŽN CURS DE VERIFICARE - Gata Ã®n 24-48h!
                </p>
                <p style="color: #7C3AED; font-size: 18px; font-weight: 600; margin: 0;">
                  VerificÄƒm fiecare cerere personal pentru siguranÈ›a tuturor! ðŸ’ª
                </p>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                Cererea ta a fost Ã®nregistratÄƒ cu succes! Un administrator o va verifica Ã®n cel mult <strong>48 de ore</strong>. ðŸ“‹
              </p>

              <!-- Ticket ID Box -->
              <div style="background: linear-gradient(135deg, #DDD6FE, #C4B5FD); border: 3px solid #A855F7; border-radius: 20px; padding: 30px; margin: 30px 0; text-align: center;">
                <p style="color: #6B21A8; font-size: 14px; font-weight: 700; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 2px;">
                  ðŸŽ« CODUL TÄ‚U DE AÈ˜TEPTARE
                </p>
                <p style="color: #7C3AED; font-size: 36px; font-weight: 900; margin: 0 0 20px; font-family: monospace; letter-spacing: 3px; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
                  ${ticketId}
                </p>
                <div style="background: white; border-radius: 12px; padding: 15px; margin-top: 20px;">
                  <p style="color: #6B7280; font-size: 13px; font-weight: 600; margin: 0;">
                    â±ï¸ Timp estimat: <strong style="color: #A855F7;">24-48 ore</strong>
                  </p>
                </div>
              </div>

              <!-- Encouragement -->
              <div style="background: #FEF3C7; border: 2px solid #FCD34D; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="color: #92400E; font-size: 14px; font-weight: 600; margin: 0; text-align: center; line-height: 1.6;">
                  <strong>ðŸ’¡ È˜tiai cÄƒ:</strong> VerificÄƒm personal fiecare cerere pentru a proteja comunitatea noastrÄƒ de investitori. MulÈ›umim pentru rÄƒbdare! ðŸ™
                </p>
              </div>

              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                ÃŽntrebÄƒri? Trimite-ne un email la <a href="mailto:support@pariazainteligent.ro" style="color: #A855F7; text-decoration: none; font-weight: 600;">support@pariazainteligent.ro</a> ðŸ’Œ
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F9FAFB; padding: 25px 30px; text-align: center; border-top: 2px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 13px; margin: 0 0 5px; font-weight: 600;">
                Â© 2025 PariazÄƒ Inteligent. Toate drepturile rezervate.
              </p>
              <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
                Acest email a fost trimis automat. Te rugÄƒm sÄƒ nu rÄƒspunzi direct.
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

  private getActivationEmailTemplate(user: EmailUser): string {
    const platformUrl = process.env.PLATFORM_URL || 'http://localhost:3000';
    const loginUrl = `${platformUrl}/login`;

    return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contul TÄƒu A Fost Activat!</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #D1FAE5, #A7F3D0, #6EE7B7); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Prof. Investino Mascot - Super Happy! -->
        <div style="margin-bottom: 20px; text-align: center;">
          <div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">ðŸ¦‰âœ¨</div>
          <div style="background: white; border: 3px solid #10B981; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <p style="color: #10B981; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.4;">
              ðŸŽŠ FELICITÄ‚RI! Ai fost aprobat! EÈ™ti acum parte din echipa noastrÄƒ! PregÄƒteÈ™te-te pentru o cÄƒlÄƒtorie incredibilÄƒ! ðŸš€
            </p>
          </div>
        </div>

        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10B981, #059669); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">ðŸŽ‰</div>
              <h1 style="margin: 0; color: white; font-size: 36px; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                Cont Activat, ${user.name}!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Success Badge -->
              <div style="background: linear-gradient(135deg, #D1FAE5, #A7F3D0); border: 3px solid #10B981; border-radius: 16px; padding: 25px; margin: 0 0 30px; text-align: center;">
                <p style="color: #065F46; font-size: 14px; font-weight: 700; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1.5px;">
                  âœ… CONT ACTIVAT - 100% Verified!
                </p>
                <p style="color: #047857; font-size: 20px; font-weight: 700; margin: 0;">
                  Contul tÄƒu a fost verificat È™i aprobat! ðŸ’š
                </p>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                Bine ai venit Ã®n comunitatea de investitori inteligenÈ›i! Platforma ta este acum complet accesibilÄƒ. ðŸŒŸ
              </p>

              <!-- Features List with Emoji -->
              <div style="background: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 16px; padding: 25px; margin: 30px 0;">
                <p style="color: #6B7280; font-size: 13px; font-weight: 700; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                  ðŸŽ CE POÈšI FACE ACUM:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">ðŸ“Š</span>
                        <span style="color: #374151; font-size: 15px; font-weight: 600;">Dashboard LIVE cu statistici Ã®n timp real</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">ðŸ’°</span>
                        <span style="color: #374151; font-size: 15px; font-weight: 600;">Depozite È™i retrageri instant</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">ðŸ‘¥</span>
                        <span style="color: #374151; font-size: 15px; font-weight: 600;">Chat cu comunitatea de investitori</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">ðŸ“ˆ</span>
                        <span style="color: #374151; font-size: 15px; font-weight: 600;">Strategii validate de comunitate</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Big CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; text-decoration: none; padding: 20px 60px; border-radius: 50px; font-weight: 900; font-size: 18px; text-transform: uppercase; letter-spacing: 1.2px; box-shadow: 0 15px 40px rgba(16, 185, 129, 0.5); transition: all 0.3s;">
                      ðŸŽ¯ ÃŽNCEPE ACUM!
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="background: linear-gradient(135deg, #DBEAFE, #BFDBFE); border: 2px solid #3B82F6; border-radius: 16px; padding: 25px; margin: 30px 0;">
                <p style="color: #1E40AF; font-size: 13px; font-weight: 700; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                  ðŸ“‹ URMÄ‚TORII PAÈ˜I:
                </p>
                <div style="color: #374151; font-size: 15px; line-height: 2;">
                  <div style="margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">1ï¸âƒ£</span>
                    <strong>LogheazÄƒ-te</strong> cu emailul tÄƒu
                  </div>
                  <div style="margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">2ï¸âƒ£</span>
                    <strong>ExploreazÄƒ</strong> dashboard-ul colorat
                  </div>
                  <div style="margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">3ï¸âƒ£</span>
                    <strong>AlÄƒturÄƒ-te</strong> comunitÄƒÈ›ii
                  </div>
                  <div>
                    <span style="font-size: 20px; margin-right: 10px;">4ï¸âƒ£</span>
                    <strong>ConfigureazÄƒ</strong> primul depozit
                  </div>
                </div>
              </div>

              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                ÃŽntrebÄƒri? Scrie-ne oricÃ¢nd la <a href="mailto:support@pariazainteligent.ro" style="color: #10B981; text-decoration: none; font-weight: 700;">support@pariazainteligent.ro</a> ðŸ’Œ
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F9FAFB; padding: 25px 30px; text-align: center; border-top: 2px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 13px; margin: 0 0 5px; font-weight: 600;">
                Â© 2025 PariazÄƒ Inteligent. Toate drepturile rezervate.
              </p>
              <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
                Acest email a fost trimis automat. Te rugÄƒm sÄƒ nu rÄƒspunzi direct.
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

  /**
   * Generate a unique ticket ID for pending registrations
   */
  generateTicketId(): string {
    const prefix = 'MM';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}${random}`;
  }

  /**
   * Send daily report email to investor
   */
  async sendDailyReportEmail(reportData: any): Promise<boolean> {
    // Lazy init on first use
    this.initialize();

    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Skipping daily report email - service not configured');
      return false;
    }

    try {
      const html = this.getDailyReportEmailTemplate(reportData);
      const subject = `🌅 Raportul Tău Zilnic - ${new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })}`;

      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: reportData.user.email,
        subject,
        html,
      });

      console.log(`✅ Daily report email sent to ${reportData.user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send daily report email to ${reportData.user.email}:`, error);
      return false;
    }
  }

  /**
   * Daily Report Email Template (Duolingo style - BETA version)
   */
  private getDailyReportEmailTemplate(data: any): string {
    const platformUrl = process.env.PLATFORM_URL || 'http://localhost:3000';
    const dashboardUrl = `${platformUrl}/dashboard`;
    const profileUrl = `${platformUrl}/profile`;

    const { user, checkIn, personalFinances } = data;

    // Emoji pentru tier
    const tierEmojis: Record<string, string> = {
      'ENTRY': '🌱',
      'INVESTOR': '📈',
      'PRO': '💎',
      'WHALE': '🐋'
    };
    const tierEmoji = tierEmojis[user.tier] || '🌱';

    // Mesaj check-in
    const checkinMessage = checkIn.completedToday
      ? '✅ Ai făcut check-in astăzi! Streak-ul tău continuă!'
      : '⏰ Nu uita să faci check-in astăzi pentru a-ți menține streak-ul!';

    // Motivație pentru streak
    let streakMessage = '';
    if (user.streakDays === 0) {
      streakMessage = 'Începe un nou streak astăzi! 🚀';
    } else if (user.streakDays < 7) {
      streakMessage = `Ești la ${user.streakDays} ${user.streakDays === 1 ? 'zi' : 'zile'} consecutiv! Keep going! 💪`;
    } else if (user.streakDays < 30) {
      streakMessage = `Wow! ${user.streakDays} zile streak! Fantastic! 🔥`;
    } else {
      streakMessage = `INCREDIBIL! ${user.streakDays} zile streak! Ești un adevărat campion! 🏆`;
    }

    return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Raportul Tău Zilnic</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #FEF3C7, #FED7AA, #FECACA); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Mascot Header -->
        <div style="margin-bottom: 20px; text-align: center;">
          <div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">🦉☀️</div>
          <div style="background: white; border: 3px solid #F59E0B; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <p style="color: #F59E0B; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.4;">
              🌅 Bună dimineața, ${user.name}! Iată rezumatul tău zilnic!
            </p>
          </div>
        </div>

        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #F59E0B, #D97706); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                📊 Raportul Tău Zilnic
              </h1>
              <p style="color: #FEF3C7; margin: 10px 0 0; font-size: 14px; font-weight: 600;">
                ${new Date().toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Check-in Status -->
              <div style="background: ${checkIn.completedToday ? 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' : 'linear-gradient(135deg, #FEF3C7, #FDE68A)'}; border: 3px solid ${checkIn.completedToday ? '#10B981' : '#F59E0B'}; border-radius: 16px; padding: 25px; margin: 0 0 25px; text-align: center;">
                <p style="color: ${checkIn.completedToday ? '#065F46' : '#92400E'}; font-size: 14px; font-weight: 700; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1.5px;">
                  ${checkIn.completedToday ? '✅ CHECK-IN COMPLETAT' : '⏰ CHECK-IN ASTĂZI'}
                </p>
                <p style="color: ${checkIn.completedToday ? '#047857' : '#B45309'}; font-size: 16px; font-weight: 600; margin: 0;">
                  ${checkinMessage}
                </p>
              </div>

              <!-- Personal Stats Grid -->
              <div style="background: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 16px; padding: 25px; margin: 0 0 25px;">
                <p style="color: #6B7280; font-size: 13px; font-weight: 700; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                  📈 STATISTICILE TALE
                </p>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 15px; text-align: center; border-right: 2px solid #E5E7EB;">
                      <div style="font-size: 32px; margin-bottom: 8px;">🔥</div>
                      <div style="color: #EF4444; font-size: 24px; font-weight: 900; margin-bottom: 5px;">${user.streakDays}</div>
                      <div style="color: #6B7280; font-size: 12px; font-weight: 600;">ZILE STREAK</div>
                      <div style="color: #9CA3AF; font-size: 11px; margin-top: 5px;">${streakMessage}</div>
                    </td>
                    <td style="padding: 15px; text-align: center; border-right: 2px solid #E5E7EB;">
                      <div style="font-size: 32px; margin-bottom: 8px;">⭐</div>
                      <div style="color: #F59E0B; font-size: 24px; font-weight: 900; margin-bottom: 5px;">${user.loyaltyPoints}</div>
                      <div style="color: #6B7280; font-size: 12px; font-weight: 600;">LOYALTY POINTS</div>
                    </td>
                    <td style="padding: 15px; text-align: center;">
                      <div style="font-size: 32px; margin-bottom: 8px;">${tierEmoji}</div>
                      <div style="color: #8B5CF6; font-size: 18px; font-weight: 900; margin-bottom: 5px;">${user.tier}</div>
                      <div style="color: #6B7280; font-size: 12px; font-weight: 600;">TIER ACTUAL</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Personal Finances (BETA - Date de Test) -->
              <div style="background: linear-gradient(135deg, #DBEAFE, #BFDBFE); border: 2px solid #3B82F6; border-radius: 16px; padding: 25px; margin: 0 0 25px;">
                <p style="color: #1E40AF; font-size: 13px; font-weight: 700; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                  💰 FINANȚELE TALE
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #93C5FD;">
                      <div style="color: #1E40AF; font-size: 14px; font-weight: 600;">Balanta Curentă:</div>
                      <div style="color: #2563EB; font-size: 20px; font-weight: 900; margin-top: 5px;">€${personalFinances.currentBalance.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #93C5FD;">
                      <div style="color: #1E40AF; font-size: 14px; font-weight: 600;">Total Depozite:</div>
                      <div style="color: #2563EB; font-size: 20px; font-weight: 900; margin-top: 5px;">€${personalFinances.totalDeposits.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #93C5FD;">
                      <div style="color: #1E40AF; font-size: 14px; font-weight: 600;">Total Retrageri:</div>
                      <div style="color: #2563EB; font-size: 20px; font-weight: 900; margin-top: 5px;">€${personalFinances.totalWithdrawals.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <div style="color: #1E40AF; font-size: 14px; font-weight: 600;">Profit/Loss din Trade-uri:</div>
                      <div style="color: ${personalFinances.profitLoss >= 0 ? '#10B981' : '#EF4444'}; font-size: 20px; font-weight: 900; margin-top: 5px;">
                        ${personalFinances.profitLoss >= 0 ? '+' : ''}€${personalFinances.profitLoss.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                  </tr>
                </table>
                
                <!-- BETA Warning - Date de Test -->
                <div style="background: #FEF3C7; border: 2px dashed #F59E0B; border-radius: 8px; padding: 12px; margin: 15px 0 0; text-align: center;">
                  <p style="color: #92400E; font-size: 11px; font-weight: 700; margin: 0 0 3px; text-transform: uppercase;">
                    ⚠️ DATE BETA - DOAR PENTRU TEST
                  </p>
                  <p style="color: #B45309; font-size: 10px; margin: 0; line-height: 1.4;">
                    Aceste date financiare sunt calculate automat din systemă și pot conține erori în versiunea BETA.
                  </p>
                </div>
              </div>

              <!-- Motivational Quote -->
              <div style="background: linear-gradient(135deg, #F3E8FF, #E9D5FF); border-left: 4px solid #A855F7; border-radius: 12px; padding: 20px; margin: 0 0 30px;">
                <p style="color: #7C3AED; font-size: 15px; font-style: italic; margin: 0; line-height: 1.6; text-align: center;">
                  💡 "Investițiile inteligente încep cu decizii zilnice consistente!"
                </p>
              </div>

              <!-- CTA Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4); transition: all 0.3s;">
                      📊 VEZI DASHBOARD-UL
                    </a>
                  </td>
                </tr>
                ${!checkIn.completedToday ? `
                <tr>
                  <td align="center">
                    <a href="${profileUrl}#checkin" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); transition: all 0.3s;">
                      ✅ FĂ CHECK-IN ACUM
                    </a>
                  </td>
                </tr>
                ` : ''}
              </table>

              <!-- BETA Notice -->
              <div style="background: #FEF3C7; border: 2px dashed #F59E0B; border-radius: 12px; padding: 15px; margin: 30px 0 0; text-align: center;">
                <p style="color: #92400E; font-size: 12px; font-weight: 700; margin: 0 0 5px; text-transform: uppercase;">
                  🚧 VERSIUNE BETA
                </p>
                <p style="color: #B45309; font-size: 13px; margin: 0; line-height: 1.5;">
                  Acesta este un raport BETA. În curând vom adăuga statistici despre trade-uri, profit/pierderi și multe altele! 🚀
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background: #F8FAFC; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0 0 10px 0; color: #64748B; font-size: 12px;">Primești acest email pentru că ai activat rapoartele zilnice.</p>
              <p style="margin: 0; color: #64748B; font-size: 12px;"><a href="${profileUrl}" style="color: #F59E0B; text-decoration: none; font-weight: 600;">Dezactivează rapoartele zilnice</a> din pagina de profil.</p>
              <p style="margin: 15px 0 0 0; color: #94A3AF; font-size: 11px;">&copy; ${new Date().getFullYear()} Pariază Inteligent. Toate drepturile rezervate.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
  /**
   * Send email when 2FA is enabled (with backup codes)
   */
  async send2FAEnabledEmail(user: { email: string; name: string }, backupCodes: string[]): Promise<boolean> {
    this.initialize();

    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Skipping 2FA enabled email - service not configured');
      return false;
    }

    try {
      const platformUrl = process.env.PLATFORM_URL || 'http://localhost:3000';
      const loginUrl = `${platformUrl}/login`;

      const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🛡️ Autentificare 2FA Activată</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #E0F9FF, #C7F9CC, #FFF7CD); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <div style="margin-bottom: 20px; text-align: center;">
          <div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">🦉🔐</div>
          <div style="background: white; border: 3px solid #7C3AED; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <p style="color: #7C3AED; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.4;">
              🎉 Super! Ai activat 2FA! Contul tău este acum ULTRA securizat! ✨
            </p>
          </div>
        </div>
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          <tr>
            <td style="background: linear-gradient(135deg, #7C3AED, #6D28D9); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                🛡️ 2FA Activată, ${user.name || user.email}!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <div style="background: linear-gradient(135deg, #DBEAFE, #BFDBFE); border: 3px solid #3B82F6; border-radius: 16px; padding: 25px; margin: 0 0 30px; text-align: center;">
                <p style="color: #1E40AF; font-size: 14px; font-weight: 700; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1.5px;">
                  ✅ SUPER SECURIZAT
                </p>
                <p style="color: #1E3A8A; font-size: 18px; font-weight: 600; margin: 0;">
                  Autentificarea în 2 pași este acum activă! 🎊
                </p>
              </div>
              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                De acum înainte, la fiecare login vei introduce și un cod din Google Authenticator! 📱
              </p>
              <div style="background: #FEF3C7; border: 2px solid #FCD34D; border-radius: 16px; padding: 25px; margin: 0 0 30px;">
                <p style="color: #92400E; font-size: 14px; font-weight: 700; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                  ⚠️ CODURI BACKUP (Foarte Important!)
                </p>
                <p style="color: #78350F; font-size: 14px; margin: 0 0 20px; text-align: center;">
                  Salvează aceste coduri într-un loc SIGUR! Fiecare poate fi folosit o singură dată dacă pierzi telefonul:
                </p>
                <div style="background: white; border-radius: 12px; padding: 20px; font-family: monospace;">
                  ${backupCodes.map(code => `<p style="margin: 8px 0; font-size: 16px; color: #374151; font-weight: 600; text-align: center;">${code}</p>`).join('')}
                </div>
                <p style="color: #92400E; font-size: 13px; font-style: italic; margin: 20px 0 0; text-align: center;">
                  💡 Print sau salvează acest email! Dacă pierzi codurile și telefonul, contactează admin-ul.
                </p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #6D28D9); color: white; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);">
                      🚀 LOGHEAZĂ-TE ACUM
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Întrebări? Scrie-ne la <a href="mailto:support@pariazainteligent.ro" style="color: #7C3AED; text-decoration: none; font-weight: 600;">support@pariazainteligent.ro</a> 💌
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #F9FAFB; padding: 25px 30px; text-align: center; border-top: 2px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 13px; margin: 0; font-weight: 600;">
                © 2026 Pariază Inteligent. Toate drepturile rezervate.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await this.transporter.sendMail({
        from: `\"${process.env.SMTP_FROM_NAME}\" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: '🛡️ Autentificare 2FA Activată - Pariază Inteligent',
        html,
      });

      console.log(`✅ 2FA enabled email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send 2FA enabled email to ${user.email}:`, error);
      return false;
    }
  }

  async send2FADisabledEmail(user: { email: string; name: string }): Promise<boolean> {
    this.initialize();

    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Skipping 2FA disabled email - service not configured');
      return false;
    }

    try {
      const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>🔓 2FA Dezactivată</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #FEE2E2, #FECACA, #FCA5A5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          <tr>
            <td style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                🔓 2FA Dezactivată
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px;">
                Bună ${user.name || user.email},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px;">
                Autentificarea în 2 pași a fost <strong>dezactivată</strong> pe contul tău.
              </p>
              <div style="background: #FEF3C7; border: 2px solid #FCD34D; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="color: #92400E; font-size: 14px; font-weight: 600; margin: 0;">
                  ⚠️ Dacă nu ai fost tu, contactează-ne IMEDIAT!
                </p>
              </div>
              <p style="color: #6B7280; font-size: 14px;">
                Echipa Pariază Inteligent
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await this.transporter.sendMail({
        from: `\"${process.env.SMTP_FROM_NAME}\" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: '🔓 Autentificare 2FA Dezactivată - Pariază Inteligent',
        html,
      });

      console.log(`✅ 2FA disabled email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send 2FA disabled email to ${user.email}:`, error);
      return false;
    }
  }

  async send2FABackupCodesRegeneratedEmail(user: { email: string; name: string }, backupCodes: string[]): Promise<boolean> {
    this.initialize();

    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Skipping backup codes regenerated email - service not configured');
      return false;
    }

    try {
      const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>🔄 Coduri Backup Regenerate</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #F3E8FF, #E9D5FF, #D8B4FE); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          <tr>
            <td style="background: linear-gradient(135deg, #A855F7, #9333EA); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                🔄 Coduri Backup Regenerate
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; text-align: center; margin: 0 0 30px;">
                Bună ${user.name || user.email},
              </p>
              <p style="color: #374151; font-size: 16px; text-align: center; margin: 0 0 30px;">
                Ai generat 10 coduri backup NOI. Codurile vechi sunt acum <strong>invalide</strong>.
              </p>
              <div style="background: #FEF3C7; border: 2px solid #FCD34D; border-radius: 12px; padding: 20px; margin: 0 0 30px;">
                <p style="color: #92400E; font-size: 14px; font-weight: 700; margin: 0 0 15px; text-align: center;">
                  📝 NOILE TALE CODURI BACKUP:
                </p>
                <div style="background: white; border-radius: 8px; padding: 15px; font-family: monospace;">
                  \${backupCodes.map(code => \`<p style="margin: 6px 0; font-size: 14px; color: #374151; font-weight: 600; text-align: center;">\${code}</p>\`).join('')}
                </div>
              </div>
              <p style="color: #6B7280; font-size: 14px; text-align: center;">
                Echipa Pariază Inteligent
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await this.transporter.sendMail({
        from: `\"${process.env.SMTP_FROM_NAME}\" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: '🔄 Coduri Backup Regenerate - Pariază Inteligent',
        html,
      });

      console.log(`✅ Backup codes regenerated email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send backup codes email to ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Send biometric login enabled email
   */
  async sendBiometricEnabledEmail(user: { email: string; name: string }, hasTwoFA: boolean): Promise<boolean> {
    this.initialize();

    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Skipping biometric enabled email - service not configured');
      return false;
    }

    try {
      const platformUrl = process.env.PLATFORM_URL || 'http://localhost:3000';
      const loginUrl = `${platformUrl}/login`;

      const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>🔒 Login Biometric Activat</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #D1FAE5, #A7F3D0, #6EE7B7); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Mascot -->
        <div style="margin-bottom: 20px; text-align: center;">
          <div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">🦉🔐</div>
          <div style="background: white; border: 3px solid #10B981; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <p style="color: #10B981; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.4;">
              🎉 Super! Login Biometric este acum ACTIV! Contul tău este mai sigur ca niciodată! 🛡️
            </p>
          </div>
        </div>

        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10B981, #059669); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                🔒 Login Biometric Activat!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="background: linear-gradient(135deg, #D1FAE5, #A7F3D0); border: 3px solid #10B981; border-radius: 16px; padding: 25px; margin: 0 0 30px; text-align: center;">
                <p style="color: #065F46; font-size: 14px; font-weight: 700; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1.5px;">
                  ✅ ACTIVAT CU SUCCES!
                </p>
                <p style="color: #047857; font-size: 18px; font-weight: 600; margin: 0;">
                  FaceID/TouchID este acum activ pe contul tău 💚
                </p>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                Bună <strong>${user.name || user.email}</strong>,
              </p>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                Login Biometric a fost activat cu succes pe contul tău <strong>${user.email}</strong>.
              </p>

              <!-- Security Info -->
              <div style="background: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 16px; padding: 25px; margin: 30px 0;">
                <p style="color: #6B7280; font-size: 13px; font-weight: 700; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                  🔐 CE ÎNSEAMNĂ ASTA?
                </p>
                <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 15px; text-align: center;">
                  De acum înainte, pentru a te loga pe platformă, vei avea nevoie ${hasTwoFA ? '<strong>ȘI</strong>' : ''} de autentificare biometrică (FaceID sau TouchID) pe lângă email și parolă${hasTwoFA ? ' și codul 2FA' : ''}.
                </p>
              </div>

              <!-- Security Level -->
              <div style="background: linear-gradient(135deg, #DBEAFE, #BFDBFE); border: 2px solid #3B82F6; border-radius: 16px; padding: 25px; margin: 30px 0;">
                <p style="color: #1E40AF; font-size: 13px; font-weight: 700; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                  📊 NIVEL ACTUAL DE SECURITATE:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 20px; margin-right: 12px;">✅</span>
                        <span style="color: #374151; font-size: 15px; font-weight: 600;">Email + Parolă: ACTIV</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 20px; margin-right: 12px;">${hasTwoFA ? '✅' : '❌'}</span>
                        <span style="color: #374151; font-size: 15px; font-weight: 600;">Autentificare 2FA: ${hasTwoFA ? 'ACTIV' : 'INACTIV'}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 20px; margin-right: 12px;">✅</span>
                        <span style="color: #374151; font-size: 15px; font-weight: 600;">Login Biometric: ACTIV</span>
                      </div>
                    </td>
                  </tr>
                </table>
                <div style="background: white; border-radius: 12px; padding: 15px; margin-top: 20px; text-align: center;">
                  <p style="color: #10B981; font-size: 18px; font-weight: 900; margin: 0;">
                    ${hasTwoFA ? '🎉 TRIPLA PROTECȚIE ACTIVĂ! 🛡️' : '💪 DUBLA PROTECȚIE ACTIVĂ!'}
                  </p>
                  <p style="color: #6B7280; font-size: 13px; margin: 8px 0 0;">
                    Security Score: <strong style="color: #10B981;">${hasTwoFA ? '100' : '65'}/100</strong>
                  </p>
                </div>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-weight: 900; font-size: 16px; text-transform: uppercase; letter-spacing: 1.2px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);">
                      🔐 LOGHEAZĂ-TE ACUM
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <div style="background: #FEF3C7; border: 2px solid #FCD34D; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="color: #92400E; font-size: 14px; font-weight: 600; margin: 0; text-align: center; line-height: 1.6;">
                  ⚠️ <strong>Dacă nu ai activat tu această funcție, contactează-ne IMEDIAT!</strong>
                </p>
              </div>

              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Întrebări? Scrie-ne la <a href="mailto:support@pariazainteligent.ro" style="color: #10B981; text-decoration: none; font-weight: 600;">support@pariazainteligent.ro</a> 💌
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F9FAFB; padding: 25px 30px; text-align: center; border-top: 2px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 13px; margin: 0 0 5px; font-weight: 600;">
                © ${new Date().getFullYear()} Pariază Inteligent. Toate drepturile rezervate.
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
</html>`;

      await this.transporter.sendMail({
        from: `\"${process.env.SMTP_FROM_NAME}\" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: '🔐 Login Biometric Activat - Pariază Inteligent',
        html,
      });

      console.log(`✅ Biometric enabled email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send biometric enabled email to ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Send biometric login disabled email
   */
  async sendBiometricDisabledEmail(user: { email: string; name: string }): Promise<boolean> {
    this.initialize();

    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Skipping biometric disabled email - service not configured');
      return false;
    }

    try {
      const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>🔓 Login Biometric Dezactivat</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #FEE2E2, #FECACA, #FCA5A5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 900; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                🔓 Login Biometric Dezactivat
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px;">
                Bună <strong>${user.name || user.email}</strong>,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px;">
                Login Biometric a fost <strong>dezactivat</strong> pe contul tău.
              </p>

              <!-- Warning -->
              <div style="background: #FEF3C7; border: 2px solid #FCD34D; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="color: #92400E; font-size: 14px; font-weight: 600; margin: 0;">
                  ⚠️ Dacă nu ai fost tu, contactează-ne IMEDIAT!
                </p>
              </div>

              <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                Echipa Pariază Inteligent
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      await this.transporter.sendMail({
        from: `\"${process.env.SMTP_FROM_NAME}\" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: '🔓 Login Biometric Dezactivat - Pariază Inteligent',
        html,
      });

      console.log(`✅ Biometric disabled email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send biometric disabled email to ${user.email}:`, error);
      return false;
    }
  }
}


// Export singleton instance
export const emailService = new EmailService();
