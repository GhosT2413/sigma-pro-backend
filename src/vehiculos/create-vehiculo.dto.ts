import { EstadoVehiculo, TipoUso } from "./vehiculo.entity";
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Validate } from 'class-validator';
import { IsPatenteChilenaConstraint } from './validators/patente.validator';

// src/vehiculos/dto/create-vehiculo.dto.ts
export class CreateVehiculoDto {
    @IsNotEmpty({ message: 'El cliente es obligatorio' })
    @IsNumber()
    readonly cliente_id: number;

    @IsNotEmpty({ message: 'La patente es obligatoria' })
    @IsString()
    @Validate(IsPatenteChilenaConstraint)
    readonly patente: string;

    @IsNotEmpty({ message: 'La marca es obligatoria' })
    @IsString()
    readonly marca: string;

    @IsNotEmpty({ message: 'El modelo es obligatorio' })
    @IsString()
    readonly modelo: string;

    @IsOptional()
    @IsNumber()
    @Min(1950, { message: 'El año debe ser mayor a 1950' })
    readonly anio?: number;

    @IsOptional()
    @IsString()
    readonly vin?: string;

    @IsNotEmpty({ message: 'El kilometraje es obligatorio' })
    @IsNumber()
    @Min(0, { message: 'El kilometraje no puede ser negativo' })
    readonly kilometraje_actual: number;

    @IsOptional()
    readonly tipo_uso?: TipoUso;

    @IsOptional()
    readonly estado?: EstadoVehiculo;
}