import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usuariosService: UsuariosService,
        private jwtService: JwtService
    ) { }

    async login(email: string, password_plana: string) {
        // 1. Buscar al usuario usando el método
        const usuario = await this.usuariosService.buscarPorEmail(email);

        if (!usuario) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        // 2. Comparar la contraseña plana con el hash de la BD
        const passwordValida = await bcrypt.compare(password_plana, usuario.password_hash);

        if (!passwordValida) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        // 3. Generar el payload del JWT
        const payload = { sub: usuario.id, email: usuario.email, role: usuario.role?.nombre };

        return {
            access_token: this.jwtService.sign(payload),
        };
    } // <-- EL MÉTODO LOGIN DEBE CERRAR AQUÍ
}


