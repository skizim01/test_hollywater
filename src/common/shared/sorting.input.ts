import { Field, InputType } from '@nestjs/graphql';
import { Ordering } from '../enums/ordering.enum';
import { IsOptional } from 'class-validator';

@InputType()
export class Sorting {
  @Field(() => String, { nullable: true, defaultValue: 'createdAt' })
  @IsOptional()
  field?: string;

  @Field(() => Ordering, { nullable: true, defaultValue: Ordering.DESC })
  @IsOptional()
  order?: Ordering;
}
