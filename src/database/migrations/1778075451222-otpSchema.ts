import { MigrationInterface, QueryRunner } from "typeorm";

export class OtpSchema1778075451222 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "target" character varying(255) NOT NULL, "value" character varying(10) NOT NULL, "expired_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_b4be38594183688e2f8f2f6b87f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_otps_target" ON "otps" ("target") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_otps_target"`);
        await queryRunner.query(`DROP TABLE "otps"`);
    }

}
