import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserSocialLinks1778400000000 implements MigrationInterface {
  name = 'UserSocialLinks1778400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "social_links" jsonb NOT NULL DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "social_links"
    `);
  }
}
