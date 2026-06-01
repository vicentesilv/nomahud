import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DocumentosService } from '../documentos.service';
import { Documento } from '../entities/documento.entity';
import { CrearDocumentoDto } from '../dtos/crear-documento.dto';
import { ActualizarDocumentoDto } from '../dtos/actualizar-documento.dto';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

describe('DocumentosService', () => {
  let service: DocumentosService;
  let repo: jest.Mocked<Repository<Documento>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentosService,
        {
          provide: getRepositoryToken(Documento),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentosService>(DocumentosService);
    repo = module.get(getRepositoryToken(Documento));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create: guarda archivo y crea documento', async () => {
    const file = {
      originalname: 'doc.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('test'),
    } as Express.Multer.File;
    const dto: CrearDocumentoDto = { nombre: 'Mi documento', tipo: 'proyecto' };
    const docCreado = { id: 1, nombre: 'Mi documento', archivo: expect.any(String), tipo: 'proyecto', mimeType: 'application/pdf', size: 1024, creadorId: 1 } as Documento;

    repo.create.mockReturnValue(docCreado);
    repo.save.mockResolvedValue(docCreado);

    const result = await service.create(1, file, dto);

    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith(docCreado);
    expect(result).toBe(docCreado);
  });

  it('findAll: retorna documentos del creador sin filtro de tipo', async () => {
    const docs = [{ id: 1 }, { id: 2 }] as Documento[];
    repo.find.mockResolvedValue(docs);

    const result = await service.findAll(1);

    expect(repo.find).toHaveBeenCalledWith({
      where: { creadorId: 1 },
      order: { createdAt: 'DESC' },
    });
    expect(result).toBe(docs);
  });

  it('findAll: filtra por tipo si se proporciona', async () => {
    const docs = [{ id: 1, tipo: 'proyecto' }] as Documento[];
    repo.find.mockResolvedValue(docs);

    const result = await service.findAll(1, 'proyecto');

    expect(repo.find).toHaveBeenCalledWith({
      where: { creadorId: 1, tipo: 'proyecto' },
      order: { createdAt: 'DESC' },
    });
    expect(result).toBe(docs);
  });

  it('findOne: retorna documento si existe', async () => {
    const doc = { id: 1, creadorId: 1 } as Documento;
    repo.findOne.mockResolvedValue(doc);

    const result = await service.findOne(1, 1);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1, creadorId: 1 } });
    expect(result).toBe(doc);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza documento existente', async () => {
    const existente = { id: 1, creadorId: 1, nombre: 'Viejo' } as Documento;
    const dto: ActualizarDocumentoDto = { nombre: 'Nuevo' };
    const guardado = { ...existente, nombre: 'Nuevo' } as Documento;

    repo.findOne.mockResolvedValue(existente);
    repo.save.mockResolvedValue(guardado);

    const result = await service.update(1, 1, dto);

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Nuevo' }));
    expect(result).toBe(guardado);
  });

  it('remove: elimina documento y archivo si existe', async () => {
    const doc = { id: 1, creadorId: 1, archivo: 'test.pdf' } as Documento;
    repo.findOne.mockResolvedValue(doc);
    repo.remove.mockResolvedValue(doc);

    await service.remove(1, 1);

    expect(repo.remove).toHaveBeenCalledWith(doc);
  });

  it('getRutaArchivo: retorna ruta completa', () => {
    const ruta = service.getRutaArchivo('test.pdf');
    expect(ruta).toContain('uploads');
    expect(ruta).toContain('documentos');
    expect(ruta).toContain('test.pdf');
  });
});
