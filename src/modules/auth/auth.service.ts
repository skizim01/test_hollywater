import { JwtService } from '@nestjs/jwt';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as uuid from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {
    this.validateEnvironmentVariables();
  }

  private validateEnvironmentVariables(): void {
    const requiredEnvVars = ['JWT_EXPIRE_IN'];
    const missingVars: string[] = [];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      const errorMessage = `Missing required environment variables: ${missingVars.join(
        ', ',
      )}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Validate JWT_EXPIRE_IN is a valid number
    const jwtExpireIn = Number(process.env.JWT_EXPIRE_IN);
    if (isNaN(jwtExpireIn) || jwtExpireIn <= 0) {
      const errorMessage = 'JWT_EXPIRE_IN must be a positive number';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    this.logger.log('Environment variables validation passed');
  }

  async login(email: string, password: string) {
    const user = await this.userService.findOne({
      where: { email, status: true },
      select: ['password', 'email', 'status', 'role', 'id'],
    });

    if (!user) {
      throw new NotFoundException('User is not found');
    }

    const validatePassword = await this.validatePassword(
      password,
      user.password,
    );

    if (!validatePassword) {
      throw new UnauthorizedException('Login was not Successful');
    }

    const jwtExpireIn = Number(process.env.JWT_EXPIRE_IN);
    const payload = {
      userId: user.id,
      role: user.role,
      sub: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + jwtExpireIn,
      jti: uuid.v4(),
    };

    const refresh = this.jwtService.sign({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 24 * 7,
    });
    await this.userService.update({ ...user, token: refresh });
    const access = this.jwtService.sign(payload);
    return { access: access, session: refresh };
  }

  async refresh(oldToken: string) {
    let decoded;
    try {
      decoded = await this.jwtService.verify(oldToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.userService.findOne({
      where: { id: decoded.userId, status: true, token: oldToken },
      select: ['password', 'email', 'status', 'role', 'id'],
    });

    if (!user) {
      throw new NotFoundException('User is not found');
    }

    const jwtExpireIn = Number(process.env.JWT_EXPIRE_IN);
    const payload = {
      userId: user.id,
      role: user.role,
      sub: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + jwtExpireIn,
      jti: uuid.v4(),
    };

    const refresh = this.jwtService.sign({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 24 * 7,
    });
    await this.userService.update({ ...user, token: refresh });
    const access = this.jwtService.sign(payload);
    return { access: access, session: refresh };
  }

  async validateUser(payload: { sub: string }): Promise<User | undefined> {
    return await this.userService.findOne({ where: { email: payload.sub } });
  }

  validatePassword(
    password: string,
    storedPasswordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, storedPasswordHash);
  }
}
