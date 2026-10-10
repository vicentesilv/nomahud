import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DivisasService, MONEDAS_SOPORTADAS } from './divisas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('divisas')
@UseGuards(JwtAuthGuard)
export class DivisasController {
    constructor(private readonly divisasService: DivisasService) {}

    @Get('tasas')
    async tasas(@Query('base') base?: string) {
        return this.divisasService.getTasas(base || 'USD');
    }

    @Get('monedas')
    monedas() {
        return { monedas: [...MONEDAS_SOPORTADAS] };
    }
}
