import { CallHandler, ExecutionContext, ForbiddenException, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Los usuarios con rol "invitado" solo pueden moverse en proyectos compartidos:
 * ver proyectos/tareas, su perfil y aceptar invitaciones. Todo lo demás → 403.
 * Se ejecuta como interceptor global (después de los guards): sin usuario, pasa.
 */
const RUTAS_PERMITIDAS: Array<{ metodo: string; patron: RegExp }> = [
    { metodo: 'GET', patron: /^\/proyectos\/invitaciones\/.+/ },
    { metodo: 'POST', patron: /^\/proyectos\/invitaciones\/aceptar\/?$/ },
    { metodo: 'GET', patron: /^\/proyectos\/?$/ },
    { metodo: 'GET', patron: /^\/proyectos\/\d+\/?$/ },
    { metodo: 'GET', patron: /^\/proyectos\/\d+\/miembros\/?$/ },
    { metodo: 'GET', patron: /^\/tareas\/?$/ },
    { metodo: 'GET', patron: /^\/tareas\/proyecto\/\d+\/?$/ },
    { metodo: 'GET', patron: /^\/tareas\/\d+\/?$/ },
    { metodo: 'PATCH', patron: /^\/tareas\/\d+\/?$/ },
    { metodo: 'GET', patron: /^\/perfiles\/mi-perfil\/?$/ },
    { metodo: 'PATCH', patron: /^\/perfiles\/mi-perfil\/?$/ },
    { metodo: 'POST', patron: /^\/perfiles\/mi-perfil\/avatar\/?$/ },
    { metodo: 'GET', patron: /^\/perfiles\/avatar\/.+/ },
    { metodo: 'POST', patron: /^\/auth\/(renovar|cerrar-sesion|completar-registro)\/?$/ },
    { metodo: 'GET', patron: /^\/salud\/?$/ },
    { metodo: 'GET', patron: /^\/?$/ },
];

@Injectable()
export class InvitadoInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest<{ user?: { rol?: string }; method: string; path: string }>();
        const rol = request.user?.rol;
        if (rol !== 'invitado') {
            return next.handle();
        }
        const metodo = (request.method || 'GET').toUpperCase();
        const ruta = request.path || '/';
        const permitido = RUTAS_PERMITIDAS.some((r) => r.metodo === metodo && r.patron.test(ruta));
        if (!permitido) {
            throw new ForbiddenException('Tu cuenta de invitado solo puede acceder a los proyectos compartidos. Completá tu registro para desbloquear todo.');
        }
        return next.handle();
    }
}
