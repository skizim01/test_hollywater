import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookService } from './book.service';
import { Book } from './entities/book.entity';
import { SearchBooksInput } from './dto/search-books.input';
import { SearchBooksResult } from './dto/search-result.dto';
import { CreateBookInput } from './dto/create-book.input';
import { UpdateBookInput } from './dto/update-book.input';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { Author } from '../author/entities/author.entity';
import { AuthorService } from '../author/author.service';

@Resolver(() => Book)
@UseGuards(RateLimitGuard)
export class BookResolver {
  constructor(
    private readonly bookService: BookService,
    private readonly authorService: AuthorService,
  ) {}

  @Query(() => SearchBooksResult, { name: 'searchBooks' })
  async searchBooks(
    @Args('searchInput', { type: () => SearchBooksInput })
    searchInput: SearchBooksInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<SearchBooksResult> {
    return this.bookService.searchBooks(searchInput, page, limit);
  }

  @Mutation(() => Book, { name: 'createBook' })
  async createBook(
    @Args('createBookInput', { type: () => CreateBookInput })
    createBookInput: CreateBookInput,
  ): Promise<Book> {
    return this.bookService.createBook(createBookInput);
  }

  @Mutation(() => Book, { name: 'updateBook' })
  async updateBook(
    @Args('updateBookInput', { type: () => UpdateBookInput })
    updateBookInput: UpdateBookInput,
  ): Promise<Book> {
    return this.bookService.updateBook(updateBookInput);
  }

  @ResolveField(() => Author)
  async author(@Parent() book: Book): Promise<Author> {
    return await this.authorService.findOne(book.authorId);
  }
}
