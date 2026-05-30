import { MigrationInterface, QueryRunner } from 'typeorm';

export class MembershipsSchema1778500000000 implements MigrationInterface {
  name = 'MembershipsSchema1778500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "memberships" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(32) NOT NULL,
        "name" character varying(120) NOT NULL,
        "price_idr" integer,
        "limit_collection" integer,
        "limit_collection_link" integer,
        "can_custom_link" boolean NOT NULL DEFAULT false,
        "can_custom_link_collection" boolean NOT NULL DEFAULT false,
        "duration_days" integer,
        "grace_renewal_days" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_memberships" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_memberships_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "membership_stores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "store_id" uuid NOT NULL,
        "membership_id" uuid NOT NULL,
        "expired_at" TIMESTAMP NOT NULL,
        "show_warning_after" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_membership_stores" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_membership_stores_store" UNIQUE ("store_id"),
        CONSTRAINT "FK_membership_stores_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_membership_stores_membership" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "membership_purchases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "store_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "invoice_amount" integer NOT NULL,
        "bank_account_number" character varying(64) NOT NULL,
        "bank_account_name" character varying(255) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'pending',
        "receipt_image_key" character varying(128),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_membership_purchases" PRIMARY KEY ("id"),
        CONSTRAINT "FK_membership_purchases_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_membership_purchases_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_membership_purchases_store_status"
      ON "membership_purchases" ("store_id", "status")
    `);

    await queryRunner.query(`
      INSERT INTO "memberships" (
        "code", "name", "price_idr",
        "limit_collection", "limit_collection_link",
        "can_custom_link", "can_custom_link_collection",
        "duration_days", "grace_renewal_days"
      ) VALUES
      (
        'free', 'Free', NULL,
        15, 5,
        false, false,
        NULL, NULL
      ),
      (
        'plus', 'Plus', 50000,
        NULL, NULL,
        true, true,
        30, 10
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "membership_purchases"`);
    await queryRunner.query(`DROP TABLE "membership_stores"`);
    await queryRunner.query(`DROP TABLE "memberships"`);
  }
}
