import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from './proyecto.entity';

@Entity()
export class ProyectoComparticion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    proyectoId: number;

    @ManyToOne(() => Proyecto, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'proyectoId' })
    proyecto: Proyecto;

    @Column({ type: 'varchar', length: 255, unique: true })
    tokenHash: string;

    @Column({ type: 'datetime' })
    expiraEn: Date;

    @Column({ type: 'datetime', nullable: true })
    usadoEn?: Date | null;

    @CreateDateColumn({ type: 'datetime' })
    creadoEn: Date;
}
