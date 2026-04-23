import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entitys/usuarios.entity';

export type AuthTokenType = 'confirmacion_email' | 'recuperacion_password';

@Entity()
export class AuthToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    usuarioId: number;

    @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @Column({
        type: 'enum',
        enum: ['confirmacion_email', 'recuperacion_password'],
    })
    tipo: AuthTokenType;

    @Column({ type: 'varchar', length: 255 })
    tokenHash: string;

    @Column({ type: 'datetime' })
    expiraEn: Date;

    @Column({ type: 'datetime', nullable: true })
    usadoEn?: Date | null;

    @CreateDateColumn({ type: 'datetime', name: 'creadoEn' })
    creadoEn: Date;
}