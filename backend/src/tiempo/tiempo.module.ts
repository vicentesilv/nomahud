import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TiempoController } from './tiempo.controller';
import { TiempoService } from './tiempo.service';
import { RegistroTiempo } from './entities/registro-tiempo.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RegistroTiempo])],
    controllers: [TiempoController],
    providers: [TiempoService],
    exports: [TiempoService],
})
export class TiempoModule {}
