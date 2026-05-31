import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';
import { Tarea } from './entities/tarea.entity';
import { TiempoModule } from '../tiempo/tiempo.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Tarea]),
        forwardRef(() => TiempoModule),
    ],
    controllers: [TareasController],
    providers: [TareasService],
    exports: [TareasService],
})
export class TareasModule {}
