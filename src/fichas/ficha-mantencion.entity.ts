import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum EstadoFicha {
  EN_ESPERA = 'EN_ESPERA',
  EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
  LISTO = 'LISTO',
  CANCELADO = 'CANCELADO',
}

@Entity('fichas_mantencion')
export class FichaMantencion {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  vehiculo_id: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  taller_id: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  mecanico_id: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha_ingreso: Date;

  @Column({ type: 'int', unsigned: true })
  kilometraje_ingreso: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  kilometraje_salida: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  horas_trabajadas: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  valor_hora: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  costo_mano_obra: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  costo_repuestos: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  costo_total: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  diagnostico: string;

  @Column({ type: 'text', nullable: true })
  trabajo_realizado: string;

  @Column({ type: 'enum', enum: EstadoFicha, default: EstadoFicha.EN_ESPERA })
  estado: EstadoFicha;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}