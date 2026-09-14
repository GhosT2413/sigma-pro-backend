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
    password_hash: string; // Aquí guardaremos la contraseña encriptada con Bcrypt más adelante

    @Column({ type: 'varchar', length: 30, nullable: true })
    telefono: string;

    @Column({ type: 'boolean', default: true })
    activo: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    // @ManyToOne significa "Muchos usuarios pueden tener Un mismo rol"
    @ManyToOne(() => Role)
    @JoinColumn({ name: 'role_id' }) // Le decimos que la columna en MySQL se llama 'role_id'
    role: Role;
}