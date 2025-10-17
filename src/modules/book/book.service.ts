import { Injectable, Logger } from '@nestjs/common';
import { SearchBooksInput } from './dto/search-books.input';
import { SearchBooksResult } from './dto/search-result.dto';
import { CreateBookInput } from './dto/create-book.input';
import { UpdateBookInput } from './dto/update-book.input';
import { CacheService } from '../cache/cache.service';
import { BookRepository } from './repository/book.repository';
import { AuthorService } from '../author/author.service';
import { Book } from './entities/book.entity';

@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);

  constructor(
    private readonly bookRepository: BookRepository,
    private readonly cacheService: CacheService,
    private readonly authorService: AuthorService,
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

  async createBook(createBookInput: CreateBookInput): Promise<Book> {
    const author = await this.authorService.findOne(createBookInput.authorId);

    const book = await this.bookRepository.createBook(
      createBookInput,
      author.name,
    );

    await this.cacheService.invalidateSearchCache();

    this.logger.log(`Created book: ${book.title} by ${author.name}`);

    return book;
  }

  async updateBook(updateBookInput: UpdateBookInput): Promise<Book> {
    const currentBook = await this.bookRepository.findOne({
      where: { id: updateBookInput.id },
    });
    if (!currentBook) {
      throw new Error(`Book with ID ${updateBookInput.id} not found`);
    }

    let authorName: string | undefined;

    if (
      updateBookInput.authorId &&
      updateBookInput.authorId !== currentBook.authorId
    ) {
      const author = await this.authorService.findOne(updateBookInput.authorId);
      authorName = author.name;
    }

    const updatedBook = await this.bookRepository.updateBook(
      updateBookInput,
      authorName,
    );

    await this.cacheService.invalidateSearchCache();

    this.logger.log(`Updated book: ${updatedBook.title}`);

    return updatedBook;
  }

  async findByAuthorId(authorId: number): Promise<Book[]> {
    return this.bookRepository.findByAuthor(authorId);
  }
}
