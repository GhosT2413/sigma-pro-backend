import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { formatearRutBackend, limpiarRut } from './validators/rut.validator';
import { UsuariosService } from '../usuarios/usuarios.service';

/** Payload que deja passport-jwt en req.user (ver jwt.strategy.ts). */
interface UsuarioJwt {
    userId?: number;
    email?: string;
    role?: string;
}

@Injectable()
export class ClientesService {
    constructor(
        @InjectRepository(Cliente)
        private clientesRepository: Repository<Cliente>,
        private usuariosService: UsuariosService,
    ) { }

    private formatearRutParaGuardar(rut?: string): string | undefined {
        if (!rut) return undefined;
        return formatearRutBackend(rut);
    }

    private limpiarRutParaBuscar(rut?: string): string | undefined {
        if (!rut) return undefined;
        return limpiarRut(rut);
    }

    async crearCliente(dto: CreateClienteDto, usuario?: UsuarioJwt): Promise<{ mensaje: string; cliente: Cliente }> {
        const rutFormateado = this.formatearRutParaGuardar(dto.rut);
        const rutLimpio = this.limpiarRutParaBuscar(dto.rut);

        // Un CLIENTE siempre queda ligado a su propio usuario; el resto (admin, etc.)
        // puede vincular explícitamente con usuario_id en el body.
        const usuarioId = usuario?.role === 'CLIENTE' && usuario?.userId ? usuario.userId : dto.usuario_id;

        if (rutLimpio) {
            const existeRut = await this.clientesRepository.findOne({ where: { rut: rutFormateado } });
            if (existeRut) {
                // El RUT ya es del MISMO cliente: no es un error. Se devuelve el
                // registro existente (idempotente) en vez de duplicar el perfil.
                if (await this.esMismoCliente(existeRut, dto, usuario, rutLimpio)) {
                    if (!existeRut.usuario_id && usuarioId) {
                        existeRut.usuario_id = usuarioId;
                        await this.clientesRepository.save(existeRut);
                    }
                    return { mensaje: 'El cliente ya existe.', cliente: existeRut };
                }
                throw new BadRequestException('El RUT ingresado ya está registrado a otro cliente.');
            }
        }

        const nuevoCliente = this.clientesRepository.create({
            ...dto,
            rut: rutFormateado,
        });
        if (usuarioId) nuevoCliente.usuario_id = usuarioId;
        const clienteGuardado = await this.clientesRepository.save(nuevoCliente);
        return { mensaje: 'El cliente fue creado exitosamente.', cliente: clienteGuardado };
    }

    /**
     * ¿Este registro de la tabla clientes es la misma persona que intenta crear?
     * Se comprueba por usuario_id, por email y, en último lugar, porque el usuario
     * autenticado tiene exactamente el mismo RUT que el registro existente.
     */
    private async esMismoCliente(cliente: Cliente, dto: CreateClienteDto, usuario?: UsuarioJwt, rutLimpio?: string): Promise<boolean> {
        if (usuario?.userId && cliente.usuario_id === usuario.userId) return true;

        const email = (dto.email ?? usuario?.email ?? '').trim().toLowerCase();
        if (email && cliente.email && cliente.email.trim().toLowerCase() === email) return true;

        if (usuario?.userId && rutLimpio) {
            const usuarioPropio = await this.usuariosService.buscarPorId(usuario.userId);
            if (usuarioPropio?.rut && this.limpiarRutParaBuscar(usuarioPropio.rut) === rutLimpio) {
                return true;
            }
        }

        return false;
    }

    /** Scoping: CLIENTE solo ve su propio registro de cliente. */
    async obtenerTodos(usuario?: UsuarioJwt): Promise<Cliente[]> {
        if (usuario?.role === 'CLIENTE' && usuario?.userId) {
            return await this.clientesRepository.find({
                where: { usuario_id: usuario.userId },
                order: { id: 'DESC' },
            });
        }
        return await this.clientesRepository.find({
            order: { id: 'DESC' },
        });
    }

    async obtenerPorId(id: number, usuario?: UsuarioJwt): Promise<Cliente> {
        const cliente = await this.clientesRepository.findOne({ where: { id } });
        if (!cliente) {
            throw new NotFoundException(`Cliente con ID ${id} no encontrado.`);
        }
        if (
            usuario?.role === 'CLIENTE' &&
            Number(cliente.usuario_id) !== Number(usuario.userId)
        ) {
            throw new ForbiddenException('Este cliente no te pertenece.');
        }
        return cliente;
    }

    async actualizar(id: number, dto: UpdateClienteDto): Promise<{ mensaje: string; cliente: Cliente }> {
        const cliente = await this.obtenerPorId(id);

        const rutFormateado = this.formatearRutParaGuardar(dto.rut);
        const rutLimpio = this.limpiarRutParaBuscar(dto.rut);

        if (rutLimpio && rutFormateado !== cliente.rut) {
            const existeRut = await this.clientesRepository.findOne({ where: { rut: rutFormateado } });
            if (existeRut && existeRut.id !== id) {
                throw new BadRequestException('El RUT ingresado ya está registrado a otro cliente.');
            }
        }

        this.clientesRepository.merge(cliente, {
            ...dto,
            rut: rutFormateado ?? cliente.rut,
        });
        const clienteActualizado = await this.clientesRepository.save(cliente);
        return { mensaje: 'El cliente fue actualizado exitosamente.', cliente: clienteActualizado };
    }

    async eliminar(id: number): Promise<{ mensaje: string }> {
        const cliente = await this.obtenerPorId(id);
        await this.clientesRepository.remove(cliente);
        return { mensaje: `Cliente con ID ${id} eliminado correctamente.` };
    }
}
