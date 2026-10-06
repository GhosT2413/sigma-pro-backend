import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsDateString, Min, Validate } from 'class-validator';
import { EstadoVehiculo, TipoUso } from '../vehiculo.entity';
import { IsPatenteChilenaConstraint } from '../validators/patente.validator';

export class UpdateVehiculoDto {
    @IsOptional()
    @IsInt()
    readonly cliente_id?: number;

    @IsOptional()
    @IsString()
    @Validate(IsPatenteChilenaConstraint)
    readonly patente?: string;

    @IsOptional()
    @IsString()
    readonly marca?: string;

    @IsOptional()
    @IsString()
    readonly modelo?: string;

    @IsOptional()
    @IsNumber()
    @Min(1950, { message: 'El año debe ser mayor a 1950' })
    readonly anio?: number;

    @IsOptional()
    @IsString()
    readonly vin?: string;

    @IsOptional()
    @IsEnum(TipoUso)
    readonly tipo_uso?: TipoUso;

    @IsOptional()
    @IsEnum(EstadoVehiculo)
    readonly estado?: EstadoVehiculo;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de revisión técnica no es válida' })
    readonly vencimiento_revision_tecnica?: string | null;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de vencimiento del SOAP no es válida' })
    readonly vencimiento_soap?: string | null;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de vencimiento del permiso de circulación no es válida' })
    readonly vencimiento_permiso_circulacion?: string | null;
}
