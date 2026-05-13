import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinksSchema1778078500000 implements MigrationInterface {
  name = 'LinksSchema1778078500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "image" character varying(512),
        "name" character varying(255) NOT NULL,
        "external_link" character varying(2048) NOT NULL,
        "access_link" character varying(120) NOT NULL,
        "view" integer NOT NULL DEFAULT 0,
        "click" integer NOT NULL DEFAULT 0,
        "source" character varying(255),
        "is_public" boolean NOT NULL DEFAULT true,
        "is_active" boolean NOT NULL DEFAULT true,
        "store_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_links_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_links_store_access" UNIQUE ("store_id", "access_link"),
        CONSTRAINT "FK_links_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "links"`);
  }
}
