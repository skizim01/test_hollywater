import { Injectable, Logger } from '@nestjs/common';
import { Book, GenreEnum } from './entities/book.entity';
import { SearchBooksInput } from './dto/search-books.input';
import { SearchBooksResult } from './dto/search-result.dto';
import { CacheService } from '../cache/cache.service';
import { BookRepository } from './repository/book.repository';

@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);

  constructor(
    private readonly bookRepository: BookRepository,
    private readonly cacheService: CacheService,
  ) {}

  async searchBooks(
    searchInput: SearchBooksInput,
    page = 1,
    limit = 20,
  ): Promise<SearchBooksResult> {
    const cachedResult = await this.cacheService.getSearchResults(
      searchInput,
      page,
      limit,
    );

    if (cachedResult) {
      this.logger.debug('Returning cached search results');
      return cachedResult;
    }

    const result = await this.bookRepository.searchBooks(
      searchInput,
      page,
      limit,
    );

    await this.cacheService.setSearchResults(searchInput, page, limit, result);

    return result;
  }

  async findAll(page = 1, limit = 20): Promise<SearchBooksResult> {
    return this.bookRepository.findAllWithPagination(page, limit);
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.bookRepository.findByIdWithAuthor(id);

    if (!book) {
      throw new Error(`Book with ID ${id} not found`);
    }

    return book;
  }

  async findByAuthor(authorId: number): Promise<Book[]> {
    return this.bookRepository.findByAuthorId(authorId);
  }

  async findByGenre(genre: GenreEnum): Promise<Book[]> {
    return this.bookRepository.findByGenre(genre);
  }

  async getStatistics(): Promise<{
    totalBooks: number;
    booksByGenre: Record<string, number>;
    booksByYear: Record<string, number>;
    totalAuthors: number;
  }> {
    return this.bookRepository.getStatistics();
  }
}
