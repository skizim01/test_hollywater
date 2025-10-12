import { Field, ObjectType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { Ordering } from '../../enums/ordering.enum';

@ObjectType()
export class SortingObject {
  @Field(() => String, { nullable: true, defaultValue: 'createdAt' })
  @IsOptional()
  field?: string;

  @Field(() => Ordering, { nullable: true, defaultValue: Ordering.DESC })
  @IsOptional()
  order?: Ordering;
}
