import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViajesController } from './viajes.controller';
import { ViajesService } from './viajes.service';
import { Viaje } from './entities/viaje.entity';
import { ItinerarioItem } from './entities/itinerario-item.entity';
import { FinanzasModule } from '../finanzas/finanzas.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Viaje, ItinerarioItem]),
        forwardRef(() => FinanzasModule),
    ],
    controllers: [ViajesController],
    providers: [ViajesService],
    exports: [ViajesService],
})
export class ViajesModule {}
