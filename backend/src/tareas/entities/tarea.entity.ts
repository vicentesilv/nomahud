import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';

export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
export type PrioridadTarea = 'baja' | 'media' | 'alta' | 'critica';

@Entity()
export class Tarea {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    titulo: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({
        type: 'enum',
        enum: ['pendiente', 'en_progreso', 'completada', 'cancelada'],
        default: 'pendiente',
    })
    estado: EstadoTarea;

    @Column({
        type: 'enum',
        enum: ['baja', 'media', 'alta', 'critica'],
        default: 'media',
    })
    prioridad: PrioridadTarea;

    @Column({ type: 'datetime', nullable: true })
    fechaVencimiento: Date;

    @Column({ type: 'int', nullable: true })
    estimacionHoras: number;

    @Column({ type: 'boolean', default: false })
    autoTiempoRegistrado: boolean;

    @Column({ type: 'int' })
    proyectoId: number;

    @ManyToOne(() => Proyecto, (proyecto) => proyecto.tareas, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'proyectoId' })
    proyecto: Proyecto;

    @Column({ type: 'int', nullable: true })
    asignadoAId: number;

    @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'asignadoAId' })
    asignadoA: Usuario;

    @CreateDateColumn({ type: 'datetime' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt: Date;
}
