import {
  CreateDateColumn,
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';

import { Author } from '../../author/entities/author.entity';

export enum GenreEnum {
  FICTION = 'Fiction',
  NON_FICTION = 'Non-Fiction',
  SCIENCE = 'Science',
  HISTORY = 'History',
}

registerEnumType(GenreEnum, {
  name: 'GenreEnum',
  description: 'Book genre enumeration',
});

@ObjectType()
@Entity('books')
@Index(['title']) // Індекс для пошуку по назві книги
@Index(['genre']) // Індекс для фільтрації по жанру
@Index(['publicationYear']) // Індекс для фільтрації по року публікації
@Index(['author']) // Індекс для пошуку по автору
@Index(['title', 'genre']) // Складений індекс для пошуку по назві та жанру
@Index(['publicationYear', 'genre']) // Складений індекс для фільтрації по року та жанру
@Index(['createdAt']) // Індекс для сортування по даті створення
export class Book {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;
  @Field(() => String)
  @Column()
  title: string;

  @Field(() => GenreEnum, { nullable: true })
  @Column({
    type: 'enum',
    enum: GenreEnum,
    nullable: true,
  })
  genre: GenreEnum;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  publicationYear?: number;

  @Field(() => Author)
  @ManyToOne(() => Author, (author) => author.books, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: Author;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
