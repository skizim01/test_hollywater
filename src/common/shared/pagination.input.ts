import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class Pagination {
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  offset?: number;

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  @IsOptional()
  limit?: number;
}
