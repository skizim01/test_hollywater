import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

@InputType()
export class CreateAuthorInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bio?: string;
}
