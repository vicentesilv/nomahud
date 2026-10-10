import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Proyecto } from './proyecto.entity';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';

export type RolMiembro = 'editor' | 'lector';

@Entity()
@Unique(['proyectoId', 'usuarioId'])
export class ProyectoMiembro {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    proyectoId: number;

    @ManyToOne(() => Proyecto, (proyecto) => proyecto.miembros, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'proyectoId' })
    proyecto: Proyecto;

    @Column({ type: 'int' })
    usuarioId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @Column({ type: 'enum', enum: ['editor', 'lector'], default: 'editor' })
    rol: RolMiembro;

    @CreateDateColumn({ type: 'datetime' })
    createdAt: Date;
}
