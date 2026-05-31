import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';
import { ItinerarioItem } from './itinerario-item.entity';

export type EstadoViaje = 'planificado' | 'en_curso' | 'completado' | 'cancelado';

@Entity()
export class Viaje {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    destino: string;

    @Column({ type: 'date' })
    fechaInicio: string;

    @Column({ type: 'date', nullable: true })
    fechaFin: string;

    @Column({
        type: 'enum',
        enum: ['planificado', 'en_curso', 'completado', 'cancelado'],
        default: 'planificado',
    })
    estado: EstadoViaje;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    presupuesto: number;

    @Column({ type: 'varchar', length: 5, default: 'MXN' })
    moneda: string;

    @Column({ type: 'text', nullable: true })
    notas: string;

    @Column({ type: 'int' })
    creadorId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'creadorId' })
    creador: Usuario;

    @Column({ type: 'boolean', default: false })
    autoGastoRegistrado: boolean;

    @OneToMany(() => ItinerarioItem, (item) => item.viaje, { cascade: true })
    itinerario: ItinerarioItem[];

    @CreateDateColumn({ type: 'datetime' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt: Date;
}
