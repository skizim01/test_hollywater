import { ObjectType, Field } from '@nestjs/graphql';
import { BaseSchema } from '../../_baseModule/baseSchema.entity';
import { Column, Entity, Index } from 'typeorm';
import { Role } from '../../../common/enums/userRole.enum';

@ObjectType()
@Entity('user')
@Index(['email']) // Індекс для пошуку по email (вже є UNIQUE constraint, але додаємо явно)
@Index(['status']) // Індекс для фільтрації по статусу користувача
@Index(['role']) // Індекс для фільтрації по ролі користувача
@Index(['status', 'role']) // Складений індекс для фільтрації по статусу та ролі
@Index(['createdAt']) // Індекс для сортування по даті створення
export class User extends BaseSchema {
  @Column({ type: 'varchar', nullable: false })
  @Field(() => String)
  firstName: string;

  @Column({ type: 'varchar', nullable: false })
  @Field(() => String)
  lastName: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  @Field(() => String)
  email: string;

  @Column({ type: 'varchar', nullable: false, select: false })
  password: string;

  @Column({ type: 'boolean', default: false })
  @Field(() => Boolean)
  status: boolean;

  @Column({ type: 'varchar', nullable: true })
  @Field(() => String)
  token: string;

  @Column({ type: 'enum', enum: Role, default: Role.WRITER })
  @Field(() => Role)
  role: Role;
}
