import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../messaging/email.service';

@Injectable()
export class AuthService {
    constructor(
        private usuariosService: UsuariosService,
        private jwtService: JwtService,
        private emailService: EmailService
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
            usuario: {
                id: usuario.id,
                nombre_completo: usuario.nombre_completo,
                email: usuario.email,
                telefono: usuario.telefono,
                fecha_nacimiento: usuario.fecha_nacimiento,
                foto_perfil_url: usuario.foto_perfil_url,
                rut: usuario.rut,
                role: usuario.role,
            }
        };
    }

    async register(createUsuarioDto: any) {
        // Crear usuario a través de usuariosService
        const usuarioCreado = await this.usuariosService.crearUsuario(createUsuarioDto);
        // Obtener usuario con su relación de rol completa
        const usuario = await this.usuariosService.buscarPorEmail(usuarioCreado.email);
        
        if (!usuario) {
            throw new UnauthorizedException('Error al crear el usuario');
        }

        const payload = { sub: usuario.id, email: usuario.email, role: usuario.role?.nombre };

        return {
            access_token: this.jwtService.sign(payload),
            usuario: {
                id: usuario.id,
                nombre_completo: usuario.nombre_completo,
                email: usuario.email,
                telefono: usuario.telefono,
                fecha_nacimiento: usuario.fecha_nacimiento,
                foto_perfil_url: usuario.foto_perfil_url,
                rut: usuario.rut,
                role: usuario.role,
            }
        };
    }

    async getProfile(userId: number) {
        const usuario = await this.usuariosService.buscarPorId(userId);
        if (!usuario) {
            throw new UnauthorizedException('Usuario no encontrado');
        }
        return {
            id: usuario.id,
            nombre_completo: usuario.nombre_completo,
            email: usuario.email,
            telefono: usuario.telefono,
            fecha_nacimiento: usuario.fecha_nacimiento,
            foto_perfil_url: usuario.foto_perfil_url,
            rut: usuario.rut,
            role: usuario.role,
        };
    }

    async forgotPassword(email: string) {
        const usuario = await this.usuariosService.buscarPorEmail(email);
        if (!usuario) {
            return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
        }

        const resetToken = this.jwtService.sign(
            { sub: usuario.id, email: usuario.email, type: 'password-reset' },
            { expiresIn: '1h' }
        );

        await this.emailService.sendPasswordResetEmail(email, resetToken);

        return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
    }

    async resetPassword(token: string, newPassword: string, confirmPassword: string) {
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }

        let payload: { sub: number; email: string; type: string };
        try {
            payload = this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Token inválido o expirado');
        }

        if (payload.type !== 'password-reset') {
            throw new UnauthorizedException('Token inválido');
        }

        const usuario = await this.usuariosService.buscarPorId(payload.sub);
        if (!usuario || usuario.email !== payload.email) {
            throw new UnauthorizedException('Token inválido');
        }

        const saltOrRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltOrRounds);

        await this.usuariosService.actualizar(payload.sub, { password_hash: passwordHash });

        return { message: 'Contraseña actualizada correctamente' };
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string, confirmPassword: string) {
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }

        const usuario = await this.usuariosService.buscarPorId(userId);
        if (!usuario) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        const passwordValida = await bcrypt.compare(currentPassword, usuario.password_hash);
        if (!passwordValida) {
            throw new UnauthorizedException('Contraseña actual incorrecta');
        }

        const saltOrRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltOrRounds);

        await this.usuariosService.actualizar(userId, { password_hash: passwordHash });

        return { message: 'Contraseña cambiada correctamente' };
    }
}


