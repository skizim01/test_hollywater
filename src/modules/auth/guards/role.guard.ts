import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../user/entities/user.entity';
import { Role } from '../../../common/enums/userRole.enum';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles.length) {
      return true;
    }
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user: User = request.user;
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}
