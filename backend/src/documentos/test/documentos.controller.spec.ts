import { Test, TestingModule } from '@nestjs/testing';
import { DocumentosController } from '../documentos.controller';
import { DocumentosService } from '../documentos.service';

describe('DocumentosController', () => {
  let controller: DocumentosController;
  let service: jest.Mocked<DocumentosService>;

  const usuario = { id: 1 } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentosController],
      providers: [
        {
          provide: DocumentosService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            reemplazarArchivo: jest.fn(),
            getRutaArchivo: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(DocumentosController);
    service = module.get(DocumentosService);
  });

  it('upload: delega en service', async () => {
    const file = { originalname: 'doc.pdf' } as Express.Multer.File;
    const dto = { tipo: 'proyecto' } as any;
    service.create.mockResolvedValue({ id: 1 } as any);

    await controller.upload(usuario, file, dto);

    expect(service.create).toHaveBeenCalledWith(1, file, dto);
  });

  it('upload: lanza error si no hay archivo', async () => {
    await expect(controller.upload(usuario, null as any, {} as any)).rejects.toThrow(
      'Archivo es requerido',
    );
  });

  it('findAll: delega en service', async () => {
    service.findAll.mockResolvedValue([]);

    await controller.findAll(usuario, 'proyecto');

    expect(service.findAll).toHaveBeenCalledWith(1, 'proyecto');
  });

  it('findAll: sin filtro de tipo', async () => {
    service.findAll.mockResolvedValue([]);

    await controller.findAll(usuario);

    expect(service.findAll).toHaveBeenCalledWith(1, undefined);
  });

  it('findOne: delega en service', async () => {
    service.findOne.mockResolvedValue({ id: 5 } as any);

    await controller.findOne(usuario, 5);

    expect(service.findOne).toHaveBeenCalledWith(5, 1);
  });

  it('update: delega en service', async () => {
    const dto = { nombre: 'Nuevo' } as any;
    service.update.mockResolvedValue({ id: 1 } as any);

    await controller.update(usuario, 1, dto);

    expect(service.update).toHaveBeenCalledWith(1, 1, dto);
  });

  it('reemplazarArchivo: delega en service', async () => {
    const file = { originalname: 'nuevo.pdf' } as Express.Multer.File;
    service.reemplazarArchivo.mockResolvedValue({ id: 1 } as any);

    await controller.reemplazarArchivo(usuario, 1, file);

    expect(service.reemplazarArchivo).toHaveBeenCalledWith(1, 1, file);
  });

  it('reemplazarArchivo: lanza error si no hay archivo', async () => {
    await expect(controller.reemplazarArchivo(usuario, 1, null as any)).rejects.toThrow(
      'Archivo es requerido',
    );
  });

  it('remove: elimina y retorna mensaje', async () => {
    const result = await controller.remove(usuario, 1);

    expect(service.remove).toHaveBeenCalledWith(1, 1);
    expect(result).toEqual({ mensaje: 'Documento eliminado correctamente' });
  });
});
