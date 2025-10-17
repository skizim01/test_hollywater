import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Author } from '../entities/author.entity';
import { SearchAuthorsInput } from '../dto/search-authors.input';
import { SearchAuthorsResult } from '../dto/search-result.dto';
import { CreateAuthorInput } from '../dto/create-author.input';
import { UpdateAuthorInput } from '../dto/update-author.input';

@Injectable()
export class AuthorRepository extends Repository<Author> {
  constructor(private dataSource: DataSource) {
    super(Author, dataSource.createEntityManager());
  }

  async findByIdWithBooks(id: number): Promise<Author | null> {
    return this.findOne({
      where: { id },
      relations: ['books'],
    });
  }

  applySearchQuery(queryBuilder: any, query: string) {
    queryBuilder.where(
      '(author.name ILIKE :query OR author.bio ILIKE :query)',
      { query: `%${query}%` },
    );
  }

  async findByIds(ids: number[]): Promise<Author[]> {
    if (ids.length === 0) return [];

    return this.createQueryBuilder('author')
      .where('author.id IN (:...ids)', { ids })
      .getMany();
  }

  async searchAuthors(
    searchInput: SearchAuthorsInput,
    page = 1,
    limit = 20,
  ): Promise<SearchAuthorsResult> {
    const queryBuilder = this.createQueryBuilder('author');

    if (searchInput.query) {
      this.applySearchQuery(queryBuilder, searchInput.query);
    }

    const totalQuery = queryBuilder.clone();
    const total = await totalQuery.getCount();

    const authors = await queryBuilder
      .orderBy('author.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      authors,
      total,
      page,
      limit,
    };
  }

  async createAuthor(createAuthorInput: CreateAuthorInput): Promise<Author> {
    const author = this.create(createAuthorInput);
    return this.save(author);
  }

  async updateAuthor(updateAuthorInput: UpdateAuthorInput): Promise<Author> {
    const { id, ...updateData } = updateAuthorInput;

    await this.update(id, updateData);

    const updatedAuthor = await this.findOne({
      where: { id },
      relations: ['books'],
    });

    if (!updatedAuthor) {
      throw new Error(`Author with ID ${id} not found`);
    }

    return updatedAuthor;
  }
}
