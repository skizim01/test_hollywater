import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserService } from '../../user/user.service';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthUserGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const secret = process.env.JWT_SECRET;
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('User is not found.');
    }

    let tokenData;
    try {
      tokenData = await jwt.verify(token, secret);
    } catch (e) {
      throw new UnauthorizedException(e);
    }

    const user = await this.userService.findOne({
      where: { email: tokenData.sub },
    });

    if (user) {
      request.user = user;
      return true;
    }
    return false;
  }
}
