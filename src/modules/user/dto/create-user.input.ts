import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from '../../../common/enums/userRole.enum';

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsString()
  firstName!: string;

  @Field(() => String)
  @IsString()
  lastName!: string;

  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field(() => String)
  @IsString()
  password!: string;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  status!: boolean;

  @Field(() => Role, { defaultValue: Role.WRITER })
  @IsEnum(Role)
  role!: Role;
}
