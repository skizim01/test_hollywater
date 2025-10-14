import { Injectable } from '@nestjs/common';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
import { CrudRepository, TransactionOptions } from './base.repository';

@Injectable()
export class BaseService<T extends ObjectLiteral> {
  constructor(protected readonly repository: CrudRepository<T>) {}

  async findOne(options: FindOneOptions<T>): Promise<T | undefined> {
    return this.repository.findOne(options);
  }

  async find(options: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findOneOrFail(options: FindManyOptions<T>): Promise<T> {
    return this.repository.findOneOrFail(options);
  }

  async findAndCount(options: FindManyOptions<T>): Promise<[T[], number]> {
    return this.repository.findAndCount(options);
  }

  async create(
    entity: DeepPartial<T>,
    tOptions?: TransactionOptions<T>,
  ): Promise<T> {
    return this.repository.create(entity, tOptions);
  }

  async update(
    entity: DeepPartial<T>,
    tOptions?: TransactionOptions<T>,
  ): Promise<T> {
    return this.repository.update(entity, tOptions);
  }

  async delete(where: FindOptionsWhere<T>): Promise<T> {
    return this.repository.delete(where);
  }

  async hardDelete(where: FindOptionsWhere<T>): Promise<number> {
    return this.repository.hardDelete(where);
  }
}
