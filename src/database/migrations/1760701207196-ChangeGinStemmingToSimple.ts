import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeGinStemmingToSimple1760701207196
  implements MigrationInterface
{
  name = 'ChangeGinStemmingToSimple1760701207196';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_books_fulltext_search"`);

    await queryRunner.query(`
            CREATE INDEX "IDX_books_fulltext_search_simple" ON "books" 
            USING gin(to_tsvector('simple', title || ' ' || author_name))
        `);
    await queryRunner.query(`DROP INDEX "public"."IDX_books_publication_year_genre"`);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_books_fulltext_search_simple"`,
    );

    await queryRunner.query(`
            CREATE INDEX "IDX_books_fulltext_search" ON "books" 
            USING gin(to_tsvector('english', title || ' ' || author_name))
        `);

    await queryRunner.query(`CREATE INDEX "IDX_books_publication_year_genre" ON "books" ("genre", "publicationYear") `);

  }
}
