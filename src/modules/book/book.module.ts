import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookService } from './book.service';
import { BookResolver } from './book.resolver';
import { Book } from './entities/book.entity';
import { Author } from '../author/entities/author.entity';
import { BookRepository } from './repository/book.repository';
import { CacheModule } from '../cache/cache.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { AuthorModule } from '../author/author.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, Author]),
    CacheModule,
    RateLimitModule,
    AuthorModule,
  ],
  providers: [BookService, BookResolver, BookRepository],
  exports: [BookService, BookRepository],
})
export class BookModule {}
