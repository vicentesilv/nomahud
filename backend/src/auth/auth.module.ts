import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthToken } from './entitys/auth-token.entity';
import { RefreshToken } from './entitys/refresh-token.entity';
import { ProyectoInvitacion } from '../proyectos/entities/proyecto-invitacion.entity';
import { ProyectoMiembro } from '../proyectos/entities/proyecto-miembro.entity';
import { MailModule } from '../mail/mail.module';
import { PerfilesModule } from '../perfiles/perfiles.module';
import { AuthTokensCleanupJob } from '../common/jobs/auth-tokens-cleanup.job';
import { RefreshTokensCleanupJob } from '../common/jobs/refresh-tokens-cleanup.job';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '24h') as never,
        },
      }),
      inject: [ConfigService],
    }),
    UsuariosModule,
    MailModule,
    PerfilesModule,
    TypeOrmModule.forFeature([AuthToken, RefreshToken, ProyectoInvitacion, ProyectoMiembro]),
  ],
  providers: [AuthService, JwtAuthGuard, JwtStrategy, AuthTokensCleanupJob, RefreshTokensCleanupJob],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
