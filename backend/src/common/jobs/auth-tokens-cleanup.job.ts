import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AuthToken } from '../../auth/entitys/auth-token.entity';

@Injectable()
export class AuthTokensCleanupJob {
    private readonly logger = new Logger(AuthTokensCleanupJob.name);

    constructor(
        @InjectRepository(AuthToken)
        private readonly authTokenRepository: Repository<AuthToken>,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCleanupExpiredTokens(): Promise<void> {
        const resultado = await this.authTokenRepository.delete({
            expiraEn: LessThan(new Date()),
        });

        const eliminados = resultado.affected ?? 0;
        this.logger.log(`Limpieza diaria de tokens expirados completada. Eliminados=${eliminados}`);
    }
}