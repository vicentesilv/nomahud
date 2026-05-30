import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';

@Entity()
export class Cliente {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 200 })
    nombre: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    empresa: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    correo: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    telefono: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    sitioWeb: string;

    @Column({ type: 'text', nullable: true })
    notas: string;

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
