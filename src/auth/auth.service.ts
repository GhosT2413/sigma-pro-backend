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

        // 3. Generar el payload del JWT (taller_id para scoping por tenant)
        const payload = this.firmarPayload(usuario);

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
        // Registro PÚBLICO: solo roles autorizados (1 CLIENTE, 2 MECANICO_INDEPENDIENTE,
        // 3 TALLER). Impide escalamiento a ADMINISTRADOR o a roles de taller (5/6),
        // que solo pueden crearlos un ADMIN o el TALLER dueño vía POST /usuarios.
        const rolesDeRegistro = [1, 2, 3];
        if (!rolesDeRegistro.includes(Number(createUsuarioDto?.role_id))) {
            throw new BadRequestException('Rol no válido para registro. Usa CLIENTE, MECANICO_INDEPENDIENTE o TALLER.');
        }

        // Crear usuario a traves de usuariosService
        const usuarioCreado = await this.usuariosService.crearUsuario(createUsuarioDto);
        // Obtener usuario con su rol completo. Lectura en MASTER: recien escrito
        // en el primario; la replica todavia no lo tiene (lag ~100ms).
        const usuario = await this.usuariosService.buscarPorEmail(usuarioCreado.email, { master: true });
        
        if (!usuario) {
            throw new UnauthorizedException('Error al crear el usuario');
        }

        const payload = this.firmarPayload(usuario);

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

    /** Payload del JWT: identidad + tenant (taller) para el scoping por dueño. */
    private firmarPayload(usuario: { id: number; email: string; role?: { nombre?: string } | null; taller_id?: number | null }) {
        return {
            sub: usuario.id,
            email: usuario.email,
            role: usuario.role?.nombre ?? null,
            taller_id: usuario.taller_id ?? null,
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


