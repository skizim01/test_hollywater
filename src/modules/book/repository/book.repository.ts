import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Book } from '../entities/book.entity';
import { Author } from '../../author/entities/author.entity';
import { SearchBooksInput } from '../dto/search-books.input';
import { SearchBooksResult } from '../dto/search-result.dto';
import { GenreEnum } from '../entities/book.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BookRepository extends Repository<Book> {
  constructor(private dataSource: DataSource) {
    super(Book, dataSource.createEntityManager());
  }

  async searchBooks(
    searchInput: SearchBooksInput,
    page = 1,
    limit = 20,
  ): Promise<SearchBooksResult> {
    const queryBuilder = this.createSearchQueryBuilder();

    if (searchInput.query) {
      this.applyTextSearch(queryBuilder, searchInput.query);
    }

    if (searchInput.filters) {
      this.applyFilters(queryBuilder, searchInput.filters);
    }

    const total = await queryBuilder.getCount();

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const books = await queryBuilder.getMany();

    return {
      books,
      total,
      page,
      limit,
    };
  }

  private createSearchQueryBuilder(): SelectQueryBuilder<Book> {
    return this.createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .orderBy('book.title', 'ASC');
  }

  private applyTextSearch(
    queryBuilder: SelectQueryBuilder<Book>,
    query: string,
  ): void {
    const searchTerm = `%${query.toLowerCase()}%`;

    queryBuilder.andWhere(
      '(LOWER(book.title) LIKE :searchTerm OR LOWER(author.name) LIKE :searchTerm)',
      { searchTerm },
    );
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Book>,
    filters: SearchBooksInput['filters'],
  ): void {
    if (filters.genre) {
      queryBuilder.andWhere('book.genre = :genre', { genre: filters.genre });
    }

    if (filters.publicationYear) {
      const { from, to } = filters.publicationYear;

      if (from !== undefined && to !== undefined) {
        queryBuilder.andWhere(
          'book.publicationYear BETWEEN :fromYear AND :toYear',
          { fromYear: from, toYear: to },
        );
      } else if (from !== undefined) {
        queryBuilder.andWhere('book.publicationYear >= :fromYear', {
          fromYear: from,
        });
      } else if (to !== undefined) {
        queryBuilder.andWhere('book.publicationYear <= :toYear', {
          toYear: to,
        });
      }
    }
  }

  async findAllWithPagination(
    page = 1,
    limit = 20,
  ): Promise<SearchBooksResult> {
    const queryBuilder = this.createSearchQueryBuilder();

    const total = await queryBuilder.getCount();
    const offset = (page - 1) * limit;

    const books = await queryBuilder.skip(offset).take(limit).getMany();

    return {
      books,
      total,
      page,
      limit,
    };
  }

  async findByIdWithAuthor(id: number): Promise<Book | undefined> {
    return this.findOne({
      where: { id },
      relations: ['author'],
    });
  }

  async findByAuthorId(authorId: number): Promise<Book[]> {
    return this.find({
      where: { author: { id: authorId } },
      relations: ['author'],
      order: { title: 'ASC' },
    });
  }

  async findByGenre(genre: GenreEnum): Promise<Book[]> {
    return this.find({
      where: { genre },
      relations: ['author'],
      order: { title: 'ASC' },
    });
  }

  async getStatistics(): Promise<{
    totalBooks: number;
    booksByGenre: Record<string, number>;
    booksByYear: Record<string, number>;
    totalAuthors: number;
  }> {
    const totalBooks = await this.count();
    const totalAuthors = await this.dataSource.getRepository(Author).count();

    const genreStats = await this.createQueryBuilder('book')
      .select('book.genre', 'genre')
      .addSelect('COUNT(*)', 'count')
      .groupBy('book.genre')
      .getRawMany();

    const booksByGenre = genreStats.reduce((acc, stat) => {
      acc[stat.genre] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    const currentYear = new Date().getFullYear();
    const yearStats = await this.createQueryBuilder('book')
      .select('book.publicationYear', 'year')
      .addSelect('COUNT(*)', 'count')
      .where('book.publicationYear >= :startYear', {
        startYear: currentYear - 10,
      })
      .groupBy('book.publicationYear')
      .orderBy('book.publicationYear', 'DESC')
      .getRawMany();

    const booksByYear = yearStats.reduce((acc, stat) => {
      acc[stat.year] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBooks,
      booksByGenre,
      booksByYear,
      totalAuthors,
    };
  }
}
