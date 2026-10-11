import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProyectosService } from '../proyectos.service';
import { Proyecto } from '../entities/proyecto.entity';
import { ProyectoMiembro } from '../entities/proyecto-miembro.entity';
import { ProyectoInvitacion } from '../entities/proyecto-invitacion.entity';
import { ProyectoComparticion } from '../entities/proyecto-comparticion.entity';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';
import { FinanzasService } from '../../finanzas/finanzas.service';
import { MailService } from '../../mail/mail.service';

describe('ProyectosService', () => {
  let service: ProyectosService;
  let repo: jest.Mocked<{
    create: jest.Mock;
    find: jest.Mock;
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    manager: { findOne: jest.Mock };
  }>;
  let finanzasService: jest.Mocked<FinanzasService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProyectosService,
        {
          provide: getRepositoryToken(Proyecto),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            manager: { findOne: jest.fn() },
          },
        },
        {
          provide: FinanzasService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProyectoMiembro),
          useValue: { findOne: jest.fn(), create: jest.fn((x) => x), save: jest.fn(), remove: jest.fn() },
        },
        {
          provide: getRepositoryToken(ProyectoInvitacion),
          useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), delete: jest.fn() },
        },
        {
          provide: getRepositoryToken(ProyectoComparticion),
          useValue: { findOne: jest.fn(), create: jest.fn((x) => x), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Usuario),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: MailService,
          useValue: { sendMail: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'http://localhost:3000') },
        },
      ],
    }).compile();

    service = module.get(ProyectosService);
    repo = module.get(getRepositoryToken(Proyecto));
    finanzasService = module.get(FinanzasService);
  });

  it('create: crea proyecto con creadorId', async () => {
    const dto = { nombre: 'Proyecto Test' } as any;
    repo.create.mockReturnValue({ ...dto, creadorId: 1 } as Proyecto);
    repo.save.mockResolvedValue({ id: 1, ...dto, creadorId: 1 } as Proyecto);

    const result = await service.create(1, dto);

    expect(repo.create).toHaveBeenCalledWith({ ...dto, creadorId: 1 });
    expect(result.id).toBe(1);
  });

  it('findAll: retorna proyectos del usuario', async () => {
    const proyectos = [{ id: 1, nombre: 'P1' }] as Proyecto[];
    repo.findAndCount.mockResolvedValue([proyectos, 1]);

    const result = await service.findAll(1);

    expect(repo.findAndCount).toHaveBeenCalledWith({
      where: [{ creadorId: 1 }, { miembros: { usuarioId: 1 } }],
      order: { updatedAt: 'DESC' },
      relations: ['tareas', 'clienteRel', 'miembros', 'miembros.usuario'],
      skip: 0,
      take: 20,
    });
    expect(result).toEqual({ datos: proyectos, total: 1, pagina: 1, limite: 20 });
  });

  it('findOne: retorna proyecto si existe', async () => {
    const proyecto = { id: 1, creadorId: 1 } as Proyecto;
    repo.findOne.mockResolvedValue(proyecto);

    const result = await service.findOne(1, 1);

    expect(result).toBe(proyecto);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza y registra ganancia si estado pasa a completado', async () => {
    const proyecto = { id: 1, creadorId: 1, estado: 'activo', ganancia: 500, nombre: 'P1', clienteId: 2 } as Proyecto;
    repo.findOne.mockResolvedValue(proyecto);
    repo.save.mockResolvedValue({ ...proyecto, estado: 'completado' } as Proyecto);
    finanzasService.create.mockResolvedValue({ id: 1 } as any);

    await service.update(1, 1, { estado: 'completado' } as any);

    expect(finanzasService.create).toHaveBeenCalledWith(1, {
      tipo: 'ingreso',
      categoria: 'Desarrollo',
      monto: 500,
      moneda: 'USD',
      descripcion: 'Ganancia del proyecto: P1',
      fecha: expect.any(String),
      proyectoId: 1,
      clienteId: 2,
    });
  });

  it('update: no registra ganancia si estado no cambia a completado', async () => {
    const proyecto = { id: 1, creadorId: 1, estado: 'activo' } as Proyecto;
    repo.findOne.mockResolvedValue(proyecto);
    repo.save.mockResolvedValue({ ...proyecto, estado: 'en_pausa' } as Proyecto);

    await service.update(1, 1, { estado: 'en_pausa' } as any);

    expect(finanzasService.create).not.toHaveBeenCalled();
  });

  it('remove: elimina proyecto existente', async () => {
    const proyecto = { id: 1, creadorId: 1 } as Proyecto;
    repo.findOne.mockResolvedValue(proyecto);

    await service.remove(1, 1);

    expect(repo.remove).toHaveBeenCalledWith(proyecto);
  });

  it('findOne: retorna proyecto compartido a miembro', async () => {
    repo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, creadorId: 9 } as Proyecto);
    const miembroRepo = service['miembroRepository'] as unknown as { findOne: jest.Mock };
    jest.spyOn(service, 'rolEnProyecto').mockResolvedValue('lector');

    const result = await service.findOne(1, 5);

    expect(result.creadorId).toBe(9);
    expect(miembroRepo.findOne).not.toHaveBeenCalled();
  });

  it('update: lector no puede editar proyecto ajeno', async () => {
    repo.findOne.mockResolvedValue(null);
    jest.spyOn(service, 'rolEnProyecto').mockResolvedValue('lector');

    await expect(service.update(1, 5, { nombre: 'X' } as any)).rejects.toThrow();
  });

  it('invitarMiembro: crea invitación y envía correo', async () => {
    const proyecto = { id: 1, creadorId: 1, nombre: 'P1' } as Proyecto;
    repo.findOne.mockResolvedValue(proyecto);
    const usuarioRepo = service['usuarioRepository'] as unknown as { findOne: jest.Mock };
    usuarioRepo.findOne.mockResolvedValue(null);
    const invRepo = service['invitacionRepository'] as unknown as { delete: jest.Mock; create: jest.Mock; save: jest.Mock };
    invRepo.delete.mockResolvedValue(undefined);
    invRepo.create.mockReturnValue({ id: 1 });
    invRepo.save.mockResolvedValue({ id: 1 });
    const mail = service['mailService'] as unknown as { sendMail: jest.Mock };

    const result = await service.invitarMiembro(1, 1, { email: 'nuevo@mail.com', rol: 'editor' });

    expect(invRepo.save).toHaveBeenCalled();
    expect(mail.sendMail).toHaveBeenCalledWith(
      'nuevo@mail.com',
      expect.stringContaining('P1'),
      expect.any(String),
      expect.objectContaining({ rol: 'editor' }),
    );
    expect(result.mensaje).toContain('nuevo@mail.com');
  });

  it('aceptarInvitacion: crea miembro y marca uso', async () => {
    const invRepo = service['invitacionRepository'] as unknown as { findOne: jest.Mock; save: jest.Mock };
    invRepo.findOne.mockResolvedValue({
      id: 7,
      proyectoId: 1,
      email: 'nuevo@mail.com',
      rol: 'editor',
      usadoEn: null,
      expiraEn: new Date(Date.now() + 864e5),
      proyecto: { nombre: 'P1' },
    });
    const usuarioRepo = service['usuarioRepository'] as unknown as { findOne: jest.Mock };
    usuarioRepo.findOne.mockResolvedValue({ id: 5, correo: 'nuevo@mail.com' });
    const miembroRepo = service['miembroRepository'] as unknown as { findOne: jest.Mock; save: jest.Mock };
    miembroRepo.findOne.mockResolvedValue(null);
    miembroRepo.save.mockResolvedValue({ id: 1 });
    invRepo.save.mockResolvedValue({});

    const result = await service.aceptarInvitacion('token-crudo', 5);

    expect(miembroRepo.save).toHaveBeenCalledWith(expect.objectContaining({ proyectoId: 1, usuarioId: 5 }));
    expect(invRepo.save).toHaveBeenCalledWith(expect.objectContaining({ usadoEn: expect.any(Date) }));
    expect(result).toEqual({ id: 1, nombre: 'P1' });
  });

  it('aceptarInvitacion: sin login usa el correo de la invitación', async () => {
    const invRepo = service['invitacionRepository'] as unknown as { findOne: jest.Mock; save: jest.Mock };
    invRepo.findOne.mockResolvedValue({
      id: 7,
      proyectoId: 1,
      email: 'nuevo@mail.com',
      rol: 'lector',
      usadoEn: null,
      expiraEn: new Date(Date.now() + 864e5),
      proyecto: { nombre: 'P1' },
    });
    const usuarioRepo = service['usuarioRepository'] as unknown as { findOne: jest.Mock };
    usuarioRepo.findOne.mockResolvedValue({ id: 5, correo: 'nuevo@mail.com' });
    const miembroRepo = service['miembroRepository'] as unknown as { findOne: jest.Mock; save: jest.Mock };
    miembroRepo.findOne.mockResolvedValue(null);
    miembroRepo.save.mockResolvedValue({ id: 1 });
    invRepo.save.mockResolvedValue({});

    const result = await service.aceptarInvitacion('token-crudo');

    expect(usuarioRepo.findOne).toHaveBeenCalledWith({ where: { correo: 'nuevo@mail.com' } });
    expect(result).toEqual({ id: 1, nombre: 'P1' });
  });

  it('aceptarInvitacion: sin cuenta pide registrarse', async () => {
    const invRepo = service['invitacionRepository'] as unknown as { findOne: jest.Mock };
    invRepo.findOne.mockResolvedValue({
      id: 7,
      proyectoId: 1,
      email: 'nadie@mail.com',
      rol: 'lector',
      usadoEn: null,
      expiraEn: new Date(Date.now() + 864e5),
      proyecto: { nombre: 'P1' },
    });
    const usuarioRepo = service['usuarioRepository'] as unknown as { findOne: jest.Mock };
    usuarioRepo.findOne.mockResolvedValue(null);

    await expect(service.aceptarInvitacion('token-crudo')).rejects.toThrow('registrate primero');
  });

  it('cambiarRolMiembro: propietario actualiza rol', async () => {
    repo.findOne.mockResolvedValue({ id: 1, creadorId: 1 } as Proyecto);
    const miembroRepo = service['miembroRepository'] as unknown as { findOne: jest.Mock; save: jest.Mock };
    const miembro = { id: 2, proyectoId: 1, usuarioId: 5, rol: 'lector' };
    miembroRepo.findOne.mockResolvedValue(miembro);
    miembroRepo.save.mockResolvedValue({ ...miembro, rol: 'editor' });

    await service.cambiarRolMiembro(1, 1, 5, 'editor');

    expect(miembroRepo.save).toHaveBeenCalledWith(expect.objectContaining({ rol: 'editor' }));
  });

  it('cambiarRolMiembro: no propietario no puede', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.cambiarRolMiembro(1, 9, 5, 'editor')).rejects.toThrow('Proyecto no encontrado');
  });

  it('cambiarRolMiembro: miembro inexistente', async () => {
    repo.findOne.mockResolvedValue({ id: 1, creadorId: 1 } as Proyecto);
    const miembroRepo = service['miembroRepository'] as unknown as { findOne: jest.Mock };
    miembroRepo.findOne.mockResolvedValue(null);

    await expect(service.cambiarRolMiembro(1, 1, 99, 'editor')).rejects.toThrow('Miembro no encontrado');
  });

  it('vistaPreviaInvitacion: muestra datos públicos', async () => {
    const invRepo = service['invitacionRepository'] as unknown as { findOne: jest.Mock };
    invRepo.findOne.mockResolvedValue({
      email: 'nuevo@mail.com',
      rol: 'editor',
      usadoEn: null,
      expiraEn: new Date(Date.now() + 864e5),
      proyecto: { nombre: 'P1' },
    });

    const result = await service.vistaPreviaInvitacion('token-crudo');

    expect(result).toEqual(expect.objectContaining({ proyectoNombre: 'P1', email: 'nuevo@mail.com', rol: 'editor' }));
  });

  it('crearLinkPublico: genera URL con token', async () => {
    repo.findOne.mockResolvedValue({ id: 1, creadorId: 1 } as Proyecto);
    const compRepo = service['comparticionRepository'] as unknown as { create: jest.Mock; save: jest.Mock };
    compRepo.create.mockReturnValue({ id: 1 });
    compRepo.save.mockResolvedValue({ id: 1 });
    const config = service['configService'] as unknown as { get: jest.Mock };
    config.get.mockReturnValue('http://localhost:3000');

    const result = await service.crearLinkPublico(1, 1);

    expect(compRepo.save).toHaveBeenCalled();
    expect(result.url).toContain('/proyecto-publico?token=');
  });

  it('crearLinkPublico: rechaza si no es propietario', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.crearLinkPublico(1, 9)).rejects.toThrow('Proyecto no encontrado');
  });

  it('obtenerPublicoPorToken: devuelve resumen público con progreso', async () => {
    const compRepo = service['comparticionRepository'] as unknown as { findOne: jest.Mock };
    compRepo.findOne.mockResolvedValue({
      proyectoId: 1,
      usadoEn: null,
      expiraEn: new Date(Date.now() + 864e5),
    });
    repo.findOne.mockResolvedValue({
      nombre: 'P1',
      estado: 'activo',
      prioridad: 'alta',
      descripcion: 'desc',
      moneda: 'USD',
      ganancia: 1000,
      clienteRel: { nombre: 'Cliente A' },
      creador: { nombre: 'Dueño' },
      tareas: [
        { id: 1, titulo: 'T1', estado: 'completada', prioridad: 'alta', fechaVencimiento: null },
        { id: 2, titulo: 'T2', estado: 'pendiente', prioridad: 'baja', fechaVencimiento: null },
      ],
    } as never);

    const result = await service.obtenerPublicoPorToken('token-publico');

    expect(result.progreso).toBe(50);
    expect(result.totalTareas).toBe(2);
    expect(result.tareasCompletadas).toBe(1);
    expect(result.nombre).toBe('P1');
  });

  it('obtenerPublicoPorToken: rechaza token inválido, usado o expirado', async () => {
    const compRepo = service['comparticionRepository'] as unknown as { findOne: jest.Mock };
    compRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.obtenerPublicoPorToken('invalido')).rejects.toThrow('Enlace inválido');

    compRepo.findOne.mockResolvedValueOnce({ proyectoId: 1, usadoEn: new Date(), expiraEn: new Date(Date.now() + 864e5) });
    await expect(service.obtenerPublicoPorToken('usado')).rejects.toThrow('Enlace ya utilizado');

    compRepo.findOne.mockResolvedValueOnce({ proyectoId: 1, usadoEn: null, expiraEn: new Date(Date.now() - 864e5) });
    await expect(service.obtenerPublicoPorToken('expirado')).rejects.toThrow('Enlace expirado');
  });
});
