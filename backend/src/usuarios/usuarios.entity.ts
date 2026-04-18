import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ type: 'varchar', length: 150 })
    nombre: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    correo: string;
    
    @Column({ type: 'varchar', length: 255, nullable: false, select: false })
    contrasena: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    ciudad: string;

    @Column({ type: 'date' })
    fechaNacimiento: Date;


}