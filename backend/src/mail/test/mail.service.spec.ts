import * as nodemailer from 'nodemailer';
import { MailService } from '../mail.service';

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(),
}));

describe('MailService (Brevo + SMTP fallback)', () => {
    const OLD_ENV = process.env;
    let sendMailMock: jest.Mock;

    beforeEach(() => {
        process.env = { ...OLD_ENV };
        delete process.env.BREVO_API_KEY;
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASS;
        process.env.MAIL_FROM = 'noreply@test.com';
        sendMailMock = jest.fn().mockResolvedValue(undefined);
        (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });
        jest.spyOn(global, 'fetch').mockRestore();
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    it('debe estar definido', () => {
        expect(new MailService()).toBeDefined();
    });

    it('retorna false sin enviar si no hay proveedor', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch');
        const service = new MailService();

        await expect(
            service.sendMail('destino@test.com', 'Asunto', '<p>Hola</p>', {}),
        ).resolves.toBe(false);
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(nodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('renderiza template y llama a Brevo cuando hay API key', async () => {
        process.env.BREVO_API_KEY = 'test-key';
        const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
        const service = new MailService();

        const result = await service.sendMail(
            'destino@test.com',
            'Confirmación de cuenta',
            '<h1>Hola {{usuario.nombre}}</h1><p>Token: {{token}}</p>',
            { usuario: { nombre: 'Vicente' }, token: 'ABC123' },
        );

        expect(result).toBe(true);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.brevo.com/v3/smtp/email',
            expect.objectContaining({ method: 'POST' }),
        );
        const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
        expect(body.to).toEqual([{ email: 'destino@test.com' }]);
        expect(body.htmlContent).toBe('<h1>Hola Vicente</h1><p>Token: ABC123</p>');
    });

    it('usa SMTP (nodemailer) cuando no hay Brevo pero sí SMTP_HOST', async () => {
        process.env.SMTP_HOST = 'maildev';
        process.env.SMTP_PORT = '1025';
        const service = new MailService();

        const result = await service.sendMail('destino@test.com', 'Asunto', '<p>Hola {{nombre}}</p>', {
            nombre: 'Vicente',
        });

        expect(result).toBe(true);
        expect(nodemailer.createTransport).toHaveBeenCalledWith(
            expect.objectContaining({ host: 'maildev', port: 1025 }),
        );
        expect(sendMailMock).toHaveBeenCalledWith(
            expect.objectContaining({ to: 'destino@test.com', html: '<p>Hola Vicente</p>' }),
        );
    });

    it('lanza error si Brevo responde con fallo', async () => {
        process.env.BREVO_API_KEY = 'test-key';
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: false,
            status: 401,
            text: async () => 'unauthorized',
        } as Response);
        const service = new MailService();

        await expect(
            service.sendMail('destino@test.com', 'Asunto', '<p>Hola</p>', {}),
        ).rejects.toThrow('No se pudo enviar el correo');
    });

    it('lanza error si SMTP falla', async () => {
        process.env.SMTP_HOST = 'maildev';
        sendMailMock.mockRejectedValue(new Error('SMTP error'));
        const service = new MailService();

        await expect(
            service.sendMail('destino@test.com', 'Asunto', '<p>Hola</p>', {}),
        ).rejects.toThrow('No se pudo enviar el correo');
    });
});
