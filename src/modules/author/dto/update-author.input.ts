import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsInt, IsPositive } from 'class-validator';
import { CreateAuthorInput } from './create-author.input';

@InputType()
export class UpdateAuthorInput extends PartialType(CreateAuthorInput) {
  @Field(() => Int)
  @IsInt()
  @IsPositive()
  id: number;
}
