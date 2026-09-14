import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum EstadoPrediccion {
  PENDIENTE = 'PENDIENTE',
  REVISADA = 'REVISADA',
  ATENDIDA = 'ATENDIDA',
}

@Entity('predicciones_ia')
export class PrediccionIa {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  vehiculo_id: number;

  @CreateDateColumn({ type: 'datetime' })
  fecha_prediccion: Date;

  @Column({ type: 'varchar', length: 150, nullable: true })
  componente: string;

  @Column({ type: 'text', nullable: true })
  diagnostico: string;

  @Column({ type: 'int', unsigned: true, nullable: true })
  kilometraje_actual: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  kilometraje_recomendado: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  probabilidad: number;

  @Column({ type: 'enum', enum: EstadoPrediccion, default: EstadoPrediccion.PENDIENTE })
  estado: EstadoPrediccion;
}