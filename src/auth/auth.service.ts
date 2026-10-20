import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { EmailService } from '../messaging/email.service';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private googleClient: OAuth2Client;

    constructor(
        private usuariosService: UsuariosService,
        private jwtService: JwtService,
        private emailService: EmailService,
        private configService: ConfigService,
    ) {
        const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        this.googleClient = new OAuth2Client(googleClientId);
    }

    async loginWithGoogle(idToken: string, roleId?: number) {
        try {
            const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: googleClientId,
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new UnauthorizedException('Token de Google inválido');
            }

            const googleId = payload.sub;
            const email = payload.email.toLowerCase();
            const nombre = payload.name || payload.given_name || 'Usuario Google';
            const foto = payload.picture;

            // 1. Buscar si ya existe por Google ID
            let usuario = await this.usuariosService.buscarPorGoogleId(googleId);

            // 2. Si no, buscar por email
            if (!usuario) {
                usuario = await this.usuariosService.buscarPorEmail(email, { master: true });
                if (usuario) {
                    // Vincular google_id al usuario existente
                    await this.usuariosService.actualizar(usuario.id, { google_id: googleId } as any);
                    usuario.google_id = googleId;
                }
            }

            // 3. Si no existe, crearlo con el rol especificado (o CLIENTE por defecto)
            if (!usuario) {
                const rolValido = roleId && [1, 2, 3].includes(Number(roleId)) ? Number(roleId) : 1;
                usuario = await this.usuariosService.crearUsuarioOAuth({
                    email,
                    nombre_completo: nombre,
                    google_id: googleId,
                    foto_perfil_url: foto,
                    role_id: rolValido,
                });
                usuario = await this.usuariosService.buscarPorId(usuario.id);
            }

            if (!usuario || !usuario.activo) {
                throw new UnauthorizedException('Cuenta inactiva o deshabilitada');
            }

            const jwtPayload = this.firmarPayload(usuario);

            return {
                access_token: this.jwtService.sign(jwtPayload),
                usuario: {
                    id: usuario.id,
                    nombre_completo: usuario.nombre_completo,
                    email: usuario.email,
                    telefono: usuario.telefono,
                    fecha_nacimiento: usuario.fecha_nacimiento,
                    foto_perfil_url: usuario.foto_perfil_url,
                    rut: usuario.rut,
                    role: usuario.role,
                },
            };
        } catch (error: any) {
            this.logger.error(`Error en autenticación Google: ${error?.message || error}`);
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('No se pudo verificar la cuenta de Google');
        }

    }

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

    /**
     * Huella corta del hash bcrypt actual del usuario. bcrypt genera salt propio,
     * así que la huella cambia en cada cambio de contraseña. Se firma dentro del
     * JWT de restablecimiento para que el token quede de un solo uso: al cambiar
     * la contraseña, la huella deja de coincidir y el token viejo deja de servir.
     */
    private huellaPassword(passwordHash: string): string {
        return createHash('sha256').update(passwordHash).digest('hex').slice(0, 32);
    }

    async forgotPassword(email: string) {
        // Lectura en primario: si el usuario recién se registró, la réplica puede
        // no tenerlo todavía y no encontraríamos su correo.
        const usuario = await this.usuariosService.buscarPorEmail(email, { master: true });
        if (!usuario) {
            return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
        }

        const resetToken = this.jwtService.sign(
            {
                sub: usuario.id,
                email: usuario.email,
                type: 'password-reset',
                pwdv: this.huellaPassword(usuario.password_hash),
            },
            { expiresIn: '1h' }
        );

        const resultado = await this.emailService.sendPasswordResetEmail(email, resetToken);
        if (!resultado?.success) {
            // No rompemos la respuesta (anti-enumeración), pero dejamos el rastro
            // para diagnosticar: sin SMTP configurado el correo nunca llega.
            this.logger.error(
                `No se pudo enviar el correo de recuperación a ${email}. Revisa la configuración SMTP_HOST/SMTP_USER/SMTP_PASS.`
            );
        }

        return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' };
    }

    async resetPassword(token: string, newPassword: string, confirmPassword: string) {
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }

        let payload: { sub: number; email: string; type: string; pwdv?: string };
        try {
            payload = this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Token inválido o expirado');
        }

        if (payload.type !== 'password-reset') {
            throw new UnauthorizedException('Token inválido');
        }

        const usuario = await this.usuariosService.buscarPorEmail(payload.email, { master: true });
        if (!usuario || usuario.id !== payload.sub) {
            throw new UnauthorizedException('Token inválido');
        }

        // Token de un solo uso: la huella firmada debe coincidir con el hash actual.
        if (!payload.pwdv || payload.pwdv !== this.huellaPassword(usuario.password_hash)) {
            throw new UnauthorizedException('El enlace ya fue utilizado o fue reemplazado. Solicita uno nuevo.');
        }

        // UsuariosService.actualizar se encarga de encriptar con bcrypt (cost 12),
        // así que aquí va la contraseña en plano: hashearla antes produciría un
        // doble hash y el login fallaría siempre.
        await this.usuariosService.actualizar(usuario.id, { password_hash: newPassword });

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

        // Contraseña en plano: UsuariosService.actualizar la encripta (ver arriba).
        await this.usuariosService.actualizar(userId, { password_hash: newPassword });

        return { message: 'Contraseña cambiada correctamente' };
    }
}


