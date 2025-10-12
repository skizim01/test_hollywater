import { get } from '@nestled/config/lib/validate';
import DatabaseLogger from '../database/database.logger';
import { CustomNamingStrategy } from './naming.strategy';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();
export const getTypeORMConfig = (): DataSourceOptions => {
  const isNeedToProvideSslOptions = get('DATABASE_URL').asString();
  const extra = !!isNeedToProvideSslOptions
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {};

  return {
    type: 'postgres',
    port: get('POSTGRES_PORT').required().asPortNumber() || 5433,
    host: get('DB_HOST').required().asString(),
    username: get('POSTGRES_USER').required().asString(),
    password: get('POSTGRES_PASSWORD').required().asString(),
    database: get('POSTGRES_DB').required().asString(),
    synchronize: false,
    logger: new DatabaseLogger(),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*.{js,ts}'],
    ssl: !!isNeedToProvideSslOptions,
    extra,
    namingStrategy: new CustomNamingStrategy(),
  };
};

const dataSource = new DataSource(getTypeORMConfig());
export default dataSource;
