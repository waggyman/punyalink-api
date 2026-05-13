import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsVerifiedForStoreAndUser1778076343705 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stores" ADD COLUMN "is_verified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "is_verified" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_verified"`);
    await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "is_verified"`);
  }
}
