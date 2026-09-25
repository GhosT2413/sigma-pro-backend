import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';

// Definimos las opciones exactas que acepta tu base de datos
export enum TipoUso {
    DIARIO = 'DIARIO',
    CARRERA = 'CARRERA',
    TUNING = 'TUNING',
    EXHIBICION = 'EXHIBICION',
}

export enum EstadoVehiculo {
    ACTIVO = 'ACTIVO',
    EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
    INACTIVO = 'INACTIVO',
}

@Entity('vehiculos')
export class Vehiculo {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @ManyToOne(() => Cliente, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cliente_id' })
    cliente: Cliente;

    @Column({ type: 'int', unsigned: true, nullable: true })
    empresa_id: number;

    @Column({ type: 'varchar', length: 10, unique: true })
    patente: string;

    @Column({ type: 'varchar', length: 100 })
    marca: string;

    @Column({ type: 'varchar', length: 100 })
    modelo: string;

    @Column({ type: 'year', nullable: true })
    anio: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    vin: string;

    @Column({ type: 'int', unsigned: true, default: 0 })
    kilometraje_actual: number;

    @Column({ type: 'enum', enum: TipoUso, default: TipoUso.DIARIO })
    tipo_uso: TipoUso;

    @Column({ type: 'enum', enum: EstadoVehiculo, default: EstadoVehiculo.ACTIVO })
    estado: EstadoVehiculo;

    @Column({ type: 'date', nullable: true })
    vencimiento_revision_tecnica: Date;

    @Column({ type: 'date', nullable: true })
    vencimiento_soap: Date;

    @Column({ type: 'date', nullable: true })
    vencimiento_permiso_circulacion: Date;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}