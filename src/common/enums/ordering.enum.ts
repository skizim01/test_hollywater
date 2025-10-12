import { registerEnumType } from '@nestjs/graphql';

export enum Ordering {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(Ordering, {
  name: 'Ordering',
  description: 'Order direction',
});
