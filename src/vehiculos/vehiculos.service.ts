import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';
import { CreateVehiculoDto } from './create-vehiculo.dto';
import { UpdateKilometrajeDto } from './dto/update-kilometraje.dto';
import { formatearPatente } from './validators/patente.validator';
import { Cliente } from '../clientes/cliente.entity';

@Injectable()
export class VehiculosService {
    constructor(
        @InjectRepository(Vehiculo)
        private vehiculosRepository: Repository<Vehiculo>,
        @InjectRepository(Cliente)
        private clientesRepository: Repository<Cliente>,
    ) { }

    // Obtener todos los vehículos
    async obtenerTodos(): Promise<Vehiculo[]> {
        return await this.vehiculosRepository.find();
    }

    // Crear un nuevo vehículo
    async crearVehiculo(createVehiculoDto: CreateVehiculoDto): Promise<{ mensaje: string; vehiculo: Vehiculo }> {
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
        const nuevoVehiculo = this.vehiculosRepository.create({
            ...createVehiculoDto,
            patente: patenteFormateada,
            cliente: { id: createVehiculoDto.cliente_id }
        });

        // 4. Guardar en MySQL
        const vehiculoGuardado = await this.vehiculosRepository.save(nuevoVehiculo);
        return { mensaje: 'El vehículo fue creado exitosamente.', vehiculo: vehiculoGuardado };
    }

    async actualizarKilometraje(id: number, updateDto: UpdateKilometrajeDto): Promise<Vehiculo> {
        const vehiculo = await this.vehiculosRepository.findOne({ where: { id } });

        if (!vehiculo) {
            throw new NotFoundException('Vehículo no encontrado.');
        }

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
}
