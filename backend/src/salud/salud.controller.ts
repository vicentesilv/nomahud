import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('salud')
export class SaludController {
    constructor(private readonly dataSource: DataSource) {}

    @Get()
    async estado() {
        let db = false;
        try {
            await this.dataSource.query('SELECT 1');
            db = true;
        } catch {
            db = false;
        }
        return {
            estado: db ? 'ok' : 'degradado',
            db,
            timestamp: new Date().toISOString(),
        };
    }
}
