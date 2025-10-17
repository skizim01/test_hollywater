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
import { AuthorService } from './author.service';
import { Author } from './entities/author.entity';
import { SearchAuthorsInput } from './dto/search-authors.input';
import { SearchAuthorsResult } from './dto/search-result.dto';
import { CreateAuthorInput } from './dto/create-author.input';
import { UpdateAuthorInput } from './dto/update-author.input';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { Book } from '../book/entities/book.entity';
import { BookService } from '../book/book.service';

@Resolver(() => Author)
@UseGuards(RateLimitGuard)
export class AuthorResolver {
  constructor(
    private readonly authorService: AuthorService,
    private readonly bookService: BookService,
  ) {}

  @Query(() => SearchAuthorsResult, { name: 'searchAuthors' })
  async searchAuthors(
    @Args('searchInput', { type: () => SearchAuthorsInput })
    searchInput: SearchAuthorsInput,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<SearchAuthorsResult> {
    return this.authorService.searchAuthors(searchInput, page, limit);
  }

  @Mutation(() => Author, { name: 'createAuthor' })
  async createAuthor(
    @Args('createAuthorInput', { type: () => CreateAuthorInput })
    createAuthorInput: CreateAuthorInput,
  ): Promise<Author> {
    return this.authorService.createAuthor(createAuthorInput);
  }

  @Mutation(() => Author, { name: 'updateAuthor' })
  async updateAuthor(
    @Args('updateAuthorInput', { type: () => UpdateAuthorInput })
    updateAuthorInput: UpdateAuthorInput,
  ): Promise<Author> {
    return this.authorService.updateAuthor(updateAuthorInput);
  }

  @ResolveField(() => [Book])
  async books(@Parent() author: Author): Promise<Book[]> {
    return await this.bookService.findByAuthorId(author.id);
  }
}
