import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Proyecto } from '../proyectos/entities/proyecto.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { Transaccion } from '../finanzas/entities/transaccion.entity';
import { RegistroTiempo } from '../tiempo/entities/registro-tiempo.entity';
import { Viaje } from '../viajes/entities/viaje.entity';
import { Tarea } from '../tareas/entities/tarea.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Proyecto, Cliente, Transaccion, RegistroTiempo, Viaje, Tarea]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule {}
