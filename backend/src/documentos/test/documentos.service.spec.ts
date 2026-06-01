import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DocumentosService } from '../documentos.service';
import { Documento } from '../entities/documento.entity';
import * as fs from 'fs/promises';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

describe('DocumentosService', () => {
  let service: DocumentosService;
  let repo: jest.Mocked<{
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  }>;

  const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
    ({
      originalname: 'documento.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('test'),
      ...overrides,
    }) as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentosService,
        {
          provide: getRepositoryToken(Documento),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(DocumentosService);
    repo = module.get(getRepositoryToken(Documento));
  });

  it('create: guarda archivo y crea documento', async () => {
    const file = makeFile();
    const dto = { tipo: 'proyecto' as const, entidadId: 1 };
    repo.create.mockReturnValue({ id: 1, nombre: 'documento.pdf', archivo: expect.any(String) } as any);
    repo.save.mockResolvedValue({ id: 1, nombre: 'documento.pdf' } as Documento);

    const result = await service.create(1, file, dto);

    expect(fs.writeFile).toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'proyecto', entidadId: 1, creadorId: 1 }),
    );
    expect(result.id).toBe(1);
  });

  it('findAll: retorna documentos filtrados por tipo', async () => {
    const docs = [{ id: 1 }] as Documento[];
    repo.find.mockResolvedValue(docs);

    const result = await service.findAll(1, 'proyecto');

    expect(repo.find).toHaveBeenCalledWith({
      where: { creadorId: 1, tipo: 'proyecto' },
      order: { createdAt: 'DESC' },
    });
    expect(result).toBe(docs);
  });

  it('findAll: retorna documentos sin filtro de tipo', async () => {
    const docs = [{ id: 1 }] as Documento[];
    repo.find.mockResolvedValue(docs);

    const result = await service.findAll(1);

    expect(repo.find).toHaveBeenCalledWith({
      where: { creadorId: 1 },
      order: { createdAt: 'DESC' },
    });
    expect(result).toBe(docs);
  });

  it('findOne: retorna documento si existe', async () => {
    const doc = { id: 1, creadorId: 1 } as Documento;
    repo.findOne.mockResolvedValue(doc);

    const result = await service.findOne(1, 1);

    expect(result).toBe(doc);
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: actualiza metadata del documento', async () => {
    const doc = { id: 1, creadorId: 1, nombre: 'Viejo' } as Documento;
    repo.findOne.mockResolvedValue(doc);
    repo.save.mockResolvedValue({ ...doc, nombre: 'Nuevo' } as Documento);

    const result = await service.update(1, 1, { nombre: 'Nuevo' } as any);

    expect(result.nombre).toBe('Nuevo');
  });

  it('reemplazarArchivo: reemplaza archivo fisico', async () => {
    const doc = { id: 1, creadorId: 1, archivo: 'viejo.pdf' } as Documento;
    repo.findOne.mockResolvedValue(doc);
    repo.save.mockResolvedValue({ ...doc, archivo: expect.any(String) } as Documento);

    const result = await service.reemplazarArchivo(1, 1, makeFile());

    expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('viejo.pdf'));
    expect(fs.writeFile).toHaveBeenCalled();
    expect(result.archivo).toBeDefined();
  });

  it('remove: elimina archivo y registro', async () => {
    const doc = { id: 1, creadorId: 1, archivo: 'doc.pdf' } as Documento;
    repo.findOne.mockResolvedValue(doc);

    await service.remove(1, 1);

    expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('doc.pdf'));
    expect(repo.remove).toHaveBeenCalledWith(doc);
  });
});
