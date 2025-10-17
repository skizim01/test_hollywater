import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthorService } from './author.service';
import { Author } from './entities/author.entity';
import { Book, GenreEnum } from '../book/entities/book.entity';
import { AuthorRepository } from './repository/author.repository';
import { CacheService } from '../cache/cache.service';
import { SearchAuthorsInput } from './dto/search-authors.input';
import { SearchAuthorsResult } from './dto/search-result.dto';
import { CreateAuthorInput } from './dto/create-author.input';
import { UpdateAuthorInput } from './dto/update-author.input';

describe('AuthorService', () => {
  let service: AuthorService;
  let authorRepository: jest.Mocked<AuthorRepository>;
  let cacheService: jest.Mocked<CacheService>;

  const mockAuthorRepository = {
    findByIdWithBooks: jest.fn(),
    searchAuthors: jest.fn(),
    createAuthor: jest.fn(),
    updateAuthor: jest.fn(),
  };

  const mockCacheService = {
    getAuthorSearchResults: jest.fn(),
    setAuthorSearchResults: jest.fn(),
    invalidateAuthorSearchCache: jest.fn(),
  };

  const mockAuthor: Author = {
    id: 1,
    name: 'J.K. Rowling',
    bio: 'British author, best known for the Harry Potter fantasy series',
    books: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockBook: Book = {
    id: 1,
    title: "Harry Potter and the Philosopher's Stone",
    genre: GenreEnum.FICTION,
    publicationYear: 1997,
    authorId: 1,
    authorName: 'J.K. Rowling',
    author: mockAuthor,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorService,
        {
          provide: AuthorRepository,
          useValue: mockAuthorRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AuthorService>(AuthorService);
    authorRepository = module.get(AuthorRepository);
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return author by id with books', async () => {
      const authorWithBooks = { ...mockAuthor, books: [mockBook] };
      authorRepository.findByIdWithBooks.mockResolvedValue(authorWithBooks);

      const result = await service.findOne(1);

      expect(result).toEqual(authorWithBooks);
      expect(authorRepository.findByIdWithBooks).toHaveBeenCalledWith(1);
    });

    it('should throw error when author not found', async () => {
      authorRepository.findByIdWithBooks.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        'Author with ID 999 not found',
      );
      expect(authorRepository.findByIdWithBooks).toHaveBeenCalledWith(999);
    });

    it('should throw error when author id is invalid', async () => {
      authorRepository.findByIdWithBooks.mockResolvedValue(null);

      await expect(service.findOne(0)).rejects.toThrow(
        'Author with ID 0 not found',
      );
      expect(authorRepository.findByIdWithBooks).toHaveBeenCalledWith(0);
    });
  });

  describe('searchAuthors', () => {
    it('should return cached results when available', async () => {
      const searchInput: SearchAuthorsInput = { query: 'test' };
      const cachedResult: SearchAuthorsResult = {
        authors: [mockAuthor],
        total: 1,
        page: 1,
        limit: 20,
      };

      cacheService.getAuthorSearchResults.mockResolvedValue(cachedResult);

      const result = await service.searchAuthors(searchInput, 1, 20);

      expect(result).toEqual(cachedResult);
      expect(cacheService.getAuthorSearchResults).toHaveBeenCalledWith(
        searchInput,
        1,
        20,
      );
      expect(authorRepository.searchAuthors).not.toHaveBeenCalled();
    });

    it('should fetch from repository when cache miss', async () => {
      const searchInput: SearchAuthorsInput = { query: 'test' };
      const repositoryResult: SearchAuthorsResult = {
        authors: [mockAuthor],
        total: 1,
        page: 1,
        limit: 20,
      };

      cacheService.getAuthorSearchResults.mockResolvedValue(null);
      authorRepository.searchAuthors.mockResolvedValue(repositoryResult);

      const result = await service.searchAuthors(searchInput, 1, 20);

      expect(result).toEqual(repositoryResult);
      expect(cacheService.getAuthorSearchResults).toHaveBeenCalledWith(
        searchInput,
        1,
        20,
      );
      expect(authorRepository.searchAuthors).toHaveBeenCalledWith(
        searchInput,
        1,
        20,
      );
      expect(cacheService.setAuthorSearchResults).toHaveBeenCalledWith(
        searchInput,
        1,
        20,
        repositoryResult,
      );
    });
  });

  describe('createAuthor', () => {
    it('should create author and invalidate cache', async () => {
      const createInput: CreateAuthorInput = {
        name: 'New Author',
        bio: 'New author bio',
      };

      authorRepository.createAuthor.mockResolvedValue(mockAuthor);

      const result = await service.createAuthor(createInput);

      expect(result).toEqual(mockAuthor);
      expect(authorRepository.createAuthor).toHaveBeenCalledWith(createInput);
      expect(cacheService.invalidateAuthorSearchCache).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateAuthor', () => {
    it('should update author and invalidate cache', async () => {
      const updateInput: UpdateAuthorInput = {
        id: 1,
        name: 'Updated Author',
      };

      authorRepository.updateAuthor.mockResolvedValue(mockAuthor);

      const result = await service.updateAuthor(updateInput);

      expect(result).toEqual(mockAuthor);
      expect(authorRepository.updateAuthor).toHaveBeenCalledWith(updateInput);
      expect(cacheService.invalidateAuthorSearchCache).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle repository errors in findOne', async () => {
      const error = new Error('Database connection failed');
      authorRepository.findByIdWithBooks.mockRejectedValue(error);

      await expect(service.findOne(1)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in searchAuthors', async () => {
      const error = new Error('Database connection failed');
      const searchInput: SearchAuthorsInput = { query: 'test' };

      cacheService.getAuthorSearchResults.mockResolvedValue(null);
      authorRepository.searchAuthors.mockRejectedValue(error);

      await expect(service.searchAuthors(searchInput, 1, 20)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in createAuthor', async () => {
      const error = new Error('Database connection failed');
      const createInput: CreateAuthorInput = { name: 'Test Author' };

      authorRepository.createAuthor.mockRejectedValue(error);

      await expect(service.createAuthor(createInput)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in updateAuthor', async () => {
      const error = new Error('Database connection failed');
      const updateInput: UpdateAuthorInput = { id: 1, name: 'Updated Author' };

      authorRepository.updateAuthor.mockRejectedValue(error);

      await expect(service.updateAuthor(updateInput)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
