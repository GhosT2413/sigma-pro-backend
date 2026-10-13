import { IsInt, IsIn, IsNotEmpty, IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoAlerta } from '../alerta-mantencion.entity';

export class CreateAlertaDto {
  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  vehiculo_id: number;

  @ApiProperty({ enum: ['AMARILLO', 'ROJO', 'VERDE'], example: 'AMARILLO' })
  @IsIn(['AMARILLO', 'ROJO', 'VERDE'])
  tipo: string;

  @ApiProperty({ example: 'Mantención de frenos próxima en 500 km.' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({ example: 120000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  kilometraje_objetivo?: number;

  @ApiPropertyOptional({ example: '2026-12-01' })
  @IsOptional()
  @IsDateString()
  fecha_objetivo?: string;

  @ApiPropertyOptional({ enum: EstadoAlerta, default: EstadoAlerta.PENDIENTE })
  @IsOptional()
  @IsEnum(EstadoAlerta)
  estado?: EstadoAlerta;
}
