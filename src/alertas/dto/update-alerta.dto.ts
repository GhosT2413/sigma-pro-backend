import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoAlerta } from '../alerta-mantencion.entity';

export class UpdateAlertaDto {
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsEnum(EstadoAlerta, { message: 'Estado de alerta no válido' })
  readonly estado: EstadoAlerta;
}
