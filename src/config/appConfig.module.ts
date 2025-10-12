import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestled/config';
import { getTypeORMConfig } from './orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [getTypeORMConfig],
    }),
  ],
})
export class AppConfigModule {}
