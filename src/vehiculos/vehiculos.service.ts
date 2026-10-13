import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';
import { CreateVehiculoDto } from './create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { UpdateKilometrajeDto } from './dto/update-kilometraje.dto';
import { formatearPatente } from './validators/patente.validator';
import { Cliente } from '../clientes/cliente.entity';
import { UsuarioJwt } from '../common/decorators/current-user.decorator';

@Injectable()
export class VehiculosService {
    constructor(
        @InjectRepository(Vehiculo)
        private vehiculosRepository: Repository<Vehiculo>,
        @InjectRepository(Cliente)
        private clientesRepository: Repository<Cliente>,
    ) { }

    // Obtener todos los vehículos (con cliente anidado, como espera el frontend).
    // Scoping: CLIENTE solo ve los suyos; el resto del personal ve todos.
    async obtenerTodos(user?: UsuarioJwt): Promise<Vehiculo[]> {
        if (user?.role === 'CLIENTE') {
            return await this.vehiculosRepository
                .createQueryBuilder('v')
                .leftJoinAndSelect('v.cliente', 'cliente')
                .where('cliente.usuario_id = :userId', { userId: user.userId })
                .getMany();
        }
        return await this.vehiculosRepository.find({ relations: { cliente: true } });
    }

    async obtenerPorId(id: number, user?: UsuarioJwt): Promise<Vehiculo> {
        const vehiculo = await this.vehiculosRepository.findOne({
            where: { id },
            relations: { cliente: true },
        });
        if (!vehiculo) {
            throw new NotFoundException('Vehículo no encontrado.');
        }
        this.verificarPropiedad(vehiculo, user);
        return vehiculo;
    }

    /** CLIENTE solo puede tocar vehículos de su propio perfil de cliente. */
    private verificarPropiedad(vehiculo: Vehiculo, user?: UsuarioJwt): void {
        if (user?.role === 'CLIENTE' && Number(vehiculo.cliente?.usuario_id) !== Number(user.userId)) {
            throw new ForbiddenException('Este vehículo no te pertenece.');
        }
    }

    // Crear un nuevo vehículo
    async crearVehiculo(
        createVehiculoDto: CreateVehiculoDto,
        user?: UsuarioJwt,
    ): Promise<{ mensaje: string; vehiculo: Vehiculo }> {
        // Scoping: un CLIENTE siempre registra vehículos sobre su propio cliente.
        if (user?.role === 'CLIENTE') {
            const clientePropio = await this.clientesRepository.findOne({
                where: { usuario_id: user.userId },
            });
            if (!clientePropio) {
                throw new BadRequestException('Primero debes crear tu perfil de cliente para registrar vehículos.');
            }
            createVehiculoDto = { ...createVehiculoDto, cliente_id: clientePropio.id };
        }

        // Formatear patente a mayúsculas automáticamente
        const patenteFormateada = formatearPatente(createVehiculoDto.patente);

        // 1. Validar que el cliente existe
        const clienteExiste = await this.clientesRepository.findOne({
            where: { id: createVehiculoDto.cliente_id }
        });

        if (!clienteExiste) {
            throw new BadRequestException('El cliente especificado no existe.');
        }

        // 2. Validar que la patente sea única (Regla de negocio RF-03)
        const vehiculoExistente = await this.vehiculosRepository.findOne({
            where: { patente: patenteFormateada }
        });

        if (vehiculoExistente) {
            throw new BadRequestException(`Ya existe un vehículo registrado con la patente: ${patenteFormateada}.`);
        }

        if (createVehiculoDto.kilometraje_actual !== undefined && createVehiculoDto.kilometraje_actual < 0) {
            throw new BadRequestException('El kilometraje no puede ser un valor negativo.');
        }

        // 3. Crear el objeto con los datos del DTO
        const { vencimiento_revision_tecnica, vencimiento_soap, vencimiento_permiso_circulacion, ...restoDto } = createVehiculoDto;
        const nuevoVehiculo = this.vehiculosRepository.create({
            ...restoDto,
            patente: patenteFormateada,
            cliente: { id: createVehiculoDto.cliente_id },
            vencimiento_revision_tecnica: this.aFecha(vencimiento_revision_tecnica),
            vencimiento_soap: this.aFecha(vencimiento_soap),
            vencimiento_permiso_circulacion: this.aFecha(vencimiento_permiso_circulacion),
        });

        // 4. Guardar en MySQL
        const vehiculoGuardado = await this.vehiculosRepository.save(nuevoVehiculo);
        return { mensaje: 'El vehículo fue creado exitosamente.', vehiculo: vehiculoGuardado };
    }

    async actualizar(id: number, dto: UpdateVehiculoDto, user?: UsuarioJwt): Promise<{ mensaje: string; vehiculo: Vehiculo }> {
        const vehiculo = await this.obtenerPorId(id, user);

        if (dto.cliente_id !== undefined) {
            const clienteExiste = await this.clientesRepository.findOne({ where: { id: dto.cliente_id } });
            if (!clienteExiste) {
                throw new BadRequestException('El cliente especificado no existe.');
            }
        }

        let patenteFormateada: string | undefined;
        if (dto.patente !== undefined) {
            patenteFormateada = formatearPatente(dto.patente);
            const existente = await this.vehiculosRepository.findOne({ where: { patente: patenteFormateada } });
            if (existente && existente.id !== id) {
                throw new BadRequestException(`Ya existe un vehículo registrado con la patente: ${patenteFormateada}.`);
            }
        }

        const { vencimiento_revision_tecnica, vencimiento_soap, vencimiento_permiso_circulacion, ...restoUpdate } = dto;
        this.vehiculosRepository.merge(vehiculo, {
            ...restoUpdate,
            ...(patenteFormateada ? { patente: patenteFormateada } : {}),
            ...(dto.cliente_id !== undefined ? { cliente: { id: dto.cliente_id } } : {}),
            ...(dto.vencimiento_revision_tecnica !== undefined
                ? { vencimiento_revision_tecnica: this.aFecha(vencimiento_revision_tecnica) }
                : {}),
            ...(dto.vencimiento_soap !== undefined ? { vencimiento_soap: this.aFecha(vencimiento_soap) } : {}),
            ...(dto.vencimiento_permiso_circulacion !== undefined
                ? { vencimiento_permiso_circulacion: this.aFecha(vencimiento_permiso_circulacion) }
                : {}),
        });
        const vehiculoActualizado = await this.vehiculosRepository.save(vehiculo);
        return { mensaje: 'El vehículo fue actualizado exitosamente.', vehiculo: vehiculoActualizado };
    }

    async eliminar(id: number, user?: UsuarioJwt): Promise<{ mensaje: string }> {
        const vehiculo = await this.obtenerPorId(id, user);
        await this.vehiculosRepository.remove(vehiculo);
        return { mensaje: `Vehículo con ID ${id} eliminado correctamente.` };
    }

    async actualizarKilometraje(id: number, updateDto: UpdateKilometrajeDto, user?: UsuarioJwt): Promise<Vehiculo> {
        const vehiculo = await this.vehiculosRepository.findOne({
            where: { id },
            relations: { cliente: true },
        });

        if (!vehiculo) {
            throw new NotFoundException('Vehículo no encontrado.');
        }
        this.verificarPropiedad(vehiculo, user);

        // Regla de Negocio RF-06: El nuevo kilometraje no puede ser inferior al actual
        if (updateDto.nuevo_kilometraje < vehiculo.kilometraje_actual) {
            throw new BadRequestException(
                `El kilometraje ingresado (${updateDto.nuevo_kilometraje}) no puede ser menor al actual (${vehiculo.kilometraje_actual}).`
            );
        }

        vehiculo.kilometraje_actual = updateDto.nuevo_kilometraje;

        // Al hacer save(), TypeORM actualizará automáticamente la fecha 'updated_at'
        return await this.vehiculosRepository.save(vehiculo);
    }

    private aFecha(valor?: string | null): Date | null {
        if (!valor) return null;
        const fecha = /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T00:00:00`) : new Date(valor);
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }
}
