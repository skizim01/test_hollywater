import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  QueryBuilder,
  QueryRunner,
  Repository,
} from 'typeorm';
import { BadRequestException, Logger } from '@nestjs/common';

export type TransactionOptions<T extends ObjectLiteral> = {
  repository?: Repository<T>;
  qr: QueryRunner;
};

export abstract class CrudRepository<T extends ObjectLiteral> {
  protected readonly logger = new Logger('Crud Repository');

  protected constructor(protected readonly repository: Repository<T>) {}

  async findOne(
    options: FindOneOptions<T>,
    repository?: Repository<T>,
  ): Promise<T | undefined> {
    const service = repository || this.repository;
    const result = await service.findOne({ ...options });
    return result ?? undefined;
  }

  async find(
    options: FindManyOptions<T>,
    repository?: Repository<T>,
  ): Promise<T[]> {
    const service = repository || this.repository;
    return service.find({ ...options });
  }

  async findOneOrFail(
    options: FindManyOptions<T>,
    repository?: Repository<T>,
  ): Promise<T> {
    const service = repository || this.repository;
    const result = await service.findOne({ ...options });
    if (!result) {
      throw new BadRequestException(
        `Entity ${service.metadata.name}. Not found`,
      );
    }
    return result;
  }

  async findAndCount(
    options: FindManyOptions<T>,
    repository?: Repository<T>,
  ): Promise<[T[], number]> {
    const service = repository || this.repository;
    return service.findAndCount({ ...options });
  }

  async create(
    entity: DeepPartial<T>,
    tOptions?: TransactionOptions<T>,
  ): Promise<T> {
    const service = tOptions?.repository || this.repository;
    const qb = service.createQueryBuilder('create', tOptions?.qr);
    const rawEntity = service.create(entity);
    const insert = await qb
      .insert()
      .into(service.target)
      .values(rawEntity)
      .updateEntity(true)
      .returning('*')
      .execute();

    return service.findOneOrFail({ where: { id: insert.identifiers[0].id } });
  }

  async createTransaction(
    entity: DeepPartial<T>,
    tOptions?: TransactionOptions<T>,
  ): Promise<T> {
    const service = tOptions?.repository || this.repository;
    const qb = service.createQueryBuilder('create', tOptions?.qr);
    const rawEntity = service.create(entity);
    const insert = await qb
      .insert()
      .into(service.target)
      .values(rawEntity)
      .updateEntity(true)
      .returning('*')
      .execute();

    return insert.generatedMaps[0] as T;
  }

  private async updateQueryBuilder<Entity>(
    entity: DeepPartial<T>,
    qb: QueryBuilder<Entity>,
  ): Promise<T> {
    const reducedEntity = this.repository.create(entity);
    const update = await qb
      .update(this.repository.target)
      .set(reducedEntity)
      .updateEntity(true)
      .whereEntity(reducedEntity)
      .returning('*')
      .execute();

    return this.repository.findOneOrFail({
      where: { id: update.generatedMaps[0].id },
    });
  }

  async update(
    entity: DeepPartial<T>,
    tOptions?: TransactionOptions<T>,
  ): Promise<T> {
    const service = tOptions?.repository || this.repository;
    const qb = service.createQueryBuilder('update', tOptions?.qr);
    return this.updateQueryBuilder(entity, qb);
  }

  async delete(
    where: FindOptionsWhere<T>,
    repository?: Repository<T>,
  ): Promise<T> {
    const service = repository || this.repository;
    const _result = await service.softDelete(where);

    return this.findOneOrFail({ where, withDeleted: true });
  }

  async restore(
    where: FindOptionsWhere<T>,
    repository?: Repository<T>,
  ): Promise<T> {
    const service = repository || this.repository;
    const _result = await service.restore(where);

    return this.findOneOrFail({ where, withDeleted: false });
  }

  async hardDelete(
    where: FindOptionsWhere<T>,
    repository?: Repository<T>,
  ): Promise<number> {
    const service = repository || this.repository;
    const result = await service.delete(where);
    return result.affected ?? 0;
  }

  createQueryRunner(repository?: Repository<T>): QueryRunner {
    const service = repository || this.repository;
    return service.manager.connection.createQueryRunner();
  }
}
