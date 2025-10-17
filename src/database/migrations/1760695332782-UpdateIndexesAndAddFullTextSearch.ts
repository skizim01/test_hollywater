import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateIndexesAndAddFullTextSearch1760695332782
  implements MigrationInterface
{
  name = 'UpdateIndexesAndAddFullTextSearch1760695332782';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bf20a3d4cdb6c6218a4e7c59ae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9fa6a6592d8a855b70df6e3b3d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1056dbee4616479f7d562c562d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72634969ce50bf7efbe4292ccd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6f50357a540439c8d17050c830"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3cd818eaf734a9d8814843f119"`,
    );

    await queryRunner.query(
      `ALTER TABLE "books" ADD "author_name" character varying`,
    );

    await queryRunner.query(`
            UPDATE "books" 
            SET "author_name" = authors.name 
            FROM authors 
            WHERE books.author_id = authors.id
        `);

    await queryRunner.query(
      `ALTER TABLE "books" ALTER COLUMN "author_name" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "books_author_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ALTER COLUMN "author_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ADD CONSTRAINT "books_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_books_publication_year_genre" ON "books" ("publicationYear", "genre")`,
    );

    await queryRunner.query(`
            CREATE INDEX "IDX_books_fulltext_search" ON "books" 
            USING gin(to_tsvector('english', title || ' ' || author_name))
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_books_fulltext_search"`);
    await queryRunner.query(`DROP INDEX "IDX_books_publication_year_genre"`);
    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "books_author_id_fkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ALTER COLUMN "author_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ADD CONSTRAINT "books_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "author_name"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_3cd818eaf734a9d8814843f119" ON "books" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6f50357a540439c8d17050c830" ON "books" ("genre") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72634969ce50bf7efbe4292ccd" ON "books" ("publicationYear") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1056dbee4616479f7d562c562d" ON "books" ("author_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9fa6a6592d8a855b70df6e3b3d" ON "books" ("title", "genre") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf20a3d4cdb6c6218a4e7c59ae" ON "books" ("createdAt") `,
    );
  }
}
