import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanzasController } from './finanzas.controller';
import { FinanzasService } from './finanzas.service';
import { Transaccion } from './entities/transaccion.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Transaccion])],
    controllers: [FinanzasController],
    providers: [FinanzasService],
    exports: [FinanzasService],
})
export class FinanzasModule {}
