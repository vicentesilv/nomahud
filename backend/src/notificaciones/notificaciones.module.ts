import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { Tarea } from '../tareas/entities/tarea.entity';
import { Viaje } from '../viajes/entities/viaje.entity';
import { RegistroTiempo } from '../tiempo/entities/registro-tiempo.entity';
import { Transaccion } from '../finanzas/entities/transaccion.entity';
import { NotificacionesService } from './notificaciones.service';

@Module({
    imports: [
        MailModule,
        TypeOrmModule.forFeature([Perfil, Tarea, Viaje, RegistroTiempo, Transaccion]),
    ],
    providers: [NotificacionesService],
    exports: [NotificacionesService],
})
export class NotificacionesModule {}
