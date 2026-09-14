import { IsNotEmpty, IsString, IsOptional, IsNumber, IsPositive, IsBoolean } from 'class-validator';

export class CreateServicioDto {
  @IsNotEmpty({ message: 'El nombre del servicio es obligatorio' })
  @IsString()
  readonly nombre: string;

  @IsOptional()
  @IsString()
  readonly descripcion?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'El tiempo estimado en horas debe ser positivo' })
  readonly tiempo_estimado_horas?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'El precio base debe ser positivo' })
  readonly precio_base?: number;

  @IsOptional()
  @IsBoolean()
  readonly activo?: boolean;
}
