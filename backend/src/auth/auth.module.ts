import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthToken } from './entitys/auth-token.entity';
import { MailModule } from '../mail/mail.module';
import { PerfilesModule } from '../perfiles/perfiles.module';
import { AuthTokensCleanupJob } from '../common/jobs/auth-tokens-cleanup.job';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any,
      },
    }),
    UsuariosModule,
    MailModule,
    PerfilesModule,
    TypeOrmModule.forFeature([AuthToken]),
  ],
  providers: [AuthService, JwtAuthGuard, JwtStrategy, AuthTokensCleanupJob],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
