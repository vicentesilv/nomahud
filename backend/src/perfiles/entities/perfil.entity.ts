import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';

export type EstadoLaboral = 'disponible' | 'ocupado' | 'noDisponible';

@Entity()
export class Perfil {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', unique: true })
    usuarioId: number;

    @OneToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    avatarUrl: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    sitioWeb: string;

    @Column({ type: 'simple-json', nullable: true })
    skills: string[];

    @Column({ type: 'simple-json', nullable: true })
    idiomas: { idioma: string; nivel: string }[];

    @Column({ type: 'varchar', length: 100, nullable: true })
    zonaHoraria: string;

    @Column({
        type: 'enum',
        enum: ['disponible', 'ocupado', 'noDisponible'],
        default: 'disponible',
    })
    estadoLaboral: EstadoLaboral;

    @Column({ type: 'varchar', length: 100, nullable: true })
    paisActual: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    ciudadActual: string;

    @Column({ type: 'varchar', length: 10, default: 'USD' })
    monedaPreferida: string;

    @CreateDateColumn({ type: 'datetime' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt: Date;
}
