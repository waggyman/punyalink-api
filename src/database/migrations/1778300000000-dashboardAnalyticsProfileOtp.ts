import { MigrationInterface, QueryRunner } from 'typeorm';

export class DashboardAnalyticsProfileOtp1778300000000
  implements MigrationInterface
{
  name = 'DashboardAnalyticsProfileOtp1778300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "profile_image_key" character varying(128)
    `);

    await queryRunner.query(`
      ALTER TABLE "otps"
      ADD COLUMN "purpose" character varying(32) NOT NULL DEFAULT 'register'
    `);

    await queryRunner.query(`
      CREATE TABLE "link_analytics_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "link_id" uuid NOT NULL,
        "store_id" uuid NOT NULL,
        "event_type" character varying(10) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_link_analytics_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_link_analytics_link" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_link_analytics_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_link_analytics_store_created"
      ON "link_analytics_events" ("store_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_link_analytics_link_type_created"
      ON "link_analytics_events" ("link_id", "event_type", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_link_analytics_link_type_created"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_link_analytics_store_created"`,
    );
    await queryRunner.query(`DROP TABLE "link_analytics_events"`);
    await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "purpose"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "profile_image_key"`,
    );
  }
}
