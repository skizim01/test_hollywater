import { Injectable, Logger } from '@nestjs/common';
import { Author } from './entities/author.entity';
import { AuthorRepository } from './repository/author.repository';
import { SearchAuthorsInput } from './dto/search-authors.input';
import { SearchAuthorsResult } from './dto/search-result.dto';
import { CreateAuthorInput } from './dto/create-author.input';
import { UpdateAuthorInput } from './dto/update-author.input';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class AuthorService {
  private readonly logger = new Logger(AuthorService.name);

  constructor(
    private readonly authorRepository: AuthorRepository,
    private readonly cacheService: CacheService,
  ) {}

  async findOne(id: number): Promise<Author> {
    const author = await this.authorRepository.findByIdWithBooks(id);

    if (!author) {
      throw new Error(`Author with ID ${id} not found`);
    }

    return author;
  }

  async searchAuthors(
    searchInput: SearchAuthorsInput,
    page = 1,
    limit = 20,
  ): Promise<SearchAuthorsResult> {
    const cachedResult = await this.cacheService.getAuthorSearchResults(
      searchInput,
      page,
      limit,
    );

    if (cachedResult) {
      this.logger.debug('Returning cached author search results');
      return cachedResult;
    }

    const result = await this.authorRepository.searchAuthors(
      searchInput,
      page,
      limit,
    );

    await this.cacheService.setAuthorSearchResults(
      searchInput,
      page,
      limit,
      result,
    );

    return result;
  }

  async createAuthor(createAuthorInput: CreateAuthorInput): Promise<Author> {
    const author = await this.authorRepository.createAuthor(createAuthorInput);

    await this.cacheService.invalidateAuthorSearchCache();

    this.logger.log(`Created author: ${author.name}`);

    return author;
  }

  async updateAuthor(updateAuthorInput: UpdateAuthorInput): Promise<Author> {
    const updatedAuthor = await this.authorRepository.updateAuthor(
      updateAuthorInput,
    );

    await this.cacheService.invalidateAuthorSearchCache();

    this.logger.log(`Updated author: ${updatedAuthor.name}`);

    return updatedAuthor;
  }
}
