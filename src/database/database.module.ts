import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeORMConfig } from '../config/orm.config';

@Module({
  imports: [TypeOrmModule.forRoot(getTypeORMConfig())],
})
export class DatabaseModule {}
