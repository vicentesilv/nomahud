import { BadRequestException } from '@nestjs/common';
import { DivisasService } from '../divisas.service';

describe('DivisasService', () => {
  let service: DivisasService;

  beforeEach(() => {
    service = new DivisasService();
    jest.spyOn(global, 'fetch').mockRestore();
  });

  it('getTasas: usa la API externa y cachea', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'success', rates: { USD: 1, EUR: 0.9, MXN: 20 } }),
    } as Response);

    const r1 = await service.getTasas('USD');
    expect(r1.tasas.EUR).toBe(0.9);
    expect(r1.tasas.USD).toBe(1);

    const r2 = await service.getTasas('USD');
    expect(r2).toEqual(r1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('getTasas: usa respaldo si la API falla', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 } as Response);

    const r = await service.getTasas('USD');
    expect(r.tasas.USD).toBe(1);
    expect(r.tasas.MXN).toBeGreaterThan(0);
  });

  it('convertir: mismo origen y destino no toca el monto', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    expect(await service.convertir(100, 'USD', 'USD')).toBe(100);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('convertir: convierte vía USD', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'success', rates: { USD: 1, MXN: 20 } }),
    } as Response);

    expect(await service.convertir(200, 'MXN', 'USD')).toBe(10);
    expect(await service.convertir(10, 'USD', 'MXN')).toBe(200);
  });

  it('rechaza monedas no soportadas', async () => {
    await expect(service.getTasas('XYZ')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.convertir(1, 'USD', 'XYZ')).rejects.toBeInstanceOf(BadRequestException);
  });
});
