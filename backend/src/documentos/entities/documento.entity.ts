import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';

@Entity()
export class Documento {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    nombre: string;

    @Column({ type: 'varchar', length: 500 })
    archivo: string;

    @Column({ type: 'varchar', length: 20 })
    tipo: 'proyecto' | 'viaje';

    @Column({ type: 'int', nullable: true })
    entidadId: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    mimeType: string;

    @Column({ type: 'int', nullable: true })
    size: number;

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
