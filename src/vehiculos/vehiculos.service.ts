import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './vehiculo.entity';
import { CreateVehiculoDto } from './create-vehiculo.dto';
import { UpdateKilometrajeDto } from './dto/update-kilometraje.dto';

@Injectable()
export class VehiculosService {
    constructor(
        @InjectRepository(Vehiculo)
        private vehiculosRepository: Repository<Vehiculo>,
    ) { }

    // Obtener todos los vehículos
    async obtenerTodos(): Promise<Vehiculo[]> {
        return await this.vehiculosRepository.find();
    }

    // Crear un nuevo vehículo
    async crearVehiculo(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
        // 1. Validar que la patente sea única (Regla de negocio RF-03)
        const vehiculoExistente = await this.vehiculosRepository.findOne({
            where: { patente: createVehiculoDto.patente }
        });

        if (vehiculoExistente) {
            throw new BadRequestException('Ya existe un vehículo registrado con esta patente.');
        }

        // 2. Crear el objeto con los datos del DTO
        const nuevoVehiculo = this.vehiculosRepository.create({
            ...createVehiculoDto,  // Copia los datos básicos (patente, marca, modelo, etc.)
            cliente: { id: createVehiculoDto.cliente_id }  // <-- Vinculamos la llave foránea
        });

        // 3. Guardar en MySQL
        return await this.vehiculosRepository.save(nuevoVehiculo);
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
