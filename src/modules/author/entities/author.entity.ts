import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Book } from '../../book/entities/book.entity';

@ObjectType()
@Entity('authors')
@Index(['name']) // Індекс для пошуку по імені автора
@Index(['createdAt']) // Індекс для сортування по даті створення
export class Author {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;
  @Field(() => String)
  @Column()
  name: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  bio?: string;

  @Field(() => [Book], { nullable: true })
  @OneToMany(() => Book, (book) => book.author)
  books: Book[];

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
