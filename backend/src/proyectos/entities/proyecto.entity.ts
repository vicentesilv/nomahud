import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Tarea } from '../../tareas/entities/tarea.entity';

export type EstadoProyecto = 'activo' | 'completado' | 'en_pausa' | 'cancelado';
export type Prioridad = 'baja' | 'media' | 'alta' | 'critica';

@Entity()
export class Proyecto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 200 })
    nombre: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({
        type: 'enum',
        enum: ['activo', 'completado', 'en_pausa', 'cancelado'],
        default: 'activo',
    })
    estado: EstadoProyecto;

    @Column({
        type: 'enum',
        enum: ['baja', 'media', 'alta', 'critica'],
        default: 'media',
    })
    prioridad: Prioridad;

    @Column({ type: 'date', nullable: true })
    fechaInicio: string;

    @Column({ type: 'date', nullable: true })
    fechaFin: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    cliente: string;

    @Column({ type: 'int', nullable: true })
    clienteId: number;

    @ManyToOne(() => Cliente, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'clienteId' })
    clienteRel: Cliente;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    presupuesto: number;

    @Column({ type: 'varchar', length: 10, default: 'USD' })
    moneda: string;

    @Column({ type: 'int' })
    creadorId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'creadorId' })
    creador: Usuario;

    @OneToMany(() => Tarea, (tarea) => tarea.proyecto)
    tareas: Tarea[];

    @CreateDateColumn({ type: 'datetime' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt: Date;
}
