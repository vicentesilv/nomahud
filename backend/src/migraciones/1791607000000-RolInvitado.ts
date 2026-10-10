import { MigrationInterface, QueryRunner } from 'typeorm';

export class RolInvitado1791607000000 implements MigrationInterface {
    name = 'RolInvitado1791607000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`usuario\` ADD \`rol\` enum('normal', 'invitado') NOT NULL DEFAULT 'normal'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`usuario\` DROP COLUMN \`rol\``);
    }
}
