import { InputType, Field, Int } from '@nestjs/graphql';
import { GenreEnum } from '../entities/book.entity';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  ValidateNested,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class PublicationYearRange {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  from?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  to?: number;
}

@InputType()
export class BookFilters {
  @Field(() => GenreEnum, { nullable: true })
  @IsOptional()
  @IsEnum(GenreEnum)
  genre?: GenreEnum;

  @Field(() => PublicationYearRange, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PublicationYearRange)
  publicationYear?: PublicationYearRange;
}

@InputType()
export class SearchBooksInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  query?: string;

  @Field(() => BookFilters, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => BookFilters)
  filters?: BookFilters;
}
