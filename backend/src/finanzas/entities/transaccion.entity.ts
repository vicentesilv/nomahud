import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';
import { Cliente } from '../../clientes/entities/cliente.entity';

export type TipoTransaccion = 'ingreso' | 'gasto';

@Entity()
export class Transaccion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: ['ingreso', 'gasto'],
    })
    tipo: TipoTransaccion;

    @Column({ type: 'varchar', length: 100 })
    categoria: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    monto: number;

    @Column({ type: 'varchar', length: 10, default: 'USD' })
    moneda: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'date' })
    fecha: string;

    @Column({ type: 'int', nullable: true })
    proyectoId: number;

    @ManyToOne(() => Proyecto, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'proyectoId' })
    proyecto: Proyecto;

    @Column({ type: 'int', nullable: true })
    clienteId: number;

    @ManyToOne(() => Cliente, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'clienteId' })
    cliente: Cliente;

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
