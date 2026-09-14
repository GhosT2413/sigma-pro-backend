import { EstadoVehiculo, TipoUso } from "./vehiculo.entity";

// src/vehiculos/dto/create-vehiculo.dto.ts
export class CreateVehiculoDto {
    readonly cliente_id: number;
    readonly patente: string;
    readonly marca: string;
    readonly modelo: string;
    readonly anio?: number;
    readonly vin?: string;
    readonly kilometraje_actual: number;
    readonly tipo_uso?: TipoUso;
    readonly estado?: EstadoVehiculo;
}