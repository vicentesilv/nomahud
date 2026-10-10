import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';

@Entity()
export class RefreshToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    usuarioId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @Column({ type: 'varchar', length: 255, unique: true })
    tokenHash: string;

    @Column({ type: 'datetime' })
    expiraEn: Date;

    @Column({ type: 'datetime', nullable: true })
    revocadoEn?: Date | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    userAgent?: string | null;

    @CreateDateColumn({ type: 'datetime' })
    creadoEn: Date;
}
