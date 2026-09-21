import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../roles/role.entity';

@Entity('usuarios') // Nombre de tu tabla en MySQL
export class Usuario {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 200 })
    nombre_completo: string;

    @Column({ type: 'varchar', length: 150, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    password_hash: string;

    @Column({ type: 'varchar', length: 30, nullable: true })
    telefono: string;

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @Column({ type: 'boolean', default: false })
    hasAcceptedTerms: boolean;

    // ── Mecánico Independiente: documentación ──
    @Column({ type: 'text', nullable: true })
    cedula_frente_url: string;

    @Column({ type: 'text', nullable: true })
    cedula_reverso_url: string;

    @Column({ type: 'text', nullable: true })
    certificado_antecedentes_url: string;

    // ── Taller Mecánico: documentación ──
    @Column({ type: 'varchar', length: 30, nullable: true })
    rut_empresa: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    patente_comercial: string;

    @Column({ type: 'text', nullable: true })
    comprobante_domicilio_url: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    representante_legal: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @ManyToOne(() => Role)
    @JoinColumn({ name: 'role_id' })
    role: Role;
}