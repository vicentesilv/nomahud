import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Proyecto } from '../proyectos/entities/proyecto.entity';
import { Transaccion } from '../finanzas/entities/transaccion.entity';
import { RegistroTiempo } from '../tiempo/entities/registro-tiempo.entity';
import { Tarea } from '../tareas/entities/tarea.entity';
import { DivisasModule } from '../divisas/divisas.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Proyecto, Transaccion, RegistroTiempo, Tarea]),
        DivisasModule,
    ],
    controllers: [ReportesController],
    providers: [ReportesService],
})
export class ReportesModule {}
