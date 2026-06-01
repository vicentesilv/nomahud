import { Test, TestingModule } from '@nestjs/testing';
import { ClientesController } from '../clientes.controller';
import { ClientesService } from '../clientes.service';

describe('ClientesController', () => {
  let controller: ClientesController;
  let service: jest.Mocked<ClientesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [
        {
          provide: ClientesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ClientesController);
    service = module.get(ClientesService);
  });

  it('create: delega en service', async () => {
    const usuario = { id: 1 } as any;
    const dto = { nombre: 'Cliente' } as any;
    service.create.mockResolvedValue({ id: 1 } as any);

    await controller.create(usuario, dto);

    expect(service.create).toHaveBeenCalledWith(1, dto);
  });

  it('findAll: delega en service', async () => {
    const usuario = { id: 1 } as any;
    service.findAll.mockResolvedValue([]);

    await controller.findAll(usuario);

    expect(service.findAll).toHaveBeenCalledWith(1);
  });

  it('findOne: delega en service', async () => {
    const usuario = { id: 1 } as any;
    service.findOne.mockResolvedValue({ id: 5 } as any);

    await controller.findOne(usuario, 5);

    expect(service.findOne).toHaveBeenCalledWith(5, 1);
  });

  it('update: delega en service', async () => {
    const usuario = { id: 1 } as any;
    const dto = { nombre: 'Actualizado' } as any;
    service.update.mockResolvedValue({ id: 1 } as any);

    await controller.update(usuario, 1, dto);

    expect(service.update).toHaveBeenCalledWith(1, 1, dto);
  });

  it('remove: elimina y retorna mensaje', async () => {
    const usuario = { id: 1 } as any;

    const result = await controller.remove(usuario, 1);

    expect(service.remove).toHaveBeenCalledWith(1, 1);
    expect(result).toEqual({ mensaje: 'Cliente eliminado correctamente' });
  });
});
