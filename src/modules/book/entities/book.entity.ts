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
@Index(['publicationYear', 'genre'])
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

  @Field(() => Author, { nullable: true })
  @ManyToOne(() => Author, (author) => author.books, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author?: Author;

  @Column({ name: 'author_id' })
  authorId: number;

  @Field(() => String)
  @Column({ name: 'author_name' })
  authorName: string;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
