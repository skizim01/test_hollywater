import { DefaultNamingStrategy, Table, NamingStrategyInterface } from 'typeorm';

export class CustomNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
    tableOrName =
      typeof tableOrName === 'string' ? tableOrName : tableOrName.name;

    return `${tableOrName}_${columnNames}_fkey`;
  }
}
