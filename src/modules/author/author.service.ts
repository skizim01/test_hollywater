import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from './entities/author.entity';
import { Book } from '../book/entities/book.entity';
import { AuthorRepository } from './repository/author.repository';

@Injectable()
export class AuthorService {
  constructor(
    private readonly authorRepository: AuthorRepository,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async findAll(): Promise<Author[]> {
    return this.authorRepository.findAllWithBooks();
  }

  async findOne(id: number): Promise<Author> {
    const author = await this.authorRepository.findByIdWithBooks(id);

    if (!author) {
      throw new Error(`Author with ID ${id} not found`);
    }

    return author;
  }

  async findByName(name: string): Promise<Author[]> {
    return this.authorRepository.findByName(name);
  }

  async findWithBookCount(): Promise<Array<Author & { bookCount: number }>> {
    return this.authorRepository.findWithBookCount();
  }

  async getStatistics(): Promise<{
    totalAuthors: number;
    authorsWithBooks: number;
    averageBooksPerAuthor: number;
    mostProlificAuthor: string;
  }> {
    return this.authorRepository.getStatistics();
  }
}
