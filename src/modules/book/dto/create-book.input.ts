import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsPositive,
  IsEnum,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { GenreEnum } from '../entities/book.entity';

@InputType()
export class CreateBookInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @Field(() => GenreEnum, { nullable: true })
  @IsEnum(GenreEnum)
  @IsOptional()
  genre?: GenreEnum;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  @Min(1000)
  @Max(new Date().getFullYear())
  publicationYear?: number;

  @Field(() => Int)
  @IsInt()
  @IsPositive()
  authorId: number;
}
