import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Book } from '../entities/book.entity';

@ObjectType()
export class SearchBooksResult {
  @Field(() => [Book])
  books: Book[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}
