import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseService } from '../baseModule/base.service';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(private userRepository: UserRepository) {
    super(userRepository);
  }

  async createUser(request: CreateUserInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(request.password, 10);
    const existingUser = await this.userRepository.findOne({
      where: { email: request.email },
    });
    if (existingUser) {
      throw new BadRequestException('User already registered');
    }
    return this.userRepository.create({ ...request, password: hashedPassword });
  }

  async updateUser(request: UpdateUserInput): Promise<User> {
    const user = await this.userRepository.findOneOrFail({
      select: ['password'],
      where: {
        id: request.id,
      },
    });

    if (request.password && request.newPassword) {
      const passwordValid = await bcrypt.compare(
        request.password,
        user.password,
      );
      if (passwordValid) {
        request.password = await bcrypt.hash(request.newPassword, 10);
        delete request.newPassword;
      } else {
        throw new BadRequestException('Wrong input');
      }
    }

    if (request.email && request.newEmail) {
      const isValid = request.email === user.email;
      if (isValid) {
        const userWithEmail = await this.userRepository.findOne({
          where: { email: request.newEmail },
        });
        if (userWithEmail) {
          throw new BadRequestException('Wrong input');
        }
        request.email = request.newEmail;
        delete request.newEmail;
      }
    }

    return this.userRepository.update({ ...user, ...request });
  }

  async deleteUser(id: string): Promise<User> {
    const user = await this.getUser(id);
    await this.userRepository.update({ ...user, status: false });
    return this.userRepository.delete({ id });
  }

  async getUser(id: string): Promise<User> {
    return this.userRepository.findOneOrFail({ where: { id } });
  }

  async getUsers(): Promise<User[]> {
    return this.userRepository.find({});
  }
}
