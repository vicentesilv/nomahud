import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type MailContext = Record<string, any>;

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly brevoApiKey = process.env.BREVO_API_KEY?.trim();
    private readonly smtpHost = process.env.SMTP_HOST?.trim();
    private readonly smtpPort = Number(process.env.SMTP_PORT || 587);
    private readonly smtpUser = process.env.SMTP_USER?.trim();
    private readonly smtpPass = process.env.SMTP_PASS?.trim();
    private readonly fromEmail = process.env.MAIL_FROM?.trim() || 'noreply@nomahud.com';
    private readonly fromName = 'Nomahud';

    async sendMail(
        to: string,
        subject: string,
        template: string,
        context: MailContext,
    ): Promise<boolean> {
        const html = this.renderTemplate(template, context);

        try {
            if (this.brevoApiKey) {
                await this.sendViaBrevo(to, subject, html);
            } else if (this.smtpHost) {
                await this.sendViaSmtp(to, subject, html);
            } else {
                this.logger.warn(`Sin proveedor de correo (BREVO_API_KEY/SMTP_HOST): correo a ${to} no enviado`);
                return false;
            }

            this.logger.log(`Correo enviado a ${to} con asunto "${subject}"`);
            return true;
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error al enviar correo a ${to}: ${mensaje}`);
            throw new Error(`No se pudo enviar el correo a ${to}: ${mensaje}`);
        }
    }

    private async sendViaBrevo(to: string, subject: string, html: string): Promise<void> {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': this.brevoApiKey as string,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sender: { name: this.fromName, email: this.fromEmail },
                to: [{ email: to }],
                subject,
                htmlContent: html,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Brevo API error ${response.status}: ${errorBody}`);
        }
    }

    private async sendViaSmtp(to: string, subject: string, html: string): Promise<void> {
        if (!this.smtpHost) {
            throw new Error('SMTP_HOST no configurado');
        }
        const options: { host: string; port: number; secure: boolean; auth?: { user: string; pass: string } } = {
            host: this.smtpHost,
            port: this.smtpPort,
            secure: this.smtpPort === 465,
        };
        if (this.smtpUser && this.smtpPass) {
            options.auth = { user: this.smtpUser, pass: this.smtpPass };
        }
        const transporter = nodemailer.createTransport(options);

        await transporter.sendMail({
            from: `${this.fromName} <${this.fromEmail}>`,
            to,
            subject,
            html,
        });
    }

    private renderTemplate(template: string, context: MailContext): string {
        return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key: string) => {
            const value = key
                .split('.')
                .reduce<any>((acc, part) => (acc != null ? acc[part] : undefined), context);

            return value != null ? String(value) : '';
        });
    }
}
