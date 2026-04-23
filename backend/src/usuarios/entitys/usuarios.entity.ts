import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export type EstadoCuenta = 'pendiente' | 'activa' | 'bloqueada';

@Entity()
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ type: 'varchar', length: 150 })
    nombre: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    correo: string;
    
    @Column({ type: 'varchar', length: 255, nullable: false, select: false })
    contrasena: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    ciudad: string;

    @Column({ type: 'date' })
    fechaNacimiento: Date;

    @Column({ type: 'boolean', default: false })
    emailVerificado: boolean;

    @Column({ type: 'datetime', nullable: true })
    emailVerificadoAt?: Date | null;

    @Column({
        type: 'enum',
        enum: ['pendiente', 'activa', 'bloqueada'],
        default: 'pendiente',
    })
    estadoCuenta: EstadoCuenta;


}