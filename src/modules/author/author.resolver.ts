import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthorService } from './author.service';
import { Author } from './entities/author.entity';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';

@Resolver(() => Author)
@UseGuards(RateLimitGuard)
export class AuthorResolver {
  constructor(private readonly authorService: AuthorService) {}

  @Query(() => [Author], { name: 'authors' })
  async findAll(): Promise<Author[]> {
    return this.authorService.findAll();
  }

  @Query(() => Author, { name: 'author' })
  async findOne(@Args('id', { type: () => Int }) id: number): Promise<Author> {
    return this.authorService.findOne(id);
  }

  @Query(() => [Author], { name: 'searchAuthors' })
  async findByName(
    @Args('name', { type: () => String }) name: string,
  ): Promise<Author[]> {
    return this.authorService.findByName(name);
  }

  @Query(() => String, { name: 'authorsWithBookCount' })
  async findWithBookCount(): Promise<string> {
    const authors = await this.authorService.findWithBookCount();
    return JSON.stringify(authors, null, 2);
  }

  @Query(() => String, { name: 'authorStatistics' })
  async getStatistics(): Promise<string> {
    const stats = await this.authorService.getStatistics();
    return JSON.stringify(stats, null, 2);
  }
}
