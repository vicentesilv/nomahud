import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { Tarea } from '../tareas/entities/tarea.entity';
import { Viaje } from '../viajes/entities/viaje.entity';
import { RegistroTiempo } from '../tiempo/entities/registro-tiempo.entity';
import { Transaccion } from '../finanzas/entities/transaccion.entity';

interface Destinatario {
    id: number;
    nombre: string;
    correo: string;
}

@Injectable()
export class NotificacionesService {
    private readonly logger = new Logger(NotificacionesService.name);

    constructor(
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
        @InjectRepository(Perfil)
        private readonly perfilRepository: Repository<Perfil>,
        @InjectRepository(Tarea)
        private readonly tareaRepository: Repository<Tarea>,
        @InjectRepository(Viaje)
        private readonly viajeRepository: Repository<Viaje>,
        @InjectRepository(RegistroTiempo)
        private readonly tiempoRepository: Repository<RegistroTiempo>,
        @InjectRepository(Transaccion)
        private readonly transaccionRepository: Repository<Transaccion>,
    ) {}

    private frontendUrl(): string {
        return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    }

    private async destinatarios(): Promise<Destinatario[]> {
        const perfiles = await this.perfilRepository.find({ relations: ['usuario'] });
        return perfiles
            .filter((p) => p.notificacionesEmail !== false)
            .map((p) => p.usuario)
            .filter((u) => u && u.emailVerificado && u.estadoCuenta === 'activa')
            .map((u) => ({ id: u.id, nombre: u.nombre, correo: u.correo }));
    }

    @Cron('0 8 * * *')
    async recordarVencimientos(): Promise<void> {
        const limite = new Date();
        limite.setDate(limite.getDate() + 2);

        for (const user of await this.destinatarios()) {
            const tareas = await this.tareaRepository.find({
                where: { proyecto: { creadorId: user.id }, estado: In(['pendiente', 'en_progreso']) },
                relations: ['proyecto'],
                order: { fechaVencimiento: 'ASC' },
            });
            const urgentes = tareas.filter((t) => t.fechaVencimiento && new Date(t.fechaVencimiento) <= limite);
            if (urgentes.length === 0) continue;

            const items = urgentes
                .map((t) => {
                    const fecha = new Date(t.fechaVencimiento).toLocaleDateString('es-MX');
                    const vencida = new Date(t.fechaVencimiento) < new Date(new Date().toDateString());
                    return `<li><strong>${this.esc(t.titulo)}</strong> — vence ${fecha}${vencida ? ' (¡vencida!)' : ''} <em>(${this.esc(t.proyecto?.nombre || '')})</em></li>`;
                })
                .join('');

            await this.mailService.sendMail(
                user.correo,
                `Tienes ${urgentes.length} tarea(s) por vencer`,
                `<h1>Hola {{nombre}}</h1><p>Estas tareas vencen pronto:</p><ul>${items}</ul><p><a href="{{url}}">Ver mis tareas</a></p>`,
                { nombre: user.nombre, url: `${this.frontendUrl()}/tareas` },
            );
            this.logger.log(`Recordatorio de vencimientos enviado a usuarioId=${user.id} (${urgentes.length} tareas)`);
        }
    }

    @Cron('0 9 * * 1')
    async resumenSemanal(): Promise<void> {
        const hace7d = new Date();
        hace7d.setDate(hace7d.getDate() - 7);

        for (const user of await this.destinatarios()) {
            const [tareas, tiempos, transacciones] = await Promise.all([
                this.tareaRepository.find({
                    where: { proyecto: { creadorId: user.id }, estado: 'completada' },
                    relations: ['proyecto'],
                }),
                this.tiempoRepository.find({ where: { creadorId: user.id } }),
                this.transaccionRepository.find({ where: { creadorId: user.id } }),
            ]);

            const completadas = tareas.filter((t) => t.updatedAt && new Date(t.updatedAt) >= hace7d).length;
            const horas = tiempos
                .filter((r) => r.createdAt && new Date(r.createdAt) >= hace7d)
                .reduce((s, r) => s + Number(r.horas || 0), 0);
            const recientes = transacciones.filter((t) => t.createdAt && new Date(t.createdAt) >= hace7d);
            const ingresos = recientes
                .filter((t) => t.tipo === 'ingreso')
                .reduce((s, t) => s + Number(t.monto || 0), 0);
            const gastos = recientes
                .filter((t) => t.tipo === 'gasto')
                .reduce((s, t) => s + Number(t.monto || 0), 0);

            if (completadas === 0 && horas === 0 && ingresos === 0 && gastos === 0) continue;

            await this.mailService.sendMail(
                user.correo,
                'Tu resumen semanal en Nomahud',
                `<h1>Hola {{nombre}}</h1><p>Tu semana:</p><ul><li>Tareas completadas: {{completadas}}</li><li>Horas registradas: {{horas}}</li><li>Ingresos: {{ingresos}}</li><li>Gastos: {{gastos}}</li></ul><p><a href="{{url}}">Ver dashboard</a></p>`,
                {
                    nombre: user.nombre,
                    completadas,
                    horas: horas.toFixed(1),
                    ingresos: ingresos.toFixed(2),
                    gastos: gastos.toFixed(2),
                    url: `${this.frontendUrl()}/dashboard`,
                },
            );
            this.logger.log(`Resumen semanal enviado a usuarioId=${user.id}`);
        }
    }

    @Cron('30 8 * * *')
    async alertarPresupuestosViajes(): Promise<void> {
        for (const user of await this.destinatarios()) {
            const viajes = await this.viajeRepository.find({
                where: { creadorId: user.id, estado: In(['planificado', 'en_curso']) },
                relations: ['itinerario'],
            });

            for (const viaje of viajes) {
                if (viaje.presupuesto == null || Number(viaje.presupuesto) <= 0) continue;
                const gastado = (viaje.itinerario || []).reduce((s, i) => s + Number(i.costo || 0), 0);
                const porcentaje = (gastado / Number(viaje.presupuesto)) * 100;
                if (porcentaje < 80) continue;

                await this.mailService.sendMail(
                    user.correo,
                    `Tu viaje a ${viaje.destino} va en ${Math.round(porcentaje)}% del presupuesto`,
                    `<h1>Hola {{nombre}}</h1><p>El viaje a <strong>{{destino}}</strong> lleva gastado {{gastado}} de {{presupuesto}} ({{porcentaje}}%).</p><p><a href="{{url}}">Ver viaje</a></p>`,
                    {
                        nombre: user.nombre,
                        destino: viaje.destino,
                        gastado: gastado.toFixed(2),
                        presupuesto: Number(viaje.presupuesto).toFixed(2),
                        porcentaje: `${Math.round(porcentaje)}%`,
                        url: `${this.frontendUrl()}/viajes/${viaje.id}`,
                    },
                );
                this.logger.log(`Alerta de presupuesto enviada a usuarioId=${user.id} viajeId=${viaje.id}`);
            }
        }
    }

    private esc(valor: unknown): string {
        return String(valor ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));
    }
}
