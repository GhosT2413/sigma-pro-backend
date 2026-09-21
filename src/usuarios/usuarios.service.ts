import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Usuario } from './usuarios.entity';
import { CreateUsuarioDto } from './create-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario)
        private usuariosRepository: Repository<Usuario>,
    ) { }

    // Función para obtener todos los usuarios
    async obtenerTodos(): Promise<Usuario[]> {
        // Al poner relations: { role: true }, TypeORM hace el "JOIN" con la entidad Role
        return await this.usuariosRepository.find({ relations: { role: true } });
    }

    async crearUsuario(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
        // 0. Validar Términos y Condiciones (obligatorio para todos los roles)
        if (!createUsuarioDto.hasAcceptedTerms) {
            throw new BadRequestException('Debes aceptar los Términos y Condiciones.');
        }

        // 0b. Validación estricta de documentación según rol
        const roleId = createUsuarioDto.role_id;

        if (roleId === 2) {
            // MECANICO_INDEPENDIENTE: cédula frente + reverso y certificado de antecedentes
            if (
                !createUsuarioDto.cedula_frente_url ||
                !createUsuarioDto.cedula_reverso_url ||
                !createUsuarioDto.certificado_antecedentes_url
            ) {
                throw new BadRequestException(
                    'Mecánico Independiente requiere: Cédula de Identidad (frente y reverso) y Certificado de Antecedentes.',
                );
            }
        } else if (roleId === 3) {
            // TALLER: RUT, patente, comprobante de domicilio y representante legal
            if (
                !createUsuarioDto.rut_empresa ||
                !createUsuarioDto.patente_comercial ||
                !createUsuarioDto.comprobante_domicilio_url ||
                !createUsuarioDto.representante_legal
            ) {
                throw new BadRequestException(
                    'Taller Mecánico requiere: RUT, Patente Comercial, Comprobante de Domicilio y Representante Legal.',
                );
            }
        } else if (roleId !== 1) {
            // Solo se permiten roles 1 (CLIENTE), 2 y 3 para registro público
            throw new BadRequestException('Rol no válido para registro.');
        }

        // 1. Verificar si el email ya existe en la base de datos
        const usuarioExistente = await this.usuariosRepository.findOne({
            where: { email: createUsuarioDto.email }
        });

        if (usuarioExistente) {
            throw new BadRequestException('El correo ingresado ya está registrado.');
        }

        // 2. Encriptar la contraseña (Aplicando RNF-05: factor de costo de 12)
        const saltOrRounds = 12;
        const passwordEncriptada = await bcrypt.hash(createUsuarioDto.password_hash, saltOrRounds);

        // 3. Preparar el objeto usuario para guardar
        const nuevoUsuario = this.usuariosRepository.create({
            nombre_completo: createUsuarioDto.nombre_completo,
            email: createUsuarioDto.email,
            password_hash: passwordEncriptada,
            telefono: createUsuarioDto.telefono,
            hasAcceptedTerms: true,
            role: { id: roleId },
            // Mecánico Independiente
            cedula_frente_url: createUsuarioDto.cedula_frente_url ?? null,
            cedula_reverso_url: createUsuarioDto.cedula_reverso_url ?? null,
            certificado_antecedentes_url: createUsuarioDto.certificado_antecedentes_url ?? null,
            // Taller
            rut_empresa: createUsuarioDto.rut_empresa ?? null,
            patente_comercial: createUsuarioDto.patente_comercial ?? null,
            comprobante_domicilio_url: createUsuarioDto.comprobante_domicilio_url ?? null,
            representante_legal: createUsuarioDto.representante_legal ?? null,
        } as DeepPartial<Usuario>);

        // 4. Guardar en la base de datos MySQL
        return await this.usuariosRepository.save(nuevoUsuario);
    }

    // Buscar usuario por email (incluyendo la relación de su rol)
    async buscarPorEmail(email: string): Promise<Usuario | null> {
        return await this.usuariosRepository.findOne({
            where: { email },
            relations: { role: true },
        });
    }

    // Buscar usuario por ID (incluyendo la relación de su rol)
    async buscarPorId(id: number): Promise<Usuario | null> {
        return await this.usuariosRepository.findOne({
            where: { id },
            relations: { role: true },
        });
    }

    // NUEVA FUNCIÓN: Filtrar usuarios por su ID de Rol (RF-16: Mi Equipo)
    async obtenerPorRol(roleId: number): Promise<Usuario[]> {
        return await this.usuariosRepository.find({
            where: { role: { id: roleId } },
            relations: { role: true }, // Traemos la info del rol para que el frontend la pueda mostrar
        });
    }
}