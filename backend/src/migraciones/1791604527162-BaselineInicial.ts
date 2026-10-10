import { MigrationInterface, QueryRunner } from "typeorm";

export class BaselineInicial1791604527162 implements MigrationInterface {
    name = 'BaselineInicial1791604527162'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`perfil\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuarioId\` int NOT NULL, \`bio\` text NULL, \`avatarUrl\` varchar(500) NULL, \`sitioWeb\` varchar(255) NULL, \`skills\` text NULL, \`idiomas\` text NULL, \`zonaHoraria\` varchar(100) NULL, \`estadoLaboral\` enum ('disponible', 'ocupado', 'noDisponible') NOT NULL DEFAULT 'disponible', \`paisActual\` varchar(100) NULL, \`ciudadActual\` varchar(100) NULL, \`monedaPreferida\` varchar(10) NOT NULL DEFAULT 'USD', \`notificacionesEmail\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_f99e76858727f399929560dcb1\` (\`usuarioId\`), UNIQUE INDEX \`REL_f99e76858727f399929560dcb1\` (\`usuarioId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`usuario\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(150) NOT NULL, \`correo\` varchar(255) NOT NULL, \`contrasena\` varchar(255) NOT NULL, \`ciudad\` varchar(255) NULL, \`fechaNacimiento\` date NULL, \`emailVerificado\` tinyint NOT NULL DEFAULT 0, \`emailVerificadoAt\` datetime NULL, \`estadoCuenta\` enum ('pendiente', 'activa', 'bloqueada') NOT NULL DEFAULT 'pendiente', UNIQUE INDEX \`IDX_349ecb64acc4355db443ca17cb\` (\`correo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`itinerario_item\` (\`id\` int NOT NULL AUTO_INCREMENT, \`viajeId\` int NOT NULL, \`lugar\` varchar(255) NOT NULL, \`fecha\` date NULL, \`descripcion\` text NULL, \`costo\` decimal(10,2) NULL, \`orden\` int NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`viaje\` (\`id\` int NOT NULL AUTO_INCREMENT, \`destino\` varchar(255) NOT NULL, \`fechaInicio\` date NOT NULL, \`fechaFin\` date NULL, \`estado\` enum ('planificado', 'en_curso', 'completado', 'cancelado') NOT NULL DEFAULT 'planificado', \`presupuesto\` decimal(12,2) NULL, \`moneda\` varchar(5) NOT NULL DEFAULT 'MXN', \`notas\` text NULL, \`creadorId\` int NOT NULL, \`autoGastoRegistrado\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`cliente\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(200) NOT NULL, \`empresa\` varchar(200) NULL, \`correo\` varchar(255) NULL, \`telefono\` varchar(50) NULL, \`sitioWeb\` varchar(255) NULL, \`notas\` text NULL, \`creadorId\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tarea\` (\`id\` int NOT NULL AUTO_INCREMENT, \`titulo\` varchar(255) NOT NULL, \`descripcion\` text NULL, \`estado\` enum ('pendiente', 'en_progreso', 'completada', 'cancelada') NOT NULL DEFAULT 'pendiente', \`prioridad\` enum ('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media', \`fechaVencimiento\` datetime NULL, \`estimacionHoras\` int NULL, \`autoTiempoRegistrado\` tinyint NOT NULL DEFAULT 0, \`proyectoId\` int NOT NULL, \`asignadoAId\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`proyecto_miembro\` (\`id\` int NOT NULL AUTO_INCREMENT, \`proyectoId\` int NOT NULL, \`usuarioId\` int NOT NULL, \`rol\` enum ('editor', 'lector') NOT NULL DEFAULT 'editor', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_52c5fe94aca4a622754b1fb785\` (\`proyectoId\`, \`usuarioId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`proyecto\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(200) NOT NULL, \`descripcion\` text NULL, \`estado\` enum ('activo', 'completado', 'en_pausa', 'cancelado') NOT NULL DEFAULT 'activo', \`prioridad\` enum ('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media', \`fechaInicio\` date NULL, \`fechaFin\` date NULL, \`cliente\` varchar(200) NULL, \`clienteId\` int NULL, \`ganancia\` decimal(12,2) NULL, \`creadorId\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`registro_tiempo\` (\`id\` int NOT NULL AUTO_INCREMENT, \`proyectoId\` int NOT NULL, \`tareaId\` int NULL, \`descripcion\` text NULL, \`fecha\` date NOT NULL, \`horas\` decimal(6,2) NOT NULL, \`creadorId\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`proyecto_invitacion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`proyectoId\` int NOT NULL, \`email\` varchar(255) NOT NULL, \`rol\` enum ('editor', 'lector') NOT NULL DEFAULT 'editor', \`tokenHash\` varchar(255) NOT NULL, \`expiraEn\` datetime NOT NULL, \`usadoEn\` datetime NULL, \`creadorId\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_9221ce71c23a5619368a482e74\` (\`tokenHash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`transaccion\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tipo\` enum ('ingreso', 'gasto') NOT NULL, \`categoria\` varchar(100) NOT NULL, \`monto\` decimal(12,2) NOT NULL, \`moneda\` varchar(10) NOT NULL DEFAULT 'USD', \`descripcion\` text NULL, \`fecha\` date NOT NULL, \`proyectoId\` int NULL, \`clienteId\` int NULL, \`creadorId\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`documento\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(255) NOT NULL, \`archivo\` varchar(500) NOT NULL, \`tipo\` varchar(20) NOT NULL, \`entidadId\` int NULL, \`mimeType\` varchar(100) NULL, \`size\` int NULL, \`creadorId\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`refresh_token\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuarioId\` int NOT NULL, \`tokenHash\` varchar(255) NOT NULL, \`expiraEn\` datetime NOT NULL, \`revocadoEn\` datetime NULL, \`userAgent\` varchar(255) NULL, \`creadoEn\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_204f27bcee2b705b8230beaf41\` (\`tokenHash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`auth_token\` (\`id\` int NOT NULL AUTO_INCREMENT, \`usuarioId\` int NOT NULL, \`tipo\` enum ('confirmacion_email', 'recuperacion_password') NOT NULL, \`tokenHash\` varchar(255) NOT NULL, \`expiraEn\` datetime NOT NULL, \`usadoEn\` datetime NULL, \`creadoEn\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`perfil\` ADD CONSTRAINT \`FK_f99e76858727f399929560dcb1e\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`itinerario_item\` ADD CONSTRAINT \`FK_25d0c27cddcee4dc07bfc6294fe\` FOREIGN KEY (\`viajeId\`) REFERENCES \`viaje\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`viaje\` ADD CONSTRAINT \`FK_5882bdd66d334547ac38525aa4e\` FOREIGN KEY (\`creadorId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cliente\` ADD CONSTRAINT \`FK_93e6a635fa19fa61da55c7ffd68\` FOREIGN KEY (\`creadorId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tarea\` ADD CONSTRAINT \`FK_2afa1a9f64adb52769a88b8bcf1\` FOREIGN KEY (\`proyectoId\`) REFERENCES \`proyecto\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tarea\` ADD CONSTRAINT \`FK_bb2f5e1bdf575155b710a4ab50e\` FOREIGN KEY (\`asignadoAId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`proyecto_miembro\` ADD CONSTRAINT \`FK_35d01d9d22773244c222e391138\` FOREIGN KEY (\`proyectoId\`) REFERENCES \`proyecto\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`proyecto_miembro\` ADD CONSTRAINT \`FK_8c9fade9163ad4b14cb0bb205a3\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`proyecto\` ADD CONSTRAINT \`FK_c0ff17656375c1b3ee9bd9ddf9b\` FOREIGN KEY (\`clienteId\`) REFERENCES \`cliente\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`proyecto\` ADD CONSTRAINT \`FK_d46406a34aab4fd55f6b5448b92\` FOREIGN KEY (\`creadorId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`registro_tiempo\` ADD CONSTRAINT \`FK_4ab2e851d0b12f92dcec7e68526\` FOREIGN KEY (\`proyectoId\`) REFERENCES \`proyecto\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`registro_tiempo\` ADD CONSTRAINT \`FK_1696a3e62c78424ab1648452376\` FOREIGN KEY (\`tareaId\`) REFERENCES \`tarea\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`registro_tiempo\` ADD CONSTRAINT \`FK_85865d3ff7bfcc8b172228dc1ad\` FOREIGN KEY (\`creadorId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`proyecto_invitacion\` ADD CONSTRAINT \`FK_5124dfefb12606cbfa5a7900b7d\` FOREIGN KEY (\`proyectoId\`) REFERENCES \`proyecto\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`proyecto_invitacion\` ADD CONSTRAINT \`FK_604c1efa8f8813279e25974aa81\` FOREIGN KEY (\`creadorId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transaccion\` ADD CONSTRAINT \`FK_f50a87250b13fd5120bda01ee04\` FOREIGN KEY (\`proyectoId\`) REFERENCES \`proyecto\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transaccion\` ADD CONSTRAINT \`FK_f7a24112e34e828313fac8909f8\` FOREIGN KEY (\`clienteId\`) REFERENCES \`cliente\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transaccion\` ADD CONSTRAINT \`FK_2466099c63ac644285af9ac85fd\` FOREIGN KEY (\`creadorId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`documento\` ADD CONSTRAINT \`FK_ee61af40a9d657b1ece0d3995ae\` FOREIGN KEY (\`creadorId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`refresh_token\` ADD CONSTRAINT \`FK_6f6e8bfdbac7904b7dc427f3b35\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`auth_token\` ADD CONSTRAINT \`FK_8e51b9ed6108149802caf2cf500\` FOREIGN KEY (\`usuarioId\`) REFERENCES \`usuario\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`auth_token\` DROP FOREIGN KEY \`FK_8e51b9ed6108149802caf2cf500\``);
        await queryRunner.query(`ALTER TABLE \`refresh_token\` DROP FOREIGN KEY \`FK_6f6e8bfdbac7904b7dc427f3b35\``);
        await queryRunner.query(`ALTER TABLE \`documento\` DROP FOREIGN KEY \`FK_ee61af40a9d657b1ece0d3995ae\``);
        await queryRunner.query(`ALTER TABLE \`transaccion\` DROP FOREIGN KEY \`FK_2466099c63ac644285af9ac85fd\``);
        await queryRunner.query(`ALTER TABLE \`transaccion\` DROP FOREIGN KEY \`FK_f7a24112e34e828313fac8909f8\``);
        await queryRunner.query(`ALTER TABLE \`transaccion\` DROP FOREIGN KEY \`FK_f50a87250b13fd5120bda01ee04\``);
        await queryRunner.query(`ALTER TABLE \`proyecto_invitacion\` DROP FOREIGN KEY \`FK_604c1efa8f8813279e25974aa81\``);
        await queryRunner.query(`ALTER TABLE \`proyecto_invitacion\` DROP FOREIGN KEY \`FK_5124dfefb12606cbfa5a7900b7d\``);
        await queryRunner.query(`ALTER TABLE \`registro_tiempo\` DROP FOREIGN KEY \`FK_85865d3ff7bfcc8b172228dc1ad\``);
        await queryRunner.query(`ALTER TABLE \`registro_tiempo\` DROP FOREIGN KEY \`FK_1696a3e62c78424ab1648452376\``);
        await queryRunner.query(`ALTER TABLE \`registro_tiempo\` DROP FOREIGN KEY \`FK_4ab2e851d0b12f92dcec7e68526\``);
        await queryRunner.query(`ALTER TABLE \`proyecto\` DROP FOREIGN KEY \`FK_d46406a34aab4fd55f6b5448b92\``);
        await queryRunner.query(`ALTER TABLE \`proyecto\` DROP FOREIGN KEY \`FK_c0ff17656375c1b3ee9bd9ddf9b\``);
        await queryRunner.query(`ALTER TABLE \`proyecto_miembro\` DROP FOREIGN KEY \`FK_8c9fade9163ad4b14cb0bb205a3\``);
        await queryRunner.query(`ALTER TABLE \`proyecto_miembro\` DROP FOREIGN KEY \`FK_35d01d9d22773244c222e391138\``);
        await queryRunner.query(`ALTER TABLE \`tarea\` DROP FOREIGN KEY \`FK_bb2f5e1bdf575155b710a4ab50e\``);
        await queryRunner.query(`ALTER TABLE \`tarea\` DROP FOREIGN KEY \`FK_2afa1a9f64adb52769a88b8bcf1\``);
        await queryRunner.query(`ALTER TABLE \`cliente\` DROP FOREIGN KEY \`FK_93e6a635fa19fa61da55c7ffd68\``);
        await queryRunner.query(`ALTER TABLE \`viaje\` DROP FOREIGN KEY \`FK_5882bdd66d334547ac38525aa4e\``);
        await queryRunner.query(`ALTER TABLE \`itinerario_item\` DROP FOREIGN KEY \`FK_25d0c27cddcee4dc07bfc6294fe\``);
        await queryRunner.query(`ALTER TABLE \`perfil\` DROP FOREIGN KEY \`FK_f99e76858727f399929560dcb1e\``);
        await queryRunner.query(`DROP TABLE \`auth_token\``);
        await queryRunner.query(`DROP INDEX \`IDX_204f27bcee2b705b8230beaf41\` ON \`refresh_token\``);
        await queryRunner.query(`DROP TABLE \`refresh_token\``);
        await queryRunner.query(`DROP TABLE \`documento\``);
        await queryRunner.query(`DROP TABLE \`transaccion\``);
        await queryRunner.query(`DROP INDEX \`IDX_9221ce71c23a5619368a482e74\` ON \`proyecto_invitacion\``);
        await queryRunner.query(`DROP TABLE \`proyecto_invitacion\``);
        await queryRunner.query(`DROP TABLE \`registro_tiempo\``);
        await queryRunner.query(`DROP TABLE \`proyecto\``);
        await queryRunner.query(`DROP INDEX \`IDX_52c5fe94aca4a622754b1fb785\` ON \`proyecto_miembro\``);
        await queryRunner.query(`DROP TABLE \`proyecto_miembro\``);
        await queryRunner.query(`DROP TABLE \`tarea\``);
        await queryRunner.query(`DROP TABLE \`cliente\``);
        await queryRunner.query(`DROP TABLE \`viaje\``);
        await queryRunner.query(`DROP TABLE \`itinerario_item\``);
        await queryRunner.query(`DROP INDEX \`IDX_349ecb64acc4355db443ca17cb\` ON \`usuario\``);
        await queryRunner.query(`DROP TABLE \`usuario\``);
        await queryRunner.query(`DROP INDEX \`REL_f99e76858727f399929560dcb1\` ON \`perfil\``);
        await queryRunner.query(`DROP INDEX \`IDX_f99e76858727f399929560dcb1\` ON \`perfil\``);
        await queryRunner.query(`DROP TABLE \`perfil\``);
    }

}
