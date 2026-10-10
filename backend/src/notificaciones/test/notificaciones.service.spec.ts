import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificacionesService } from '../notificaciones.service';
import { MailService } from '../../mail/mail.service';
import { Perfil } from '../../perfiles/entities/perfil.entity';
import { Tarea } from '../../tareas/entities/tarea.entity';
import { Viaje } from '../../viajes/entities/viaje.entity';
import { RegistroTiempo } from '../../tiempo/entities/registro-tiempo.entity';
import { Transaccion } from '../../finanzas/entities/transaccion.entity';

describe('NotificacionesService', () => {
    let service: NotificacionesService;
    let mailService: jest.Mocked<MailService>;
    let perfilRepo: { find: jest.Mock };
    let tareaRepo: { find: jest.Mock };
    let viajeRepo: { find: jest.Mock };
    let tiempoRepo: { find: jest.Mock };
    let transaccionRepo: { find: jest.Mock };

    const usuario = { id: 1, nombre: 'Vicente', correo: 'v@mail.com', emailVerificado: true, estadoCuenta: 'activa' };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificacionesService,
                { provide: MailService, useValue: { sendMail: jest.fn().mockResolvedValue(true) } },
                {
                    provide: ConfigService,
                    useValue: { get: jest.fn(() => 'http://localhost:3000') },
                },
                { provide: getRepositoryToken(Perfil), useValue: { find: jest.fn() } },
                { provide: getRepositoryToken(Tarea), useValue: { find: jest.fn() } },
                { provide: getRepositoryToken(Viaje), useValue: { find: jest.fn() } },
                { provide: getRepositoryToken(RegistroTiempo), useValue: { find: jest.fn() } },
                { provide: getRepositoryToken(Transaccion), useValue: { find: jest.fn() } },
            ],
        }).compile();

        service = module.get(NotificacionesService);
        mailService = module.get(MailService);
        perfilRepo = module.get(getRepositoryToken(Perfil));
        tareaRepo = module.get(getRepositoryToken(Tarea));
        viajeRepo = module.get(getRepositoryToken(Viaje));
        tiempoRepo = module.get(getRepositoryToken(RegistroTiempo));
        transaccionRepo = module.get(getRepositoryToken(Transaccion));
    });

    it('recordarVencimientos: envía correo solo con tareas urgentes', async () => {
        perfilRepo.find.mockResolvedValue([{ notificacionesEmail: true, usuario }]);
        tareaRepo.find.mockResolvedValue([
            { titulo: 'Urgente', fechaVencimiento: new Date(), proyecto: { nombre: 'P1' } },
            { titulo: 'Lejana', fechaVencimiento: new Date(Date.now() + 30 * 864e5), proyecto: { nombre: 'P1' } },
            { titulo: 'Sin fecha', fechaVencimiento: null, proyecto: { nombre: 'P1' } },
        ]);

        await service.recordarVencimientos();

        expect(mailService.sendMail).toHaveBeenCalledTimes(1);
        expect(mailService.sendMail.mock.calls[0][1]).toContain('por vencer');
    });

    it('recordarVencimientos: omite usuarios sin notificaciones o inactivos', async () => {
        perfilRepo.find.mockResolvedValue([
            { notificacionesEmail: false, usuario },
            { notificacionesEmail: true, usuario: { ...usuario, estadoCuenta: 'bloqueada' } },
        ]);

        await service.recordarVencimientos();

        expect(tareaRepo.find).not.toHaveBeenCalled();
        expect(mailService.sendMail).not.toHaveBeenCalled();
    });

    it('resumenSemanal: no envía si no hay actividad', async () => {
        perfilRepo.find.mockResolvedValue([{ notificacionesEmail: true, usuario }]);
        tareaRepo.find.mockResolvedValue([]);
        tiempoRepo.find.mockResolvedValue([]);
        transaccionRepo.find.mockResolvedValue([]);

        await service.resumenSemanal();

        expect(mailService.sendMail).not.toHaveBeenCalled();
    });

    it('resumenSemanal: envía con actividad reciente', async () => {
        perfilRepo.find.mockResolvedValue([{ notificacionesEmail: true, usuario }]);
        tareaRepo.find.mockResolvedValue([{ estado: 'completada', updatedAt: new Date() }]);
        tiempoRepo.find.mockResolvedValue([{ horas: 3, createdAt: new Date() }]);
        transaccionRepo.find.mockResolvedValue([{ tipo: 'ingreso', monto: 100, createdAt: new Date() }]);

        await service.resumenSemanal();

        expect(mailService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('alertarPresupuestosViajes: alerta solo sobre el 80%', async () => {
        perfilRepo.find.mockResolvedValue([{ notificacionesEmail: true, usuario }]);
        viajeRepo.find.mockResolvedValue([
            { id: 1, destino: 'CDMX', presupuesto: 1000, itinerario: [{ costo: 900 }] },
            { id: 2, destino: 'Lima', presupuesto: 1000, itinerario: [{ costo: 100 }] },
            { id: 3, destino: 'Sin presupuesto', presupuesto: null, itinerario: [] },
        ]);

        await service.alertarPresupuestosViajes();

        expect(mailService.sendMail).toHaveBeenCalledTimes(1);
        expect(mailService.sendMail.mock.calls[0][1]).toContain('CDMX');
    });
});
