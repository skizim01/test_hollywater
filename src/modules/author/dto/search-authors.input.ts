import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsInt,
  ValidateNested,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';



@InputType()
export class SearchAuthorsInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  query?: string;

}
