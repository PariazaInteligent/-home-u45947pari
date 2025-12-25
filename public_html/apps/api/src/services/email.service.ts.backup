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
    console.log('🔍 Email Config Check:', {
      SMTP_HOST: SMTP_HOST ? 'SET' : 'MISSING',
      SMTP_PORT: SMTP_PORT ? 'SET' : 'MISSING',
      SMTP_USER: SMTP_USER ? 'SET' : 'MISSING',
      SMTP_PASSWORD: SMTP_PASSWORD ? 'SET' : 'MISSING',
    });

    // Check if SMTP is configured
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
      console.warn('⚠️ SMTP not configured. Email service disabled.');
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
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
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
      console.log('📧 Skipping welcome email - service not configured');
      return false;
    }

    try {
      const html = this.getWelcomeEmailTemplate(user, referrer);

      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: '🎉 Bun Venit! Contul Tău Este Activ',
        html,
      });

      console.log(`✅ Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${user.email}:`, error);
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
      console.log('📧 Skipping pending email - service not configured');
      return false;
    }

    try {
      const html = this.getPendingEmailTemplate(user, ticketId);

      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: '⏳ Cererea Ta Este în Procesare',
        html,
      });

      console.log(`✅ Pending email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send pending email to ${user.email}:`, error);
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
      console.log('📧 Skipping activation email - service not configured');
      return false;
    }

    try {
      const html = this.getActivationEmailTemplate(user);

      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: user.email,
        subject: '✅ Contul Tău A Fost Activat!',
        html,
      });

      console.log(`✅ Activation email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send activation email to ${user.email}:`, error);
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
      console.log('❌ Cannot test connection - service not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection test successful');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection test failed:', error);
      return false;
    }
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
          <div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">🦉</div>
          <div style="background: white; border: 3px solid #10B981; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <p style="color: #10B981; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.4;">
              🎉 Yay! Contul tău este ACTIV! Bine ai venit în familia noastră de investitori! Hai să începem aventura!
            </p>
          </div>
        </div>

        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10B981, #059669); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                Bine ai venit, ${user.name}! 💚
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Success Badge -->
              <div style="background: linear-gradient(135deg, #D1FAE5, #A7F3D0); border: 2px solid #10B981; border-radius: 16px; padding: 20px; margin: 0 0 30px; text-align: center;">
                <p style="color: #065F46; font-size: 14px; font-weight: 700; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1.5px;">
                  ✅ INSTANT ACCESS - COD VALID!
                </p>
                <p style="color: #047857; font-size: 18px; font-weight: 600; margin: 0;">
                  Contul tău este <strong>100% ACTIV</strong> și gata de utilizare!
                </p>
              </div>

              ${referrer ? `
              <div style="background: linear-gradient(135deg, #F3E8FF, #E9D5FF); border: 2px solid #A855F7; border-radius: 16px; padding: 20px; margin: 0 0 30px;">
                <p style="color: #6B21A8; font-size: 13px; font-weight: 700; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">
                  🎁 INVITAT DE
                </p>
                <p style="color: #7C3AED; font-size: 16px; font-weight: 600; margin: 0;">
                  <strong>${referrer.name}</strong> te-a invitat să faci parte din comunitate! 🤝
                </p>
              </div>
              ` : ''}

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                Platformă de investiții sportive bazată pe analiză statistică avansată este acum disponibilă pentru tine! 📊
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); transition: all 0.3s;">
                      🚀 EXPLOREAZĂ DASHBOARD-UL
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Login Info -->
              <div style="background: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="color: #6B7280; font-size: 12px; font-weight: 700; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                  🔐 CREDENȚIALELE TALE
                </p>
                <p style="color: #374151; font-size: 15px; margin: 0 0 8px; text-align: center;">
                  <strong>Email:</strong> ${user.email}
                </p>
                <p style="color: #374151; font-size: 15px; margin: 0; text-align: center;">
                  <strong>Parolă:</strong> Parola aleasă la înregistrare
                </p>
              </div>

              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Întâmpini probleme? Scrie-ne la <a href="mailto:support@pariazainteligent.ro" style="color: #10B981; text-decoration: none; font-weight: 600;">support@pariazainteligent.ro</a> 💌
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

  private getPendingEmailTemplate(user: EmailUser, ticketId: string): string {
    const platformUrl = process.env.PLATFORM_URL || 'http://localhost:3000';

    return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cererea Ta Est în Procesare</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #FAE8FF, #FED7AA, #FECACA); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Prof. Investino Mascot -->
        <div style="margin-bottom: 20px; text-align: center;">
          <div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">🦉</div>
          <div style="background: white; border: 3px solid #A855F7; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <p style="color: #A855F7; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.4;">
              👋 Hei! Nu te îngrijora! Cererea ta e la noi și o verificăm cu atenție. Administratorii noștri sunt super rapizi! ⚡
            </p>
          </div>
        </div>

        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #A855F7, #7C3AED); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                Cerere Primită, ${user.name}! 💜
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Waiting Badge -->
              <div style="background: linear-gradient(135deg, #F3E8FF, #E9D5FF); border: 2px solid #A855F7; border-radius: 16px; padding: 20px; margin: 0 0 30px; text-align: center;">
                <p style="color: #6B21A8; font-size: 14px; font-weight: 700; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1.5px;">
                  ⏰ ÎN CURS DE VERIFICARE - Gata în 24-48h!
                </p>
                <p style="color: #7C3AED; font-size: 18px; font-weight: 600; margin: 0;">
                  Verificăm fiecare cerere personal pentru siguranța tuturor! 💪
                </p>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                Cererea ta a fost înregistrată cu succes! Un administrator o va verifica în cel mult <strong>48 de ore</strong>. 📋
              </p>

              <!-- Ticket ID Box -->
              <div style="background: linear-gradient(135deg, #DDD6FE, #C4B5FD); border: 3px solid #A855F7; border-radius: 20px; padding: 30px; margin: 30px 0; text-align: center;">
                <p style="color: #6B21A8; font-size: 14px; font-weight: 700; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 2px;">
                  🎫 CODUL TĂU DE AȘTEPTARE
                </p>
                <p style="color: #7C3AED; font-size: 36px; font-weight: 900; margin: 0 0 20px; font-family: monospace; letter-spacing: 3px; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
                  ${ticketId}
                </p>
                <div style="background: white; border-radius: 12px; padding: 15px; margin-top: 20px;">
                  <p style="color: #6B7280; font-size: 13px; font-weight: 600; margin: 0;">
                    ⏱️ Timp estimat: <strong style="color: #A855F7;">24-48 ore</strong>
                  </p>
                </div>
              </div>

              <!-- Encouragement -->
              <div style="background: #FEF3C7; border: 2px solid #FCD34D; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="color: #92400E; font-size: 14px; font-weight: 600; margin: 0; text-align: center; line-height: 1.6;">
                  <strong>💡 Știai că:</strong> Verificăm personal fiecare cerere pentru a proteja comunitatea noastră de investitori. Mulțumim pentru răbdare! 🙏
                </p>
              </div>

              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Întrebări? Trimite-ne un email la <a href="mailto:support@pariazainteligent.ro" style="color: #A855F7; text-decoration: none; font-weight: 600;">support@pariazainteligent.ro</a> 💌
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

  private getActivationEmailTemplate(user: EmailUser): string {
    const platformUrl = process.env.PLATFORM_URL || 'http://localhost:3000';
    const loginUrl = `${platformUrl}/login`;

    return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contul Tău A Fost Activat!</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(to bottom right, #D1FAE5, #A7F3D0, #6EE7B7); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Prof. Investino Mascot - Super Happy! -->
        <div style="margin-bottom: 20px; text-align: center;">
          <div style="font-size: 80px; line-height: 1; margin-bottom: 15px;">🦉✨</div>
          <div style="background: white; border: 3px solid #10B981; border-radius: 20px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <p style="color: #10B981; font-size: 18px; font-weight: 700; margin: 0; line-height: 1.4;">
              🎊 FELICITĂRI! Ai fost aprobat! Ești acum parte din echipa noastră! Pregătește-te pentru o călătorie incredibilă! 🚀
            </p>
          </div>
        </div>

        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10B981, #059669); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
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
                  ✅ CONT ACTIVAT - 100% Verified!
                </p>
                <p style="color: #047857; font-size: 20px; font-weight: 700; margin: 0;">
                  Contul tău a fost verificat și aprobat! 💚
                </p>
              </div>

              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 30px; text-align: center;">
                Bine ai venit în comunitatea de investitori inteligenți! Platforma ta este acum complet accesibilă. 🌟
              </p>

              <!-- Features List with Emoji -->
              <div style="background: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 16px; padding: 25px; margin: 30px 0;">
                <p style="color: #6B7280; font-size: 13px; font-weight: 700; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                  🎁 CE POȚI FACE ACUM:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">📊</span>
                        <span style="color: #374151; font-size: 15px; font-weight: 600;">Dashboard LIVE cu statistici în timp real</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">💰</span>
                        <span style="color: #374151; font-size: 15px; font-weight: 600;">Depozite și retrageri instant</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">👥</span>
                        <span style="color: #374151; font-size: 15px; font-weight: 600;">Chat cu comunitatea de investitori</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">📈</span>
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
                      🎯 ÎNCEPE ACUM!
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="background: linear-gradient(135deg, #DBEAFE, #BFDBFE); border: 2px solid #3B82F6; border-radius: 16px; padding: 25px; margin: 30px 0;">
                <p style="color: #1E40AF; font-size: 13px; font-weight: 700; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                  📋 URMĂTORII PAȘI:
                </p>
                <div style="color: #374151; font-size: 15px; line-height: 2;">
                  <div style="margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">1️⃣</span>
                    <strong>Loghează-te</strong> cu emailul tău
                  </div>
                  <div style="margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">2️⃣</span>
                    <strong>Explorează</strong> dashboard-ul colorat
                  </div>
                  <div style="margin-bottom: 10px;">
                    <span style="font-size: 20px; margin-right: 10px;">3️⃣</span>
                    <strong>Alătură-te</strong> comunității
                  </div>
                  <div>
                    <span style="font-size: 20px; margin-right: 10px;">4️⃣</span>
                    <strong>Configurează</strong> primul depozit
                  </div>
                </div>
              </div>

              <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Întrebări? Scrie-ne oricând la <a href="mailto:support@pariazainteligent.ro" style="color: #10B981; text-decoration: none; font-weight: 700;">support@pariazainteligent.ro</a> 💌
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

  /**
   * Generate a unique ticket ID for pending registrations
   */
  generateTicketId(): string {
    const prefix = 'MM';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}${random}`;
  }
}

  /**
   * Send rejection email (when admin rejects)
   */
  async sendRejectionEmail(user: EmailUser): Promise < boolean > {
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
  return `<!DOCTYPE html>
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
            <p style="color: #374151; font-size: 16px; margin: 0 0 25px;">Bună ${user.name || 'investitorule'},</p>
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
</html>`;
}

}

// Export singleton instance
export const emailService = new EmailService();

