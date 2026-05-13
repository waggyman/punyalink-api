import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminAuthSeedMigration1778073600000 implements MigrationInterface {
  name = 'AdminAuthSeedMigration1778073600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const email = 'admin@email.com';
    const name = 'Admin';
    const passwordHash = await bcrypt.hash('admin123', 10);

    await queryRunner.query(
      `
      INSERT INTO "admins" ("id", "name", "email", "password", "created_at", "updated_at")
      SELECT $1, $2, $3, $4, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM "admins" WHERE "email" = $5
      )
      `,
      [randomUUID(), name, email, passwordHash, email],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "admins" WHERE "email" = $1`, [
      'admin@email.com',
    ]);
  }
}
