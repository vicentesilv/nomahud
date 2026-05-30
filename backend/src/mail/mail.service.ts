import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type MailContext = Record<string, any>;

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    private readonly transporter = (() => {
        const smtpUser = this.getEnv('SMTP_USER') ?? this.getEnv('EMAIL_USER');
        const smtpPass = this.getEnv('SMTP_PASS') ?? this.getEnv('EMAIL_PASSWORD');

        return nodemailer.createTransport({
            host: this.getEnv('SMTP_HOST') ?? this.getEnv('EMAIL_HOST'),
            port: Number(this.getEnv('SMTP_PORT') ?? this.getEnv('EMAIL_PORT') ?? 587),
            secure: false,
            ...(smtpUser ? { auth: { user: smtpUser, pass: smtpPass ?? '' } } : {}),
        });
    })();

    async sendMail(
        to: string,
        subject: string,
        template: string,
        context: MailContext,
    ): Promise<void> {
        try {
            const html = this.renderTemplate(template, context);
            const from = this.getEnv('MAIL_FROM') ?? this.getEnv('SMTP_USER') ?? this.getEnv('EMAIL_USER');

            await this.transporter.sendMail({
                from,
                to,
                subject,
                html,
            });

            this.logger.log(`Correo enviado a ${to} con asunto "${subject}"`);
        } catch (error) {
            this.logger.error(`Error al enviar correo a ${to}`, error instanceof Error ? error.stack : undefined);
            throw new InternalServerErrorException('No se pudo enviar el correo');
        }
    }

    private renderTemplate(template: string, context: MailContext): string {
        return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key: string) => {
            const value = key
                .split('.')
                .reduce<any>((acc, part) => (acc != null ? acc[part] : undefined), context);

            return value != null ? String(value) : '';
        });
    }

    private getEnv(key: string): string | undefined {
        const value = process.env[key];
        if (!value) {
            return undefined;
        }

        return value.trim();
    }
}