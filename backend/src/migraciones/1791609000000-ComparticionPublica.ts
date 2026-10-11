import { MigrationInterface, QueryRunner } from 'typeorm';

export class ComparticionPublica1791609000000 implements MigrationInterface {
    name = 'ComparticionPublica1791609000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`proyecto_comparticion\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`proyectoId\` int NOT NULL,
                \`tokenHash\` varchar(255) NOT NULL,
                \`expiraEn\` datetime NOT NULL,
                \`usadoEn\` datetime NULL,
                \`creadoEn\` datetime NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE INDEX \`IDX_tokenHash\` (\`tokenHash\`),
                CONSTRAINT \`FK_proyectoId\` FOREIGN KEY (\`proyectoId\`) REFERENCES \`proyecto\` (\`id\`) ON DELETE CASCADE
            )`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`proyecto_comparticion\``);
    }
}
