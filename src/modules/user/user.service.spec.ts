import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';
import { mockRepository } from '../../../test/mock/mock.repository';
import { Role } from '../../common/enums/userRole.enum';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;

  const userPayload = {
    firstName: 'Test',
    lastName: 'Besicovitch',
    email: 'admin@example.com',
    password: '1234',
    status: true,
    role: Role.MODERATOR,
  };

  const userResponse = {
    ...userPayload,
    id: '3247aca5-4e16-4fa1-a1da-35203bb3313a',
    password: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create new User', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    mockRepository.findOne.mockResolvedValueOnce(null);
    mockRepository.create.mockResolvedValueOnce(userPayload);

    const result = await service.createUser(userPayload);

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { email: userPayload.email },
    });
    expect(mockRepository.create).toHaveBeenCalledWith({
      ...userPayload,
      password: 'hashedPassword',
    });
    expect(result).toEqual(userPayload);
  });

  it('should return bad request error', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    mockRepository.findOne.mockResolvedValueOnce(userPayload);
    mockRepository.findOne.mockResolvedValueOnce(userPayload);

    await expect(service.createUser(userPayload)).rejects.toThrow(
      BadRequestException,
    );

    await expect(service.createUser(userPayload)).rejects.toThrow(
      'User already registered',
    );

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { email: userPayload.email },
    });
  });

  it('should get user by id', async () => {
    mockRepository.findOneOrFail.mockResolvedValueOnce(userResponse);

    const result = await service.getUser(
      '3247aca5-4e16-4fa1-a1da-35203bb3313a',
    );
    expect(result).toEqual(userResponse);
  });

  it('should get all users', async () => {
    mockRepository.find.mockResolvedValueOnce([userResponse]);

    const result = await service.getUsers();
    expect(result).toEqual([userResponse]);
  });

  it('should soft delete user by id', async () => {
    const updatedUser = {
      ...userResponse,
      status: false,
    };
    mockRepository.findOneOrFail.mockResolvedValueOnce(userResponse);
    mockRepository.update.mockResolvedValueOnce(updatedUser);
    mockRepository.delete.mockResolvedValueOnce({
      ...updatedUser,
      deletedAt: '2023-08-12T16:04:23Z',
    });

    const result = await service.deleteUser(
      '3247aca5-4e16-4fa1-a1da-35203bb3313a',
    );
    expect(result).toEqual({
      ...updatedUser,
      deletedAt: '2023-08-12T16:04:23Z',
    });
  });

  it('should update user info with password and email address', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword23');

    const request = {
      ...userResponse,
      firstName: 'Updated',
      password: 'hashedPassword',
      newPassword: 'hashedPassword23',
      newEmail: 'test2@example.com',
    };

    const planedResult = {
      ...userResponse,
      firstName: 'Updated',
      password: 'hashedPassword23',
      email: 'test2@example.com',
    };
    delete planedResult.password;

    mockRepository.findOneOrFail.mockResolvedValueOnce({
      ...userResponse,
      password: 'hashedPassword',
    });
    mockRepository.findOne.mockResolvedValueOnce(null);
    mockRepository.update.mockResolvedValueOnce(planedResult);

    const result = await service.updateUser(request);
    expect(result).toEqual(planedResult);
  });

  it('should return bad request when comparing old passwords is falls', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    mockRepository.findOneOrFail.mockResolvedValueOnce({
      ...userResponse,
      password: 'hashedPassword',
    });
    mockRepository.findOneOrFail.mockResolvedValueOnce({
      ...userResponse,
      password: 'hashedPassword',
    });

    const request = {
      ...userResponse,
      firstName: 'Updated',
      password: 'wrong_password',
      newPassword: 'hashedPassword23',
      newEmail: 'test2@example.com',
    };

    await expect(service.updateUser(request)).rejects.toThrow(
      BadRequestException,
    );

    await expect(service.updateUser(request)).rejects.toThrow('Wrong input');
  });

  it('should return bad request when user with the same email (newEmail) exist', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword23');

    const request = {
      ...userResponse,
      firstName: 'Updated',
      password: 'hashedPassword',
      newPassword: 'hashedPassword23',
      newEmail: 'test2@example.com',
    };

    mockRepository.findOneOrFail.mockResolvedValueOnce({
      ...userResponse,
      password: 'hashedPassword',
    });
    mockRepository.findOne.mockResolvedValueOnce(userResponse);

    mockRepository.findOneOrFail.mockResolvedValueOnce({
      ...userResponse,
      password: 'hashedPassword',
    });
    mockRepository.findOne.mockResolvedValueOnce(userResponse);

    await expect(service.updateUser(request)).rejects.toThrow(
      BadRequestException,
    );

    await expect(service.updateUser(request)).rejects.toThrow('Wrong input');
  });
});
