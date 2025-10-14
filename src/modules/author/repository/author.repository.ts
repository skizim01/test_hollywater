import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Author } from '../entities/author.entity';

@Injectable()
export class AuthorRepository extends Repository<Author> {
  constructor(private dataSource: DataSource) {
    super(Author, dataSource.createEntityManager());
  }

  async findByName(name: string): Promise<Author[]> {
    return this.createQueryBuilder('author')
      .leftJoinAndSelect('author.books', 'books')
      .where('LOWER(author.name) LIKE LOWER(:name)', { name: `%${name}%` })
      .orderBy('author.name', 'ASC')
      .getMany();
  }

  async findWithBookCount(): Promise<Array<Author & { bookCount: number }>> {
    const authors = await this.createQueryBuilder('author')
      .leftJoin('author.books', 'books')
      .select('author.id', 'id')
      .addSelect('author.name', 'name')
      .addSelect('author.bio', 'bio')
      .addSelect('author.createdAt', 'createdAt')
      .addSelect('author.updatedAt', 'updatedAt')
      .addSelect('COUNT(books.id)', 'bookCount')
      .groupBy('author.id')
      .orderBy('bookCount', 'DESC')
      .getRawMany();

    return authors.map((author) => ({
      ...author,
      bookCount: parseInt(author.bookCount),
    }));
  }

  async getStatistics(): Promise<{
    totalAuthors: number;
    authorsWithBooks: number;
    averageBooksPerAuthor: number;
    mostProlificAuthor: string;
  }> {
    const totalAuthors = await this.count();

    const authorsWithBooks = await this.createQueryBuilder('author')
      .leftJoin('author.books', 'books')
      .where('books.id IS NOT NULL')
      .getCount();

    const averageBooksResult = await this.createQueryBuilder('author')
      .leftJoin('author.books', 'books')
      .select('AVG(book_count)', 'avgBooks')
      .from((subQuery) => {
        return subQuery
          .select('author.id', 'authorId')
          .addSelect('COUNT(books.id)', 'book_count')
          .from(Author, 'author')
          .leftJoin('author.books', 'books')
          .groupBy('author.id');
      }, 'stats')
      .getRawOne();

    const mostProlificAuthorResult = await this.createQueryBuilder('author')
      .leftJoin('author.books', 'books')
      .select('author.name', 'name')
      .addSelect('COUNT(books.id)', 'bookCount')
      .groupBy('author.id')
      .orderBy('bookCount', 'DESC')
      .limit(1)
      .getRawOne();

    return {
      totalAuthors,
      authorsWithBooks,
      averageBooksPerAuthor: parseFloat(averageBooksResult?.avgBooks || '0'),
      mostProlificAuthor: mostProlificAuthorResult?.name || 'N/A',
    };
  }

  async findByIdWithBooks(id: number): Promise<Author | null> {
    return this.findOne({
      where: { id },
      relations: ['books'],
    });
  }

  async findAllWithBooks(): Promise<Author[]> {
    return this.find({
      relations: ['books'],
      order: { name: 'ASC' },
    });
  }
}
