import { MigrationInterface, QueryRunner } from 'typeorm';

export class TemporaryLinkCollectionSchema1778242070326
  implements MigrationInterface
{
  name = 'TemporaryLinkCollectionSchema1778242070326';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "collections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "access_link" character varying(120) NOT NULL,
        "store_id" uuid NOT NULL,
        "expired_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_collections_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_collections_store_access" UNIQUE ("store_id", "access_link"),
        CONSTRAINT "FK_collections_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "link_collections" (
        "link_id" uuid NOT NULL,
        "collection_id" uuid NOT NULL,
        CONSTRAINT "PK_link_collections" PRIMARY KEY ("link_id", "collection_id"),
        CONSTRAINT "FK_link_collections_link" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_link_collections_collection" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_link_collections_collection_id" ON "link_collections" ("collection_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_link_collections_collection_id"`,
    );
    await queryRunner.query(`DROP TABLE "link_collections"`);
    await queryRunner.query(`DROP TABLE "collections"`);
  }
}
