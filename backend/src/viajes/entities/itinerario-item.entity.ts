import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Viaje } from './viaje.entity';

@Entity()
export class ItinerarioItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    viajeId: number;

    @ManyToOne(() => Viaje, (viaje) => viaje.itinerario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'viajeId' })
    viaje: Viaje;

    @Column({ type: 'varchar', length: 255 })
    lugar: string;

    @Column({ type: 'date', nullable: true })
    fecha: string;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    costo: number;

    @Column({ type: 'int', default: 0 })
    orden: number;

    @CreateDateColumn({ type: 'datetime' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt: Date;
}
