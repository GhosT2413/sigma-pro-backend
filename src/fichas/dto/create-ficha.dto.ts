import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { EstadoFicha } from '../ficha-mantencion.entity';

export class CreateFichaDto {
  @IsInt()
  readonly vehiculo_id: number;

  @IsOptional()
  @IsInt()
  readonly taller_id?: number;

  @IsOptional()
  @IsInt()
  readonly mecanico_id?: number;

  @IsNumber()
  @Min(0, { message: 'El kilometraje de ingreso no puede ser negativo' })
  readonly kilometraje_ingreso: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El kilometraje de salida no puede ser negativo' })
  readonly kilometraje_salida?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly valor_arreglo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly costo_repuestos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly costo_total?: number;

  @IsOptional()
  @IsString()
  readonly descripcion?: string;

  @IsOptional()
  @IsString()
  readonly diagnostico?: string;

  @IsOptional()
  @IsString()
  readonly trabajo_realizado?: string;

  @IsOptional()
  @IsEnum(EstadoFicha)
  readonly estado?: EstadoFicha;
}
