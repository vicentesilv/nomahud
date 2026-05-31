import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';
import { Tarea } from '../../tareas/entities/tarea.entity';

@Entity()
export class RegistroTiempo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    proyectoId: number;

    @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'proyectoId' })
    proyecto: Proyecto;

    @Column({ type: 'int', nullable: true })
    tareaId: number;

    @ManyToOne(() => Tarea, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'tareaId' })
    tarea: Tarea;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'date' })
    fecha: string;

    @Column({ type: 'decimal', precision: 6, scale: 2 })
    horas: number;

    @Column({ type: 'int' })
    creadorId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'creadorId' })
    creador: Usuario;

    @CreateDateColumn({ type: 'datetime' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt: Date;
}
