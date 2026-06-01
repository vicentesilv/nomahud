import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { DocumentosController } from '../documentos.controller';
import { DocumentosService } from '../documentos.service';
import { CrearDocumentoDto } from '../dtos/crear-documento.dto';
import { ActualizarDocumentoDto } from '../dtos/actualizar-documento.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

describe('DocumentosController', () => {
  let controller: DocumentosController;
  let documentosService: jest.Mocked<DocumentosService>;

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
            reemplazarArchivo: jest.fn(),
            remove: jest.fn(),
            getRutaArchivo: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DocumentosController>(DocumentosController);
    documentosService = module.get(DocumentosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('controlador usa JwtAuthGuard a nivel de clase', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, DocumentosController);
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  it('POST /: llama a service.create con usuario.id, file y dto', async () => {
    const usuario = { id: 1 } as any;
    const file = { originalname: 'doc.pdf' } as Express.Multer.File;
    const dto: CrearDocumentoDto = { nombre: 'Doc', tipo: 'proyecto' };
    const creado = { id: 1 } as any;
    documentosService.create.mockResolvedValue(creado);

    const result = await controller.upload(usuario, file, dto);

    expect(documentosService.create).toHaveBeenCalledWith(1, file, dto);
    expect(result).toBe(creado);
  });

  it('POST /: lanza error si no hay archivo', async () => {
    const usuario = { id: 1 } as any;
    const dto: CrearDocumentoDto = { nombre: 'Doc', tipo: 'proyecto' };

    await expect(controller.upload(usuario, null as any, dto)).rejects.toThrow('Archivo es requerido');
  });

  it('GET /: llama a service.findAll con usuario.id y tipo opcional', async () => {
    const usuario = { id: 1 } as any;
    const docs = [{ id: 1 }] as any;
    documentosService.findAll.mockResolvedValue(docs);

    const result = await controller.findAll(usuario, 'proyecto');

    expect(documentosService.findAll).toHaveBeenCalledWith(1, 'proyecto');
    expect(result).toBe(docs);
  });

  it('GET /:id: llama a service.findOne con id y usuario.id', async () => {
    const usuario = { id: 1 } as any;
    const doc = { id: 5 } as any;
    documentosService.findOne.mockResolvedValue(doc);

    const result = await controller.findOne(usuario, 5);

    expect(documentosService.findOne).toHaveBeenCalledWith(5, 1);
    expect(result).toBe(doc);
  });

  it('PATCH /:id: llama a service.update con id, usuario.id y dto', async () => {
    const usuario = { id: 1 } as any;
    const dto: ActualizarDocumentoDto = { nombre: 'Renombrado' };
    const actualizado = { id: 5, nombre: 'Renombrado' } as any;
    documentosService.update.mockResolvedValue(actualizado);

    const result = await controller.update(usuario, 5, dto);

    expect(documentosService.update).toHaveBeenCalledWith(5, 1, dto);
    expect(result).toBe(actualizado);
  });

  it('DELETE /:id: llama a service.remove y retorna mensaje', async () => {
    const usuario = { id: 1 } as any;
    documentosService.remove.mockResolvedValue(undefined);

    const result = await controller.remove(usuario, 5);

    expect(documentosService.remove).toHaveBeenCalledWith(5, 1);
    expect(result).toEqual({ mensaje: 'Documento eliminado correctamente' });
  });
});
