import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookService } from './book.service';
import { Book, GenreEnum } from './entities/book.entity';
import { SearchBooksInput } from './dto/search-books.input';
import { SearchBooksResult } from './dto/search-result.dto';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';

@Resolver(() => Book)
@UseGuards(RateLimitGuard)
export class BookResolver {
  constructor(private readonly bookService: BookService) {}

  @Query(() => SearchBooksResult, { name: 'searchBooks' })
  async searchBooks(
    @Args('searchInput', { type: () => SearchBooksInput })
    searchInput: SearchBooksInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<SearchBooksResult> {
    return this.bookService.searchBooks(searchInput, page, limit);
  }

  @Query(() => SearchBooksResult, { name: 'books' })
  async findAll(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<SearchBooksResult> {
    return this.bookService.findAll(page, limit);
  }

  @Query(() => Book, { name: 'book' })
  async findOne(@Args('id', { type: () => Int }) id: number): Promise<Book> {
    return this.bookService.findOne(id);
  }

  @Query(() => [Book], { name: 'booksByAuthor' })
  async findByAuthor(
    @Args('authorId', { type: () => Int }) authorId: number,
  ): Promise<Book[]> {
    return this.bookService.findByAuthor(authorId);
  }

  @Query(() => [Book], { name: 'booksByGenre' })
  async findByGenre(
    @Args('genre', { type: () => GenreEnum }) genre: GenreEnum,
  ): Promise<Book[]> {
    return this.bookService.findByGenre(genre);
  }

  @Query(() => String, { name: 'bookStatistics' })
  async getStatistics(): Promise<string> {
    const stats = await this.bookService.getStatistics();
    return JSON.stringify(stats, null, 2);
  }
}
