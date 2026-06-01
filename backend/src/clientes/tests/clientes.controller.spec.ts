import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ClientesController } from '../clientes.controller';
import { ClientesService } from '../clientes.service';
import { CrearClienteDto } from '../dtos/crear-cliente.dto';
import { ActualizarClienteDto } from '../dtos/actualizar-cliente.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('ClientesController', () => {
  let controller: ClientesController;
  let clientesService: jest.Mocked<ClientesService>;

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

    controller = module.get<ClientesController>(ClientesController);
    clientesService = module.get(ClientesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('controlador usa JwtAuthGuard a nivel de clase', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, ClientesController);
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  it('POST /: llama a service.create con usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: CrearClienteDto = { nombre: 'Juan' };
    const clienteCreado = { id: 1, nombre: 'Juan' } as any;
    clientesService.create.mockResolvedValue(clienteCreado);

    const result = await controller.create(usuario, dto);

    expect(clientesService.create).toHaveBeenCalledWith(1, dto);
    expect(result).toBe(clienteCreado);
  });

  it('GET /: llama a service.findAll con usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const clientes = [{ id: 1 }, { id: 2 }] as any;
    clientesService.findAll.mockResolvedValue(clientes);

    const result = await controller.findAll(usuario);

    expect(clientesService.findAll).toHaveBeenCalledWith(1);
    expect(result).toBe(clientes);
  });

  it('GET /:id: llama a service.findOne con id y usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const cliente = { id: 5 } as any;
    clientesService.findOne.mockResolvedValue(cliente);

    const result = await controller.findOne(usuario, 5);

    expect(clientesService.findOne).toHaveBeenCalledWith(5, 1);
    expect(result).toBe(cliente);
  });

  it('PATCH /:id: llama a service.update con id, usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: ActualizarClienteDto = { nombre: 'Actualizado' };
    const actualizado = { id: 5, nombre: 'Actualizado' } as any;
    clientesService.update.mockResolvedValue(actualizado);

    const result = await controller.update(usuario, 5, dto);

    expect(clientesService.update).toHaveBeenCalledWith(5, 1, dto);
    expect(result).toBe(actualizado);
  });

  it('DELETE /:id: llama a service.remove y retorna mensaje', async () => {
    const usuario = { id: 1 } as any;
    clientesService.remove.mockResolvedValue(undefined);

    const result = await controller.remove(usuario, 5);

    expect(clientesService.remove).toHaveBeenCalledWith(5, 1);
    expect(result).toEqual({ mensaje: 'Cliente eliminado correctamente' });
  });
});
