import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Book } from '../entities/book.entity';
import { SearchBooksInput } from '../dto/search-books.input';
import { SearchBooksResult } from '../dto/search-result.dto';
import { CreateBookInput } from '../dto/create-book.input';
import { UpdateBookInput } from '../dto/update-book.input';
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
      await this.applyGinTextSearch(queryBuilder, searchInput.query);
    }

    if (searchInput.filters) {
      this.applyFilters(queryBuilder, searchInput.filters);
    }

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [total, books] = await Promise.all([
      queryBuilder.getCount(),
      await queryBuilder.getMany(),
    ]);

    return {
      books,
      total,
      page,
      limit,
    };
  }

  async searchBooksWithoutGin(
    searchInput: SearchBooksInput,
    page = 1,
    limit = 20,
  ): Promise<SearchBooksResult> {
    const queryBuilder = this.createSearchQueryBuilder();

    if (searchInput.query) {
      this.applyIlikeTextSearch(queryBuilder, searchInput.query);
    }

    if (searchInput.filters) {
      this.applyFilters(queryBuilder, searchInput.filters);
    }

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [total, books] = await Promise.all([
      queryBuilder.getCount(),
      await queryBuilder.getMany(),
    ]);

    return {
      books,
      total,
      page,
      limit,
    };
  }

  private applyGinTextSearch(
    queryBuilder: SelectQueryBuilder<Book>,
    query: string,
  ): void {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    const tsQuery = this.prepareTsQueryWithPrefixes(cleanQuery);
    const parameters: Record<string, string> = { tsQuery };

    const ginCondition = `to_tsvector('simple', book.title || ' ' || book.authorName) @@ to_tsquery('simple', :tsQuery)`;

    queryBuilder.andWhere(ginCondition, parameters);

    queryBuilder.addSelect(
      `ts_rank(to_tsvector('simple', book.title || ' ' || book.authorName), to_tsquery('simple', :tsQuery))`,
      'relevance',
    );

    queryBuilder.orderBy('relevance', 'DESC');
    queryBuilder.addOrderBy('book.title', 'ASC');
  }

  private createSearchQueryBuilder(): SelectQueryBuilder<Book> {
    return this.createQueryBuilder('book').orderBy('book.title', 'ASC');
  }

  private applyIlikeTextSearch(
    queryBuilder: SelectQueryBuilder<Book>,
    query: string,
  ): void {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    const words = cleanQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    const parameters: Record<string, string> = {};
    const conditions: string[] = [];

    words.forEach((word, index) => {
      const paramName = `word${index}`;
      const searchTerm = `%${word}%`;
      parameters[paramName] = searchTerm;

      conditions.push(
        `(book.title ILIKE :${paramName} OR book.authorName ILIKE :${paramName})`,
      );
    });

    if (conditions.length > 0) {
      const searchCondition = conditions.join(' OR ');
      queryBuilder.andWhere(`(${searchCondition})`, parameters);
    }
    queryBuilder.orderBy('book.title', 'ASC');
  }

  private prepareTsQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => {
        const cleanWord = word.replace(/[^\w]/g, '');
        return cleanWord.length > 0 ? `${cleanWord}:*` : '';
      })
      .filter((term) => term.length > 0)
      .join(' & ');
  }

  private prepareTsQueryWithPrefixes(query: string): string {
    const words = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    const terms: string[] = [];

    words.forEach((word) => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 0) {
        terms.push(`${cleanWord}:*`);
      }
    });

    return terms.join(' | ');
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

  async findByIdWithAuthor(id: number): Promise<Book | null> {
    return this.createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .where('book.id = :id', { id })
      .getOne();
  }

  async findByAuthor(authorId: number): Promise<Book[]> {
    return this.createQueryBuilder('book')
      .where('book.authorId = :authorId', { authorId })
      .getMany();
  }

  async findByGenre(genre: string): Promise<Book[]> {
    return this.createQueryBuilder('book')
      .where('book.genre = :genre', { genre })
      .getMany();
  }

  async getStatistics(): Promise<{
    totalBooks: number;
    booksByGenre: Record<string, number>;
    averagePublicationYear: number;
    mostRecentBook: string;
    oldestBook: string;
  }> {
    const totalBooks = await this.count();

    const booksByGenre = await this.createQueryBuilder('book')
      .select('book.genre', 'genre')
      .addSelect('COUNT(*)', 'count')
      .groupBy('book.genre')
      .getRawMany();

    const genreStats = booksByGenre.reduce((acc, item) => {
      acc[item.genre] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    const yearStats = await this.createQueryBuilder('book')
      .select('AVG(book.publicationYear)', 'avgYear')
      .addSelect('MAX(book.publicationYear)', 'maxYear')
      .addSelect('MIN(book.publicationYear)', 'minYear')
      .getRawOne();

    const mostRecentBook = await this.createQueryBuilder('book')
      .select('book.title', 'title')
      .where('book.publicationYear = :maxYear', { maxYear: yearStats.maxYear })
      .limit(1)
      .getRawOne();

    const oldestBook = await this.createQueryBuilder('book')
      .select('book.title', 'title')
      .where('book.publicationYear = :minYear', { minYear: yearStats.minYear })
      .limit(1)
      .getRawOne();

    return {
      totalBooks,
      booksByGenre: genreStats,
      averagePublicationYear: Math.round(parseFloat(yearStats.avgYear) || 0),
      mostRecentBook: mostRecentBook?.title || '',
      oldestBook: oldestBook?.title || '',
    };
  }

  async createBook(
    createBookInput: CreateBookInput,
    authorName: string,
  ): Promise<Book> {
    const book = this.create({
      ...createBookInput,
      authorName,
    });

    return this.save(book);
  }

  async updateBook(
    updateBookInput: UpdateBookInput,
    authorName?: string,
  ): Promise<Book> {
    const { id, ...updateData } = updateBookInput;

    const updatePayload: Partial<Book> = { ...updateData };
    if (authorName) {
      updatePayload.authorName = authorName;
    }

    await this.update(id, updatePayload);

    const updatedBook = await this.findOne({ where: { id } });
    if (!updatedBook) {
      throw new Error(`Book with ID ${id} not found`);
    }

    return updatedBook;
  }
}
