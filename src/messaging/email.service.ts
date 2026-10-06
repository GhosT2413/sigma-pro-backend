import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: Transporter;
  private readonly logger = console;
  private isTestAccount = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeTransporter();
  }

  private async initializeTransporter() {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpPort = this.configService.get('SMTP_PORT', 587);
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');
    const smtpSecure = this.configService.get('SMTP_SECURE', 'false') === 'true';

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('[EmailService] SMTP transporter configured');
    } else {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.isTestAccount = true;
      this.logger.log('[EmailService] Using Ethereal test account');
      this.logger.log(`[EmailService] Test account: ${testAccount.user}`);
      this.logger.log('[EmailService] View emails at: https://ethereal.email');
    }

    try {
      await this.transporter.verify();
      this.logger.log('[EmailService] SMTP connection verified');
    } catch (error) {
      this.logger.error('[EmailService] SMTP connection failed:', error);
    }
  }

  async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', '"SIGMAPRO" <noreply@sigmapro.cl>'),
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text || this.htmlToText(data.html),
      });

      this.logger.log(`[EmailService] Email sent to ${data.to}: ${info.messageId}`);

      let previewUrl: string | undefined;
      if (this.isTestAccount) {
        const url = nodemailer.getTestMessageUrl(info);
        if (url) {
          previewUrl = url;
          this.logger.log(`[EmailService] Preview URL: ${previewUrl}`);
        }
      }

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
      this.logger.error('[EmailService] Failed to send email:', error);
      return { success: false };
    }
  }

  async sendTemplatedEmail(
    to: string,
    template: string,
    variables: Record<string, string>,
  ): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    const html = this.renderTemplate(template, variables);
    const subject = this.getTemplateSubject(template);
    return this.sendEmail({ to, subject, html });
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:4200');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = this.renderTemplate('password-reset', {
      resetUrl,
      expiresIn: '1 hora',
    });

    return this.sendEmail({
      to: email,
      subject: 'Recuperación de contraseña - SIGMAPRO',
      html,
    });
  }

  async sendWelcomeEmail(
    email: string,
    nombre: string,
  ): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:4200');

    const html = this.renderTemplate('welcome', {
      nombre,
      loginUrl: `${frontendUrl}/login`,
    });

    return this.sendEmail({
      to: email,
      subject: 'Bienvenido a SIGMAPRO',
      html,
    });
  }

  async sendNotificationEmail(
    email: string,
    subject: string,
    message: string,
  ): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    const html = this.renderTemplate('notification', {
      message,
      subject,
    });

    return this.sendEmail({ to: email, subject, html });
  }

  private renderTemplate(templateName: string, variables: Record<string, string>): string {
    const templates: Record<string, string> = {
      'password-reset': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>SIGMAPRO</h1></div>
            <div class="content">
              <h2>Recuperación de contraseña</h2>
              <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo:</p>
              <a href="${variables.resetUrl}" class="button">Restablecer contraseña</a>
              <p>O copia este enlace: <a href="${variables.resetUrl}">${variables.resetUrl}</a></p>
              <p><strong>Este enlace expira en ${variables.expiresIn}.</strong></p>
              <p>Si no solicitaste esto, ignora este correo.</p>
            </div>
            <div class="footer">© 2026 SIGMAPRO. Todos los derechos reservados.</div>
          </div>
        </body>
        </html>
      `,
      'welcome': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>SIGMAPRO</h1></div>
            <div class="content">
              <h2>¡Bienvenido, ${variables.nombre}!</h2>
              <p>Tu cuenta ha sido creada exitosamente en SIGMAPRO.</p>
              <a href="${variables.loginUrl}" class="button">Iniciar sesión</a>
              <p>Gracias por unirte a nuestra plataforma.</p>
            </div>
            <div class="footer">© 2026 SIGMAPRO. Todos los derechos reservados.</div>
          </div>
        </body>
        </html>
      `,
      'notification': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>SIGMAPRO</h1></div>
            <div class="content">
              <h2>${variables.subject}</h2>
              <p>${variables.message}</p>
            </div>
            <div class="footer">© 2026 SIGMAPRO. Todos los derechos reservados.</div>
          </div>
        </body>
        </html>
      `,
    };

    let html = templates[templateName] || templates['notification'];

    Object.entries(variables).forEach(([key, value]) => {
      html = html.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    });

    return html;
  }

  private getTemplateSubject(template: string): string {
    const subjects: Record<string, string> = {
      'password-reset': 'Recuperación de contraseña - SIGMAPRO',
      'welcome': 'Bienvenido a SIGMAPRO',
      'notification': 'Notificación - SIGMAPRO',
    };
    return subjects[template] || 'Notificación - SIGMAPRO';
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .trim();
  }
}