import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
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

        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            tallerId: payload.taller_id ?? null,
        };
    }
}
