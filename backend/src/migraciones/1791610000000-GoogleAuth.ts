import { MigrationInterface, QueryRunner } from 'typeorm';

export class GoogleAuth1791610000000 implements MigrationInterface {
    name = 'GoogleAuth1791610000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `usuario` ADD `googleId` varchar(255) NULL');
        await queryRunner.query('CREATE UNIQUE INDEX `IDX_usuario_googleId` ON `usuario` (`googleId`)');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX `IDX_usuario_googleId` ON `usuario`');
        await queryRunner.query('ALTER TABLE `usuario` DROP COLUMN `googleId`');
    }
}
