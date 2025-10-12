import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@ObjectType()
export class PaginationObject {
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  offset?: number;

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  @IsOptional()
  limit?: number;
}
