import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';

export type RolInvitacion = 'editor' | 'lector';

@Entity()
export class ProyectoInvitacion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    proyectoId: number;

    @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'proyectoId' })
    proyecto: Proyecto;

    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'enum', enum: ['editor', 'lector'], default: 'editor' })
    rol: RolInvitacion;

    @Column({ type: 'varchar', length: 255, unique: true })
    tokenHash: string;

    @Column({ type: 'datetime' })
    expiraEn: Date;

    @Column({ type: 'datetime', nullable: true })
    usadoEn?: Date | null;

    @Column({ type: 'int' })
    creadorId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'creadorId' })
    creador: Usuario;

    @CreateDateColumn({ type: 'datetime' })
    createdAt: Date;
}
