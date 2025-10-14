import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorService } from './author.service';
import { AuthorResolver } from './author.resolver';
import { AuthorRepository } from './repository/author.repository';
import { Author } from './entities/author.entity';
import { Book } from '../book/entities/book.entity';
import { RateLimitModule } from '../rate-limit/rate-limit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Author, Book]), RateLimitModule],
  providers: [AuthorService, AuthorResolver, AuthorRepository],
  exports: [AuthorService, AuthorRepository],
})
export class AuthorModule {}
