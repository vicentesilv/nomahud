import { Injectable, Logger } from '@nestjs/common';

type MailContext = Record<string, any>;

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly brevoApiKey = process.env.BREVO_API_KEY?.trim();
    private readonly fromEmail = process.env.MAIL_FROM?.trim() || 'noreply@nomahud.com';
    private readonly fromName = 'Nomahud';

    async sendMail(
        to: string,
        subject: string,
        template: string,
        context: MailContext,
    ): Promise<void> {
        if (!this.brevoApiKey) {
            this.logger.warn(`Brevo no configurado: correo a ${to} no enviado`);
            return;
        }

        const html = this.renderTemplate(template, context);

        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'api-key': this.brevoApiKey,
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

            this.logger.log(`Correo enviado a ${to} con asunto "${subject}"`);
        } catch (error) {
            this.logger.error(`Error al enviar correo a ${to}: ${error instanceof Error ? error.message : error}`);
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
}
