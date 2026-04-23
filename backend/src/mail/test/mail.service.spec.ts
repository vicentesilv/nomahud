import { InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailService } from '../mail.service';

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(),
}));

describe('MailService', () => {
    let service: MailService;
    let sendMailMock: jest.Mock;

    beforeEach(() => {
        sendMailMock = jest.fn();

        (nodemailer.createTransport as jest.Mock).mockReturnValue({
            sendMail: sendMailMock,
        });

        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASS;
        delete process.env.MAIL_FROM;
        delete process.env.EMAIL_HOST;
        delete process.env.EMAIL_PORT;
        delete process.env.EMAIL_USER;
        delete process.env.EMAIL_PASSWORD;

        process.env.SMTP_HOST = 'smtp.gmail.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'mailer@test.com';
        process.env.SMTP_PASS = 'smtp-pass';
        process.env.MAIL_FROM = 'noreply@test.com';

        service = new MailService();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe estar definido', () => {
        expect(service).toBeDefined();
    });

    it('configura transporter con variables SMTP', () => {
        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'mailer@test.com',
                pass: 'smtp-pass',
            },
        });
    });

    it('sendMail: renderiza template con contexto y envía correo', async () => {
        sendMailMock.mockResolvedValue(undefined);

        await service.sendMail(
            'destino@test.com',
            'Confirmación de cuenta',
            '<h1>Hola {{usuario.nombre}}</h1><p>Token: {{token}}</p>',
            {
                usuario: { nombre: 'Vicente' },
                token: 'ABC123',
            },
        );

        expect(sendMailMock).toHaveBeenCalledWith({
            from: 'noreply@test.com',
            to: 'destino@test.com',
            subject: 'Confirmación de cuenta',
            html: '<h1>Hola Vicente</h1><p>Token: ABC123</p>',
        });
    });

    it('sendMail: usa EMAIL_* como fallback cuando SMTP_* no existe', async () => {
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASS;
        delete process.env.MAIL_FROM;

        process.env.EMAIL_HOST = 'smtp.gmail.com';
        process.env.EMAIL_PORT = '587';
        process.env.EMAIL_USER = 'fallback@test.com';
        process.env.EMAIL_PASSWORD = 'email-pass';

        service = new MailService();
        sendMailMock.mockResolvedValue(undefined);

        await service.sendMail('destino@test.com', 'Asunto', '<p>{{nombre}}</p>', {
            nombre: 'Prueba',
        });

        expect(nodemailer.createTransport).toHaveBeenLastCalledWith({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'fallback@test.com',
                pass: 'email-pass',
            },
        });

        expect(sendMailMock).toHaveBeenCalledWith({
            from: 'fallback@test.com',
            to: 'destino@test.com',
            subject: 'Asunto',
            html: '<p>Prueba</p>',
        });
    });

    it('sendMail: lanza InternalServerErrorException si falla el envío', async () => {
        sendMailMock.mockRejectedValue(new Error('SMTP error'));

        await expect(
            service.sendMail('destino@test.com', 'Asunto', '<p>Hola</p>', {}),
        ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
});