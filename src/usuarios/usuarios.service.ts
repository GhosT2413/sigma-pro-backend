import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    // NUEVA FUNCIÓN: Crear Usuario
    async crearUsuario(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
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
            role: { id: createUsuarioDto.role_id } // Relacionamos el usuario con el ID del rol enviado
        });

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

    // NUEVA FUNCIÓN: Filtrar usuarios por su ID de Rol (RF-16: Mi Equipo)
    async obtenerPorRol(roleId: number): Promise<Usuario[]> {
        return await this.usuariosRepository.find({
            where: { role: { id: roleId } },
            relations: { role: true }, // Traemos la info del rol para que el frontend la pueda mostrar
        });
    }
}