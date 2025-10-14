import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDatabaseIndexes1760472172896 implements MigrationInterface {
    name = 'AddDatabaseIndexes1760472172896'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_233485dfe62fd31abbf1f7f69d" ON "authors" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_6c64b3df09e6774438aeca7e0b" ON "authors" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_bf20a3d4cdb6c6218a4e7c59ae" ON "books" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_c7760822496bddacef8771f44b" ON "books" ("publicationYear", "genre") `);
        await queryRunner.query(`CREATE INDEX "IDX_9fa6a6592d8a855b70df6e3b3d" ON "books" ("title", "genre") `);
        await queryRunner.query(`CREATE INDEX "IDX_1056dbee4616479f7d562c562d" ON "books" ("author_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_72634969ce50bf7efbe4292ccd" ON "books" ("publicationYear") `);
        await queryRunner.query(`CREATE INDEX "IDX_6f50357a540439c8d17050c830" ON "books" ("genre") `);
        await queryRunner.query(`CREATE INDEX "IDX_3cd818eaf734a9d8814843f119" ON "books" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_e11e649824a45d8ed01d597fd9" ON "user" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_b680b98bcf359141ab1877de68" ON "user" ("status", "role") `);
        await queryRunner.query(`CREATE INDEX "IDX_6620cd026ee2b231beac7cfe57" ON "user" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d44ccf43b8a0d6b9978affb88" ON "user" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_e12875dfb3b1d92d7d7c5377e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d44ccf43b8a0d6b9978affb88"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6620cd026ee2b231beac7cfe57"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b680b98bcf359141ab1877de68"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e11e649824a45d8ed01d597fd9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3cd818eaf734a9d8814843f119"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6f50357a540439c8d17050c830"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_72634969ce50bf7efbe4292ccd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1056dbee4616479f7d562c562d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9fa6a6592d8a855b70df6e3b3d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c7760822496bddacef8771f44b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf20a3d4cdb6c6218a4e7c59ae"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6c64b3df09e6774438aeca7e0b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_233485dfe62fd31abbf1f7f69d"`);
    }

}
