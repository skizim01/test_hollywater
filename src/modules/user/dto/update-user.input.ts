import { CreateUserInput } from './create-user.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsString, IsUUID } from 'class-validator';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => String)
  @IsUUID('4')
  id: string;

  @Field(() => Boolean)
  @IsBoolean()
  status?: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  newPassword?: string;

  @Field(() => String, { nullable: true })
  @IsEmail()
  newEmail?: string;
}
