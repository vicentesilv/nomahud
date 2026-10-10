import { Module } from '@nestjs/common';
import { DivisasService } from './divisas.service';
import { DivisasController } from './divisas.controller';

@Module({
    providers: [DivisasService],
    controllers: [DivisasController],
    exports: [DivisasService],
})
export class DivisasModule {}
