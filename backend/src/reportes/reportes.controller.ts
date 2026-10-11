import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Usuario } from '../usuarios/entitys/usuarios.entity';
import { User } from '../common/decorators/user.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
    constructor(private readonly reportesService: ReportesService) {}

    @Get('proyecto/:id/pdf')
    async reportePdf(
        @User() usuario: Usuario,
        @Param('id', ParseIntPipe) id: number,
        @Query('moneda') moneda: string | undefined,
        @Res() res: Response,
    ) {
        const buffer = await this.reportesService.generarReporteProyecto(id, usuario.id, moneda);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="reporte-proyecto-${id}.pdf"`);
        res.send(buffer);
    }
}
