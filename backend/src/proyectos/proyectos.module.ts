import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProyectosController } from './proyectos.controller';
import { InvitacionesController } from './invitaciones.controller';
import { ProyectoPublicoController } from './proyecto-publico.controller';
import { ProyectosService } from './proyectos.service';
import { Proyecto } from './entities/proyecto.entity';
import { ProyectoMiembro } from './entities/proyecto-miembro.entity';
import { ProyectoInvitacion } from './entities/proyecto-invitacion.entity';
import { ProyectoComparticion } from './entities/proyecto-comparticion.entity';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { FinanzasModule } from '../finanzas/finanzas.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Proyecto, ProyectoMiembro, ProyectoInvitacion, ProyectoComparticion, Usuario]),
        forwardRef(() => FinanzasModule),
        MailModule,
    ],
    controllers: [ProyectosController, InvitacionesController, ProyectoPublicoController],
    providers: [ProyectosService],
    exports: [ProyectosService],
})
export class ProyectosModule {}
