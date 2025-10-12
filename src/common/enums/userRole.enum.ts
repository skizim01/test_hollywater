import { registerEnumType } from '@nestjs/graphql';

export enum Role {
  WRITER = 'Writer',
  MODERATOR = 'Moderator',
}

registerEnumType(Role, {
  name: 'Role',
  description: 'Users roles',
});
