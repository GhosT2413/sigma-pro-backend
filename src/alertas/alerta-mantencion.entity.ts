import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum EstadoAlerta {
  PENDIENTE = 'PENDIENTE',
  ATENDIDA = 'ATENDIDA',
  CANCELADA = 'CANCELADA',
}

@Entity('alertas_mantencion')
export class AlertaMantencion {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  vehiculo_id: number;

  @Column({ type: 'varchar', length: 100 })
  tipo: string; // Guardaremos 'AMARILLO' o 'ROJO' según RF-09

  @Column({ type: 'varchar', length: 255 })
  descripcion: string;

  @Column({ type: 'int', unsigned: true, nullable: true })
  kilometraje_objetivo: number;

  @Column({ type: 'date', nullable: true })
  fecha_objetivo: Date;

  @Column({ type: 'enum', enum: EstadoAlerta, default: EstadoAlerta.PENDIENTE })
  estado: EstadoAlerta;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}