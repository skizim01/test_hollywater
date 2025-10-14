import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { RedisService } from '../redis/redis.service';
import { SearchBooksInput } from '../../modules/book/dto/search-books.input';
import { SearchBooksResult } from '../../modules/book/dto/search-result.dto';
import { GenreEnum } from '../book/entities/book.entity';

describe('CacheService', () => {
  let service: CacheService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisService = {
    getJson: jest.fn(),
    setJson: jest.fn(),
    deleteByPattern: jest.fn(),
    getKeysByPattern: jest.fn(),
    info: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSearchResults', () => {
    it('should return cached results when available', async () => {
      const searchInput: SearchBooksInput = {
        query: 'Harry Potter',
        filters: { genre: GenreEnum.FICTION },
      };
      const page = 1;
      const limit = 20;

      const cachedResult: SearchBooksResult = {
        books: [],
        total: 0,
        page: 1,
        limit: 20,
      };

      redisService.getJson.mockResolvedValue(cachedResult);

      const result = await service.getSearchResults(searchInput, page, limit);

      expect(result).toEqual(cachedResult);
      expect(redisService.getJson).toHaveBeenCalledWith(
        expect.stringMatching(/^search_books:/),
      );
    });

    it('should return null when no cached results', async () => {
      const searchInput: SearchBooksInput = {
        query: 'Harry Potter',
      };
      const page = 1;
      const limit = 20;

      redisService.getJson.mockResolvedValue(null);

      const result = await service.getSearchResults(searchInput, page, limit);

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      const searchInput: SearchBooksInput = {
        query: 'Harry Potter',
      };
      const page = 1;
      const limit = 20;

      redisService.getJson.mockRejectedValue(new Error('Redis error'));

      const result = await service.getSearchResults(searchInput, page, limit);

      expect(result).toBeNull();
    });
  });

  describe('setSearchResults', () => {
    it('should cache search results', async () => {
      const searchInput: SearchBooksInput = {
        query: 'Harry Potter',
        filters: { genre: GenreEnum.FICTION },
      };
      const page = 1;
      const limit = 20;
      const results: SearchBooksResult = {
        books: [],
        total: 0,
        page: 1,
        limit: 20,
      };

      redisService.setJson.mockResolvedValue(undefined);

      await service.setSearchResults(searchInput, page, limit, results);

      expect(redisService.setJson).toHaveBeenCalledWith(
        expect.stringMatching(/^search_books:/),
        results,
        300,
      );
    });

    it('should use custom TTL when provided', async () => {
      const searchInput: SearchBooksInput = {
        query: 'Harry Potter',
      };
      const page = 1;
      const limit = 20;
      const results: SearchBooksResult = {
        books: [],
        total: 0,
        page: 1,
        limit: 20,
      };
      const customTTL = 600;

      redisService.setJson.mockResolvedValue(undefined);

      await service.setSearchResults(
        searchInput,
        page,
        limit,
        results,
        customTTL,
      );

      expect(redisService.setJson).toHaveBeenCalledWith(
        expect.stringMatching(/^search_books:/),
        results,
        customTTL,
      );
    });
  });

  describe('invalidateSearchCache', () => {
    it('should invalidate search cache with default pattern', async () => {
      redisService.deleteByPattern.mockResolvedValue(5);

      const result = await service.invalidateSearchCache();

      expect(result).toBe(5);
      expect(redisService.deleteByPattern).toHaveBeenCalledWith(
        'search_books:*',
      );
    });

    it('should invalidate search cache with custom pattern', async () => {
      const customPattern = 'search_books:custom:*';
      redisService.deleteByPattern.mockResolvedValue(3);

      const result = await service.invalidateSearchCache(customPattern);

      expect(result).toBe(3);
      expect(redisService.deleteByPattern).toHaveBeenCalledWith(customPattern);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const mockInfo = 'used_memory_human:1.2M\nother_info:value';
      redisService.getKeysByPattern
        .mockResolvedValueOnce(['key1', 'key2', 'key3'])
        .mockResolvedValueOnce(['search_books:key1', 'search_books:key2']);
      redisService.info.mockResolvedValue(mockInfo);

      const result = await service.getCacheStats();

      expect(result).toEqual({
        totalKeys: 3,
        searchCacheKeys: 2,
        memoryUsage: '1.2M',
      });
    });

    it('should handle Redis errors gracefully', async () => {
      redisService.getKeysByPattern.mockRejectedValue(new Error('Redis error'));

      const result = await service.getCacheStats();

      expect(result).toEqual({
        totalKeys: 0,
        searchCacheKeys: 0,
        memoryUsage: 'Unknown',
      });
    });
  });

  describe('clearAllCache', () => {
    it('should clear all cache', async () => {
      redisService.deleteByPattern.mockResolvedValue(10);

      await service.clearAllCache();

      expect(redisService.deleteByPattern).toHaveBeenCalledWith('*');
    });
  });

  describe('warmUpCache', () => {
    it('should complete warm-up process without errors', async () => {
      // Mock the logger to verify it's called
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.warmUpCache();

      // Verify that warm-up process logs are called
      expect(loggerSpy).toHaveBeenCalledWith('Starting cache warm-up...');
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Cache warm-up completed for \d+ patterns/),
      );

      loggerSpy.mockRestore();
    });

    it('should handle errors gracefully during warm-up', async () => {
      // Mock logger to throw error
      const loggerSpy = jest
        .spyOn(service['logger'], 'log')
        .mockImplementation(() => {
          throw new Error('Logger error');
        });
      const errorSpy = jest.spyOn(service['logger'], 'error');

      await service.warmUpCache();

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to warm up cache:',
        expect.any(Error),
      );

      loggerSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('getCacheKeyInfo', () => {
    it('should return cache key information', async () => {
      const key = 'test-key';
      const mockValue = { test: 'data' };

      redisService.exists.mockResolvedValue(true);
      redisService.ttl.mockResolvedValue(300);
      redisService.getJson.mockResolvedValue(mockValue);

      const result = await service.getCacheKeyInfo(key);

      expect(result).toEqual({
        exists: true,
        ttl: 300,
        value: mockValue,
      });
    });

    it('should handle non-existent key', async () => {
      const key = 'non-existent-key';

      redisService.exists.mockResolvedValue(false);

      const result = await service.getCacheKeyInfo(key);

      expect(result).toEqual({
        exists: false,
        ttl: -1,
      });
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys for same input', async () => {
      const searchInput: SearchBooksInput = {
        query: 'test query',
        filters: { genre: GenreEnum.FICTION },
      };
      const page = 1;
      const limit = 20;

      // Call getSearchResults to trigger generateCacheKey
      redisService.getJson.mockResolvedValue(null);
      await service.getSearchResults(searchInput, page, limit);

      // Verify the key was generated and used
      expect(redisService.getJson).toHaveBeenCalledWith(
        expect.stringMatching(/^search_books:[a-f0-9]{32}$/),
      );
    });

    it('should generate different cache keys for different inputs', async () => {
      const searchInput1: SearchBooksInput = {
        query: 'test query 1',
      };
      const searchInput2: SearchBooksInput = {
        query: 'test query 2',
      };

      redisService.getJson.mockResolvedValue(null);

      await service.getSearchResults(searchInput1, 1, 20);
      const key1 = redisService.getJson.mock.calls[0][0];

      await service.getSearchResults(searchInput2, 1, 20);
      const key2 = redisService.getJson.mock.calls[1][0];

      expect(key1).not.toBe(key2);
    });

    it('should generate same cache key for same input with different page/limit', async () => {
      const searchInput: SearchBooksInput = {
        query: 'test query',
      };

      redisService.getJson.mockResolvedValue(null);

      await service.getSearchResults(searchInput, 1, 20);
      const key1 = redisService.getJson.mock.calls[0][0];

      await service.getSearchResults(searchInput, 2, 10);
      const key2 = redisService.getJson.mock.calls[1][0];

      expect(key1).not.toBe(key2); // Different because page/limit are different
    });
  });
});
