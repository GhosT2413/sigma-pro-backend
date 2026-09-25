import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Usuario } from '../usuarios/usuarios.entity';

@Entity('talleres')
export class Taller {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', length: 200 })
    nombre: string;

    @Column({ type: 'varchar', length: 30, unique: true })
    rut_empresa: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    patente_comercial: string;

    @Column({ type: 'text', nullable: true })
    comprobante_domicilio_url: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    representante_legal: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    email_contacto: string;

    @Column({ type: 'varchar', length: 30, nullable: true })
    telefono: string;

    @Column({ type: 'text', nullable: true })
    direccion: string;

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @OneToMany(() => Usuario, usuario => usuario.taller)
    usuarios: Usuario[];
}