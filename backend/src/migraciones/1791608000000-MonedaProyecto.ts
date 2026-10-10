import { MigrationInterface, QueryRunner } from 'typeorm';

export class MonedaProyecto1791608000000 implements MigrationInterface {
    name = 'MonedaProyecto1791608000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`proyecto\` ADD \`moneda\` varchar(10) NOT NULL DEFAULT 'USD'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`proyecto\` DROP COLUMN \`moneda\``);
    }
}
