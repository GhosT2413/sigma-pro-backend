import { EstadoFicha } from '../ficha-mantencion.entity';

export class CreateFichaDto {
  readonly vehiculo_id: number;
  readonly mecanico_id: number;
  readonly kilometraje_ingreso: number;
  readonly descripcion: string;
  readonly estado?: EstadoFicha; // Puede venir vacío y tomará EN_ESPERA por defecto
}