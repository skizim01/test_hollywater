import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => User)
  createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> {
    return this.userService.createUser(createUserInput);
  }

  @Mutation(() => User)
  updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ): Promise<User> {
    return this.userService.updateUser(updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => String }) id: string): Promise<User> {
    return this.userService.deleteUser(id);
  }

  @Query(() => User, { name: 'userById' })
  findOneUser(@Args('id', { type: () => String }) id: string): Promise<User> {
    return this.userService.getUser(id);
  }

  @Query(() => [User], { name: 'users' })
  findAllUsers() {
    return this.userService.getUsers();
  }
}
