import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Author } from '../entities/author.entity';

@ObjectType()
export class SearchAuthorsResult {
  @Field(() => [Author])
  authors: Author[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}
