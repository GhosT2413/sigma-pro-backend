import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            // Le decimos que busque el token en la cabecera "Authorization: Bearer <token>"
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'MI_PALABRA_SECRETA_SUPER_SEGURA', // Debe ser exactamente la misma que pusimos en AuthModule
        });
    }

    // Si el token es válido, esta función se ejecuta automáticamente
    async validate(payload: any) {
        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}