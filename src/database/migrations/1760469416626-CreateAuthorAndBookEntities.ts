import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthorAndBookEntities1760469416626
  implements MigrationInterface
{
  name = 'CreateAuthorAndBookEntities1760469416626';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "authors" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "bio" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d2ed02fabd9b52847ccb85e6b88" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."books_genre_enum" AS ENUM('Fiction', 'Non-Fiction', 'Science', 'History')`,
    );
    await queryRunner.query(
      `CREATE TABLE "books" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "genre" "public"."books_genre_enum", "publicationYear" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "author_id" integer, CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ADD CONSTRAINT "books_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "books_author_id_fkey"`,
    );
    await queryRunner.query(`DROP TABLE "books"`);
    await queryRunner.query(`DROP TYPE "public"."books_genre_enum"`);
    await queryRunner.query(`DROP TABLE "authors"`);
  }
}
