import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { Book, GenreEnum } from './entities/book.entity';
import { Author } from '../author/entities/author.entity';
import { SearchBooksInput } from './dto/search-books.input';
import { BookRepository } from './repository/book.repository';
import { CacheService } from '../cache/cache.service';

describe('BookService', () => {
  let service: BookService;
  let bookRepository: jest.Mocked<BookRepository>;
  let cacheService: jest.Mocked<CacheService>;

  const mockBookRepository = {
    searchBooks: jest.fn(),
    findAllWithPagination: jest.fn(),
    findByIdWithAuthor: jest.fn(),
    findByAuthorId: jest.fn(),
    findByGenre: jest.fn(),
    getStatistics: jest.fn(),
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
    author: mockAuthor,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockCacheService = {
    getSearchResults: jest.fn(),
    setSearchResults: jest.fn(),
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
      ],
    }).compile();

    service = module.get<BookService>(BookService);
    bookRepository = module.get(BookRepository);
    cacheService = module.get(CacheService);
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

    it('should search books with genre filter', async () => {
      const scienceBook: Book = {
        id: 2,
        title: 'Science Book',
        genre: GenreEnum.SCIENCE,
        publicationYear: 2020,
        author: {
          id: 2,
          name: 'Science Author',
          bio: 'Science writer',
          books: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };
      const mockResult = {
        books: [scienceBook],
        total: 3,
        page: 1,
        limit: 20,
      };

      cacheService.getSearchResults.mockResolvedValue(null);
      bookRepository.searchBooks.mockResolvedValue(mockResult);

      const searchInput: SearchBooksInput = {
        filters: {
          genre: GenreEnum.SCIENCE,
        },
      };

      const result = await service.searchBooks(searchInput, 1, 20);

      expect(result.books).toHaveLength(1);
      expect(result.books[0].genre).toBe(GenreEnum.SCIENCE);
    });
  });

  describe('findOne', () => {
    it('should return a book by ID', async () => {
      const testBook: Book = {
        id: 3,
        title: 'Test Book',
        genre: GenreEnum.FICTION,
        publicationYear: 2020,
        author: {
          id: 3,
          name: 'Test Author',
          bio: 'Test bio',
          books: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      bookRepository.findByIdWithAuthor.mockResolvedValue(testBook);

      const result = await service.findOne(1);

      expect(result).toEqual(testBook);
      expect(bookRepository.findByIdWithAuthor).toHaveBeenCalledWith(1);
    });

    it('should throw error if book not found', async () => {
      bookRepository.findByIdWithAuthor.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        'Book with ID 999 not found',
      );
    });
  });

  describe('findAll', () => {
    it('should return all books with pagination', async () => {
      const mockResult = {
        books: [mockBook],
        total: 1,
        page: 1,
        limit: 20,
      };

      bookRepository.findAllWithPagination.mockResolvedValue(mockResult);

      const result = await service.findAll(1, 20);

      expect(result).toEqual(mockResult);
      expect(bookRepository.findAllWithPagination).toHaveBeenCalledWith(1, 20);
    });

    it('should use default pagination values', async () => {
      const mockResult = {
        books: [mockBook],
        total: 1,
        page: 1,
        limit: 20,
      };

      bookRepository.findAllWithPagination.mockResolvedValue(mockResult);

      await service.findAll();

      expect(bookRepository.findAllWithPagination).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('findByAuthor', () => {
    it('should return books by author ID', async () => {
      const authorBooks = [mockBook];
      bookRepository.findByAuthorId.mockResolvedValue(authorBooks);

      const result = await service.findByAuthor(1);

      expect(result).toEqual(authorBooks);
      expect(bookRepository.findByAuthorId).toHaveBeenCalledWith(1);
    });

    it('should return empty array when no books found for author', async () => {
      bookRepository.findByAuthorId.mockResolvedValue([]);

      const result = await service.findByAuthor(999);

      expect(result).toEqual([]);
      expect(bookRepository.findByAuthorId).toHaveBeenCalledWith(999);
    });
  });

  describe('findByGenre', () => {
    it('should return books by genre', async () => {
      const fictionBooks = [mockBook];
      bookRepository.findByGenre.mockResolvedValue(fictionBooks);

      const result = await service.findByGenre(GenreEnum.FICTION);

      expect(result).toEqual(fictionBooks);
      expect(bookRepository.findByGenre).toHaveBeenCalledWith(
        GenreEnum.FICTION,
      );
    });

    it('should return empty array when no books found for genre', async () => {
      bookRepository.findByGenre.mockResolvedValue([]);

      const result = await service.findByGenre(GenreEnum.SCIENCE);

      expect(result).toEqual([]);
      expect(bookRepository.findByGenre).toHaveBeenCalledWith(
        GenreEnum.SCIENCE,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return book statistics', async () => {
      const mockStats = {
        totalBooks: 10,
        booksByGenre: { Fiction: 5, Science: 3 },
        booksByYear: { 2023: 2, 2022: 1 },
        totalAuthors: 5,
      };

      bookRepository.getStatistics.mockResolvedValue(mockStats);

      const result = await service.getStatistics();

      expect(result).toEqual(mockStats);
      expect(bookRepository.getStatistics).toHaveBeenCalled();
    });
  });
});
