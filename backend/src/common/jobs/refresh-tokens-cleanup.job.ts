import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshToken } from '../../auth/entitys/refresh-token.entity';

@Injectable()
export class RefreshTokensCleanupJob {
    private readonly logger = new Logger(RefreshTokensCleanupJob.name);

    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async handleCleanupExpiredRefreshTokens(): Promise<void> {
        const resultado = await this.refreshTokenRepository.delete({
            expiraEn: LessThan(new Date()),
        });

        const eliminados = resultado.affected ?? 0;
        this.logger.log(`Limpieza diaria de refresh tokens expirados completada. Eliminados=${eliminados}`);
    }
}
