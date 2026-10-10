import { ForbiddenException } from '@nestjs/common';
import { of } from 'rxjs';
import { InvitadoInterceptor } from '../invitado.interceptor';

function contexto(rol: string | undefined, metodo: string, ruta: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: rol ? { rol } : undefined, method: metodo, path: ruta }),
    }),
  } as never;
}

const handler = { handle: () => of('ok') } as never;

describe('InvitadoInterceptor', () => {
  const interceptor = new InvitadoInterceptor();

  it('deja pasar a usuarios normales en cualquier ruta', (done) => {
    interceptor.intercept(contexto('normal', 'POST', '/proyectos'), handler).subscribe({
      next: (v) => {
        expect(v).toBe('ok');
        done();
      },
    });
  });

  it('deja pasar sin usuario (rutas públicas)', (done) => {
    interceptor.intercept(contexto(undefined, 'POST', '/auth/registro'), handler).subscribe({
      next: (v) => {
        expect(v).toBe('ok');
        done();
      },
    });
  });

  it('permite a invitado ver proyectos y tareas', (done) => {
    interceptor.intercept(contexto('invitado', 'GET', '/proyectos/5'), handler).subscribe({
      next: (v) => {
        expect(v).toBe('ok');
        done();
      },
    });
  });

  it('permite a invitado mover tareas (PATCH)', (done) => {
    interceptor.intercept(contexto('invitado', 'PATCH', '/tareas/3'), handler).subscribe({
      next: (v) => {
        expect(v).toBe('ok');
        done();
      },
    });
  });

  it('bloquea a invitado crear proyectos', () => {
    expect(() => interceptor.intercept(contexto('invitado', 'POST', '/proyectos'), handler)).toThrow(
      ForbiddenException,
    );
  });

  it('bloquea a invitado finanzas, viajes, documentos y dashboard', () => {
    for (const [metodo, ruta] of [
      ['GET', '/finanzas'],
      ['POST', '/tiempo'],
      ['GET', '/viajes'],
      ['GET', '/documentos'],
      ['GET', '/dashboard'],
      ['GET', '/clientes'],
      ['DELETE', '/tareas/3'],
      ['POST', '/proyectos/1/invitar'],
    ] as Array<[string, string]>) {
      expect(() => interceptor.intercept(contexto('invitado', metodo, ruta), handler)).toThrow(ForbiddenException);
    }
  });

  it('permite a invitado renovar sesión y completar registro', (done) => {
    interceptor.intercept(contexto('invitado', 'POST', '/auth/completar-registro'), handler).subscribe({
      next: (v) => {
        expect(v).toBe('ok');
        done();
      },
    });
  });
});
