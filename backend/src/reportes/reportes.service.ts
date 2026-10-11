import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument = require('pdfkit');
import { Proyecto } from '../proyectos/entities/proyecto.entity';
import { Transaccion } from '../finanzas/entities/transaccion.entity';
import { RegistroTiempo } from '../tiempo/entities/registro-tiempo.entity';
import { Tarea } from '../tareas/entities/tarea.entity';
import { DivisasService } from '../divisas/divisas.service';

@Injectable()
export class ReportesService {
    constructor(
        @InjectRepository(Proyecto)
        private readonly proyectoRepository: Repository<Proyecto>,
        @InjectRepository(Transaccion)
        private readonly transaccionRepository: Repository<Transaccion>,
        @InjectRepository(RegistroTiempo)
        private readonly tiempoRepository: Repository<RegistroTiempo>,
        @InjectRepository(Tarea)
        private readonly tareaRepository: Repository<Tarea>,
        private readonly divisasService: DivisasService,
        private readonly configService: ConfigService,
    ) {}

    async generarReporteProyecto(proyectoId: number, creadorId: number, moneda?: string): Promise<Buffer> {
        const proyecto = await this.proyectoRepository.findOne({
            where: { id: proyectoId, creadorId },
            relations: ['tareas', 'clienteRel', 'creador'],
        });
        if (!proyecto) throw new Error('Proyecto no encontrado');

        const destino = (moneda || proyecto.moneda || 'USD').toUpperCase();
        this.divisasService.validarMoneda(destino);

        const [transacciones, tiempos] = await Promise.all([
            this.transaccionRepository.find({ where: { creadorId, proyectoId }, order: { fecha: 'ASC' } }),
            this.tiempoRepository.find({ where: { creadorId, proyectoId }, order: { fecha: 'ASC' } }),
        ]);

        const tareas = proyecto.tareas || [];
        const completadas = tareas.filter((t) => t.estado === 'completada').length;
        const progreso = tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0;

        const ingresos = transacciones
            .filter((t) => t.tipo === 'ingreso')
            .reduce((s, t) => s + Number(t.monto), 0);
        const gastos = transacciones
            .filter((t) => t.tipo === 'gasto')
            .reduce((s, t) => s + Number(t.monto), 0);
        const horasTotal = tiempos.reduce((s, r) => s + Number(r.horas), 0);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));

        doc.fontSize(20).fillColor('#1a1a2e').text('Reporte de Proyecto', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#888').text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' });
        doc.moveDown(1);

        doc.fontSize(16).fillColor('#06b6d4').text(proyecto.nombre);
        doc.moveDown(0.5);

        const info = [
            ['Estado', proyecto.estado],
            ['Prioridad', proyecto.prioridad],
            ['Cliente', proyecto.clienteRel?.nombre || proyecto.cliente || '—'],
            ['Responsable', proyecto.creador?.nombre || '—'],
            ['Moneda', destino],
            ['Ingresos', destino + ' ' + ingresos.toFixed(2)],
            ['Gastos', destino + ' ' + gastos.toFixed(2)],
            ['Balance', destino + ' ' + (ingresos - gastos).toFixed(2)],
            ['Horas registradas', horasTotal.toFixed(1)],
            ['Progreso', `${progreso}% (${completadas}/${tareas.length} tareas)`],
        ];
        for (const [label, value] of info) {
            doc.fontSize(10).fillColor('#888').text(`${label}: `, { continued: true }).fillColor('#1a1a2e').text(String(value));
        }
        doc.moveDown(1);

        if (tareas.length > 0) {
            doc.fontSize(14).fillColor('#1a1a2e').text('Tareas');
            doc.moveDown(0.3);
            for (const t of tareas) {
                doc.fontSize(9).fillColor('#888').text(`[${t.estado}] `, { continued: true }).fillColor('#1a1a2e').text(t.titulo);
            }
            doc.moveDown(1);
        }

        if (transacciones.length > 0) {
            doc.fontSize(14).fillColor('#1a1a2e').text('Transacciones');
            doc.moveDown(0.3);
            for (const t of transacciones.slice(0, 50)) {
                doc.fontSize(8).fillColor('#888').text(`${t.fecha} `, { continued: true })
                    .fillColor(t.tipo === 'ingreso' ? '#22c55e' : '#ef4444').text(`${t.tipo === 'ingreso' ? '+' : '-'}${Number(t.monto).toFixed(2)} `, { continued: true })
                    .fillColor('#1a1a2e').text(`${t.tipo} - ${t.categoria}`);
            }
            doc.moveDown(1);
        }

        doc.fontSize(8).fillColor('#aaa').text('Generado por Nomahud', { align: 'center' });
        doc.end();

        return new Promise((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });
    }
}
