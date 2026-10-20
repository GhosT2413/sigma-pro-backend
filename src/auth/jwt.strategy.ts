import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly usuariosService: UsuariosService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET', 'MI_PALABRA_SECRETA_SUPER_SEGURA'),
        });
    }

    async validate(payload: any) {
        // El JWT de restablecimiento usa el mismo secreto que el de sesión:
        // si alguien lo usa como Bearer no debe abrir ninguna ruta protegida.
        if (payload?.type === 'password-reset') {
            throw new UnauthorizedException('Token de restablecimiento no válido para sesión');
        }

        // Obtener el rol y estado más reciente directamente de la base de datos
        // para que cambios de rol o desactivaciones en el backoffice apliquen en tiempo real.
        const usuarioActual = await this.usuariosService.buscarPorId(payload.sub);
        if (!usuarioActual || !usuarioActual.activo) {
            throw new UnauthorizedException('Usuario inactivo o no encontrado');
        }

        return {
            userId: usuarioActual.id,
            email: usuarioActual.email,
            role: usuarioActual.role?.nombre ?? payload.role,
            tallerId: usuarioActual.taller_id ?? null,
        };
    }
}

