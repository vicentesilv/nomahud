import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProyectosController } from './proyectos.controller';
import { ProyectosService } from './proyectos.service';
import { Proyecto } from './entities/proyecto.entity';
import { FinanzasModule } from '../finanzas/finanzas.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Proyecto]),
        forwardRef(() => FinanzasModule),
    ],
    controllers: [ProyectosController],
    providers: [ProyectosService],
    exports: [ProyectosService],
})
export class ProyectosModule {}
