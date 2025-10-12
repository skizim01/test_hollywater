import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RoleGuard } from '../../modules/auth/guards/role.guard';
import { AuthUserGuard } from '../../modules/auth/guards/authUser.guard';

export function AuthPermission(...roles: string[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthUserGuard, RoleGuard),
  );
}
