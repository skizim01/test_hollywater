import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthorService } from './author.service';
import { Author } from './entities/author.entity';
import { Book, GenreEnum } from '../book/entities/book.entity';
import { AuthorRepository } from './repository/author.repository';

describe('AuthorService', () => {
  let service: AuthorService;
  let authorRepository: jest.Mocked<AuthorRepository>;

  const mockAuthorRepository = {
    findAllWithBooks: jest.fn(),
    findByIdWithBooks: jest.fn(),
    findByName: jest.fn(),
    findWithBookCount: jest.fn(),
    getStatistics: jest.fn(),
  };

  const mockBookRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
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
          provide: getRepositoryToken(Book),
          useValue: mockBookRepository,
        },
      ],
    }).compile();

    service = module.get<AuthorService>(AuthorService);
    authorRepository = module.get(AuthorRepository);
    bookRepository = module.get(getRepositoryToken(Book));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all authors with books', async () => {
      const mockAuthors = [
        { ...mockAuthor, books: [mockBook] },
        {
          id: 2,
          name: 'George R.R. Martin',
          bio: 'American novelist',
          books: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ];

      authorRepository.findAllWithBooks.mockResolvedValue(mockAuthors);

      const result = await service.findAll();

      expect(result).toEqual(mockAuthors);
      expect(authorRepository.findAllWithBooks).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no authors exist', async () => {
      authorRepository.findAllWithBooks.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(authorRepository.findAllWithBooks).toHaveBeenCalledTimes(1);
    });
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

  describe('findByName', () => {
    it('should return authors matching the name', async () => {
      const mockAuthors = [
        { ...mockAuthor, name: 'J.K. Rowling' },
        { ...mockAuthor, id: 2, name: 'J.K. Rowling (Pseudonym)' },
      ];

      authorRepository.findByName.mockResolvedValue(mockAuthors);

      const result = await service.findByName('J.K. Rowling');

      expect(result).toEqual(mockAuthors);
      expect(authorRepository.findByName).toHaveBeenCalledWith('J.K. Rowling');
    });

    it('should return empty array when no authors match name', async () => {
      authorRepository.findByName.mockResolvedValue([]);

      const result = await service.findByName('Non-existent Author');

      expect(result).toEqual([]);
      expect(authorRepository.findByName).toHaveBeenCalledWith(
        'Non-existent Author',
      );
    });

    it('should handle partial name matches', async () => {
      const mockAuthors = [
        { ...mockAuthor, name: 'J.K. Rowling' },
        { ...mockAuthor, id: 2, name: 'J.R.R. Tolkien' },
      ];

      authorRepository.findByName.mockResolvedValue(mockAuthors);

      const result = await service.findByName('J.');

      expect(result).toEqual(mockAuthors);
      expect(authorRepository.findByName).toHaveBeenCalledWith('J.');
    });

    it('should handle case insensitive search', async () => {
      const mockAuthors = [{ ...mockAuthor, name: 'J.K. Rowling' }];

      authorRepository.findByName.mockResolvedValue(mockAuthors);

      const result = await service.findByName('j.k. rowling');

      expect(result).toEqual(mockAuthors);
      expect(authorRepository.findByName).toHaveBeenCalledWith('j.k. rowling');
    });
  });

  describe('findWithBookCount', () => {
    it('should return authors with book count', async () => {
      const mockAuthorsWithCount = [
        {
          ...mockAuthor,
          bookCount: 7,
        },
        {
          id: 2,
          name: 'George R.R. Martin',
          bio: 'American novelist',
          books: [],
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          bookCount: 5,
        },
      ];

      authorRepository.findWithBookCount.mockResolvedValue(
        mockAuthorsWithCount,
      );

      const result = await service.findWithBookCount();

      expect(result).toEqual(mockAuthorsWithCount);
      expect(authorRepository.findWithBookCount).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no authors exist', async () => {
      authorRepository.findWithBookCount.mockResolvedValue([]);

      const result = await service.findWithBookCount();

      expect(result).toEqual([]);
      expect(authorRepository.findWithBookCount).toHaveBeenCalledTimes(1);
    });

    it('should handle authors with zero books', async () => {
      const mockAuthorsWithCount = [
        {
          ...mockAuthor,
          bookCount: 0,
        },
      ];

      authorRepository.findWithBookCount.mockResolvedValue(
        mockAuthorsWithCount,
      );

      const result = await service.findWithBookCount();

      expect(result).toEqual(mockAuthorsWithCount);
      expect(result[0].bookCount).toBe(0);
    });
  });

  describe('getStatistics', () => {
    it('should return author statistics', async () => {
      const mockStats = {
        totalAuthors: 10,
        authorsWithBooks: 8,
        averageBooksPerAuthor: 3.5,
        mostProlificAuthor: 'J.K. Rowling',
      };

      authorRepository.getStatistics.mockResolvedValue(mockStats);

      const result = await service.getStatistics();

      expect(result).toEqual(mockStats);
      expect(authorRepository.getStatistics).toHaveBeenCalledTimes(1);
    });

    it('should handle case when no authors exist', async () => {
      const mockStats = {
        totalAuthors: 0,
        authorsWithBooks: 0,
        averageBooksPerAuthor: 0,
        mostProlificAuthor: '',
      };

      authorRepository.getStatistics.mockResolvedValue(mockStats);

      const result = await service.getStatistics();

      expect(result).toEqual(mockStats);
      expect(result.totalAuthors).toBe(0);
      expect(result.averageBooksPerAuthor).toBe(0);
    });

    it('should handle case when all authors have books', async () => {
      const mockStats = {
        totalAuthors: 5,
        authorsWithBooks: 5,
        averageBooksPerAuthor: 4.2,
        mostProlificAuthor: 'Stephen King',
      };

      authorRepository.getStatistics.mockResolvedValue(mockStats);

      const result = await service.getStatistics();

      expect(result).toEqual(mockStats);
      expect(result.totalAuthors).toBe(result.authorsWithBooks);
    });

    it('should handle case when no authors have books', async () => {
      const mockStats = {
        totalAuthors: 3,
        authorsWithBooks: 0,
        averageBooksPerAuthor: 0,
        mostProlificAuthor: '',
      };

      authorRepository.getStatistics.mockResolvedValue(mockStats);

      const result = await service.getStatistics();

      expect(result).toEqual(mockStats);
      expect(result.authorsWithBooks).toBe(0);
      expect(result.averageBooksPerAuthor).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle repository errors in findAll', async () => {
      const error = new Error('Database connection failed');
      authorRepository.findAllWithBooks.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in findOne', async () => {
      const error = new Error('Database connection failed');
      authorRepository.findByIdWithBooks.mockRejectedValue(error);

      await expect(service.findOne(1)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in findByName', async () => {
      const error = new Error('Database connection failed');
      authorRepository.findByName.mockRejectedValue(error);

      await expect(service.findByName('test')).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in findWithBookCount', async () => {
      const error = new Error('Database connection failed');
      authorRepository.findWithBookCount.mockRejectedValue(error);

      await expect(service.findWithBookCount()).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle repository errors in getStatistics', async () => {
      const error = new Error('Database connection failed');
      authorRepository.getStatistics.mockRejectedValue(error);

      await expect(service.getStatistics()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle null values in findByName', async () => {
      authorRepository.findByName.mockResolvedValue([]);

      const result = await service.findByName('');

      expect(result).toEqual([]);
      expect(authorRepository.findByName).toHaveBeenCalledWith('');
    });

    it('should handle special characters in findByName', async () => {
      const mockAuthors = [{ ...mockAuthor, name: "O'Connor" }];
      authorRepository.findByName.mockResolvedValue(mockAuthors);

      const result = await service.findByName("O'Connor");

      expect(result).toEqual(mockAuthors);
      expect(authorRepository.findByName).toHaveBeenCalledWith("O'Connor");
    });

    it('should handle very long names in findByName', async () => {
      const longName = 'A'.repeat(1000);
      authorRepository.findByName.mockResolvedValue([]);

      const result = await service.findByName(longName);

      expect(result).toEqual([]);
      expect(authorRepository.findByName).toHaveBeenCalledWith(longName);
    });
  });
});
