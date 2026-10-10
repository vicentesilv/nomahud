import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const userId = payload?.userId;
    if (!userId) {
      throw new UnauthorizedException('Token inválido');
    }
    const usuario = await this.usuariosService.findById(userId);

    if (!usuario) {
      throw new UnauthorizedException('Token inválido o usuario no encontrado');
    }

    if (!usuario.emailVerificado || usuario.estadoCuenta !== 'activa') {
      throw new UnauthorizedException('Cuenta no activa o email sin verificar');
    }

    return usuario;
  }
}