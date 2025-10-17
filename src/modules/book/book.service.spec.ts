import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { Book, GenreEnum } from './entities/book.entity';
import { Author } from '../author/entities/author.entity';
import { SearchBooksInput } from './dto/search-books.input';
import { BookRepository } from './repository/book.repository';
import { CacheService } from '../cache/cache.service';
import { AuthorService } from '../author/author.service';
import { CreateBookInput } from './dto/create-book.input';
import { UpdateBookInput } from './dto/update-book.input';

describe('BookService', () => {
  let service: BookService;
  let bookRepository: jest.Mocked<BookRepository>;
  let cacheService: jest.Mocked<CacheService>;
  let authorService: jest.Mocked<AuthorService>;

  const mockBookRepository = {
    searchBooks: jest.fn(),
    createBook: jest.fn(),
    updateBook: jest.fn(),
    findByAuthor: jest.fn(),
  };

  const mockAuthor: Author = {
    id: 1,
    name: 'J.K. Rowling',
    bio: 'British author',
    books: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockBook: Book = {
    id: 1,
    title: 'Harry Potter',
    genre: GenreEnum.FICTION,
    publicationYear: 1997,
    authorId: 1,
    authorName: 'J.K. Rowling',
    author: mockAuthor,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockCacheService = {
    getSearchResults: jest.fn(),
    setSearchResults: jest.fn(),
    invalidateSearchCache: jest.fn(),
  };

  const mockAuthorService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: BookRepository,
          useValue: mockBookRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: AuthorService,
          useValue: mockAuthorService,
        },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
    bookRepository = module.get(BookRepository);
    cacheService = module.get(CacheService);
    authorService = module.get(AuthorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchBooks', () => {
    it('should return cached results when available', async () => {
      const cachedResult = {
        books: [mockBook],
        total: 5,
        page: 1,
        limit: 20,
      };

      cacheService.getSearchResults.mockResolvedValue(cachedResult);

      const searchInput: SearchBooksInput = {
        query: 'Harry Potter',
      };

      const result = await service.searchBooks(searchInput, 1, 20);

      expect(result).toEqual(cachedResult);
      expect(cacheService.getSearchResults).toHaveBeenCalledWith(
        searchInput,
        1,
        20,
      );
      expect(bookRepository.searchBooks).not.toHaveBeenCalled();
      expect(cacheService.setSearchResults).not.toHaveBeenCalled();
    });

    it('should search books with text query when cache miss', async () => {
      const mockResult = {
        books: [mockBook],
        total: 5,
        page: 1,
        limit: 20,
      };

      cacheService.getSearchResults.mockResolvedValue(null);
      bookRepository.searchBooks.mockResolvedValue(mockResult);

      const searchInput: SearchBooksInput = {
        query: 'Harry Potter',
      };

      const result = await service.searchBooks(searchInput, 1, 20);

      expect(result.books).toHaveLength(1);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(cacheService.setSearchResults).toHaveBeenCalledWith(
        searchInput,
        1,
        20,
        mockResult,
      );
    });
  });

  describe('createBook', () => {
    it('should create a book and invalidate cache', async () => {
      const createInput: CreateBookInput = {
        title: 'New Book',
        genre: GenreEnum.FICTION,
        publicationYear: 2023,
        authorId: 1,
      };

      authorService.findOne.mockResolvedValue(mockAuthor);
      bookRepository.createBook.mockResolvedValue(mockBook);

      const result = await service.createBook(createInput);

      expect(result).toEqual(mockBook);
      expect(authorService.findOne).toHaveBeenCalledWith(1);
      expect(bookRepository.createBook).toHaveBeenCalledWith(
        createInput,
        'J.K. Rowling',
      );
      expect(cacheService.invalidateSearchCache).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateBook', () => {
    it('should update a book and invalidate cache', async () => {
      const updateInput: UpdateBookInput = {
        id: 1,
        title: 'Updated Book',
      };

      const currentBook = { ...mockBook };
      bookRepository.findOne = jest.fn().mockResolvedValue(currentBook);
      bookRepository.updateBook.mockResolvedValue(mockBook);

      const result = await service.updateBook(updateInput);

      expect(result).toEqual(mockBook);
      expect(bookRepository.updateBook).toHaveBeenCalledWith(
        updateInput,
        undefined,
      );
      expect(cacheService.invalidateSearchCache).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByAuthorId', () => {
    it('should return books by author ID', async () => {
      const authorBooks = [mockBook];
      bookRepository.findByAuthor.mockResolvedValue(authorBooks);

      const result = await service.findByAuthorId(1);

      expect(result).toEqual(authorBooks);
      expect(bookRepository.findByAuthor).toHaveBeenCalledWith(1);
    });

    it('should return empty array when no books found for author', async () => {
      bookRepository.findByAuthor.mockResolvedValue([]);

      const result = await service.findByAuthorId(999);

      expect(result).toEqual([]);
      expect(bookRepository.findByAuthor).toHaveBeenCalledWith(999);
    });
  });

  describe('error handling', () => {
    it('should handle repository errors in searchBooks', async () => {
      const error = new Error('Database connection failed');
      const searchInput: SearchBooksInput = { query: 'test' };

      cacheService.getSearchResults.mockResolvedValue(null);
      bookRepository.searchBooks.mockRejectedValue(error);

      await expect(service.searchBooks(searchInput, 1, 20)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in createBook', async () => {
      const error = new Error('Database connection failed');
      const createInput: CreateBookInput = {
        title: 'Test Book',
        authorId: 1,
      };

      authorService.findOne.mockResolvedValue(mockAuthor);
      bookRepository.createBook.mockRejectedValue(error);

      await expect(service.createBook(createInput)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in updateBook', async () => {
      const error = new Error('Database connection failed');
      const updateInput: UpdateBookInput = { id: 1, title: 'Updated Book' };

      const currentBook = { ...mockBook };
      bookRepository.findOne = jest.fn().mockResolvedValue(currentBook);
      bookRepository.updateBook.mockRejectedValue(error);

      await expect(service.updateBook(updateInput)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in findByAuthorId', async () => {
      const error = new Error('Database connection failed');

      bookRepository.findByAuthor.mockRejectedValue(error);

      await expect(service.findByAuthorId(1)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
