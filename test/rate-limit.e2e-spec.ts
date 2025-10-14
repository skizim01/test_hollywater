import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as request from 'supertest';
import { BookModule } from '../src/modules/book/book.module';
import { AuthorModule } from '../src/modules/author/author.module';
import { CacheModule } from '../src/modules/cache/cache.module';
import { RateLimitModule } from '../src/modules/rate-limit/rate-limit.module';
import { RedisModule } from '../src/modules/redis/redis.module';
import { BookService } from '../src/modules/book/book.service';
import { AuthorService } from '../src/modules/author/author.service';
import { CacheService } from '../src/modules/cache/cache.service';
import { RateLimitService } from '../src/modules/rate-limit/rate-limit.service';
import { RedisService } from '../src/modules/redis/redis.service';

describe('Rate Limiting and Caching E2E Tests', () => {
  let app: INestApplication;
  let bookService: BookService;
  let cacheService: CacheService;
  let rateLimitService: RateLimitService;

  const mockBookService = {
    searchBooks: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getStatistics: jest.fn(),
  };

  const mockAuthorService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getStatistics: jest.fn(),
  };

  const mockCacheService = {
    getSearchResults: jest.fn(),
    setSearchResults: jest.fn(),
    getCacheStats: jest.fn(),
    clearAllCache: jest.fn(),
  };

  const mockRateLimitService = {
    checkRateLimit: jest.fn(),
    clearAllRateLimits: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    getJson: jest.fn(),
    setJson: jest.fn(),
    deleteByPattern: jest.fn(),
    ping: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          playground: false,
        }),
        BookModule,
        AuthorModule,
        CacheModule,
        RateLimitModule,
        RedisModule,
      ],
    })
      .overrideProvider(BookService)
      .useValue(mockBookService)
      .overrideProvider(AuthorService)
      .useValue(mockAuthorService)
      .overrideProvider(CacheService)
      .useValue(mockCacheService)
      .overrideProvider(RateLimitService)
      .useValue(mockRateLimitService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    bookService = moduleFixture.get<BookService>(BookService);
    cacheService = moduleFixture.get<CacheService>(CacheService);
    rateLimitService = moduleFixture.get<RateLimitService>(RateLimitService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 60000,
        totalHits: 5,
      });

      mockBookService.searchBooks.mockResolvedValue({
        books: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const query = `
        query {
          searchBooks(searchInput: { query: "test" }) {
            books { id title }
            total
            page
            limit
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.searchBooks).toBeDefined();
      expect(mockRateLimitService.checkRateLimit).toHaveBeenCalled();
    });

    it('should block requests when rate limit exceeded', async () => {
      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        totalHits: 30,
      });

      const query = `
        query {
          searchBooks(searchInput: { query: "test" }) {
            books { id title }
            total
            page
            limit
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(429);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Rate limit exceeded');
    });

    it('should apply different rate limits for different operations', async () => {
      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 60000,
        totalHits: 5,
      });

      const searchQuery = `
        query {
          searchBooks(searchInput: { query: "test" }) {
            books { id title }
          }
        }
      `;

      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: searchQuery })
        .expect(200);

      expect(mockRateLimitService.checkRateLimit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          windowMs: 60000,
          maxRequests: 30,
        }),
      );
    });
  });

  describe('Caching', () => {
    it('should return cached results when available', async () => {
      const cachedResult = {
        books: [{ id: 1, title: 'Cached Book' }],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 60000,
        totalHits: 5,
      });

      mockCacheService.getSearchResults.mockResolvedValue(cachedResult);

      const query = `
        query {
          searchBooks(searchInput: { query: "cached" }) {
            books { id title }
            total
            page
            limit
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.searchBooks).toEqual(cachedResult);
      expect(mockCacheService.getSearchResults).toHaveBeenCalled();
      expect(mockBookService.searchBooks).not.toHaveBeenCalled();
    });

    it('should cache results when cache miss', async () => {
      const dbResult = {
        books: [{ id: 1, title: 'Database Book' }],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 60000,
        totalHits: 5,
      });

      mockCacheService.getSearchResults.mockResolvedValue(null);
      mockBookService.searchBooks.mockResolvedValue(dbResult);
      mockCacheService.setSearchResults.mockResolvedValue(undefined);

      const query = `
        query {
          searchBooks(searchInput: { query: "database" }) {
            books { id title }
            total
            page
            limit
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.searchBooks).toEqual(dbResult);
      expect(mockCacheService.getSearchResults).toHaveBeenCalled();
      expect(mockBookService.searchBooks).toHaveBeenCalled();
      expect(mockCacheService.setSearchResults).toHaveBeenCalled();
    });

    it('should handle cache management operations', async () => {
      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 60000,
        totalHits: 5,
      });

      mockCacheService.getCacheStats.mockResolvedValue({
        totalKeys: 10,
        searchCacheKeys: 5,
        memoryUsage: '1.2M',
      });

      const query = `
        query {
          cacheStats
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.cacheStats).toContain('totalKeys');
      expect(mockCacheService.getCacheStats).toHaveBeenCalled();
    });
  });
});
