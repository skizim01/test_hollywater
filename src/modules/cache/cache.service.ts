import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { SearchBooksInput } from '../../modules/book/dto/search-books.input';
import { SearchBooksResult } from '../../modules/book/dto/search-result.dto';
import { createHash } from 'crypto';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly CACHE_PREFIX = 'search_books:';
  private readonly DEFAULT_TTL = 300;

  constructor(private readonly redisService: RedisService) {}

  private generateCacheKey(
    searchInput: SearchBooksInput,
    page: number,
    limit: number,
  ): string {
    const cacheData = {
      query: searchInput.query || '',
      filters: searchInput.filters || {},
      page,
      limit,
    };

    const hash = createHash('md5')
      .update(JSON.stringify(cacheData))
      .digest('hex');

    return `${this.CACHE_PREFIX}${hash}`;
  }

  async getSearchResults(
    searchInput: SearchBooksInput,
    page: number,
    limit: number,
  ): Promise<SearchBooksResult | null> {
    try {
      const cacheKey = this.generateCacheKey(searchInput, page, limit);
      const cachedResult = await this.redisService.getJson<SearchBooksResult>(
        cacheKey,
      );

      if (cachedResult) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return cachedResult;
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      return null;
    } catch (error) {
      this.logger.error('Failed to get cached search results:', error);
      return null;
    }
  }

  async setSearchResults(
    searchInput: SearchBooksInput,
    page: number,
    limit: number,
    results: SearchBooksResult,
    ttlSeconds: number = this.DEFAULT_TTL,
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(searchInput, page, limit);
      await this.redisService.setJson(cacheKey, results, ttlSeconds);
      this.logger.debug(`Cached search results with key: ${cacheKey}`);
    } catch (error) {
      this.logger.error('Failed to cache search results:', error);
    }
  }

  async invalidateSearchCache(pattern?: string): Promise<number> {
    try {
      const searchPattern = pattern || `${this.CACHE_PREFIX}*`;
      const deletedCount = await this.redisService.deleteByPattern(
        searchPattern,
      );
      this.logger.debug(`Invalidated ${deletedCount} cache entries`);
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to invalidate search cache:', error);
      return 0;
    }
  }

  async getCacheStats(): Promise<{
    totalKeys: number;
    searchCacheKeys: number;
    memoryUsage: string;
  }> {
    try {
      const allKeys = await this.redisService.getKeysByPattern('*');
      const searchKeys = await this.redisService.getKeysByPattern(
        `${this.CACHE_PREFIX}*`,
      );

      const info = await this.redisService.info();
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'Unknown';

      return {
        totalKeys: allKeys.length,
        searchCacheKeys: searchKeys.length,
        memoryUsage,
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return {
        totalKeys: 0,
        searchCacheKeys: 0,
        memoryUsage: 'Unknown',
      };
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      await this.redisService.deleteByPattern('*');
      this.logger.log('All cache cleared');
    } catch (error) {
      this.logger.error('Failed to clear all cache:', error);
    }
  }

  async warmUpCache(): Promise<void> {
    try {
      this.logger.log('Starting cache warm-up...');

      const popularSearches = [
        { query: 'fiction', filters: { genre: 'FICTION' } },
        { query: 'science', filters: { genre: 'SCIENCE' } },
        { query: 'history', filters: { genre: 'HISTORY' } },
        { query: 'non-fiction', filters: { genre: 'NON_FICTION' } },
        { query: '', filters: { publicationYear: { from: 2020 } } },
      ];

      this.logger.log(
        `Cache warm-up completed for ${popularSearches.length} patterns`,
      );
    } catch (error) {
      this.logger.error('Failed to warm up cache:', error);
    }
  }

  async getCacheKeyInfo(key: string): Promise<{
    exists: boolean;
    ttl: number;
    value?: any;
  }> {
    try {
      const exists = await this.redisService.exists(key);
      const ttl = exists ? await this.redisService.ttl(key) : -1;
      const value = exists ? await this.redisService.getJson(key) : undefined;

      return { exists, ttl, value };
    } catch (error) {
      this.logger.error(`Failed to get cache key info for ${key}:`, error);
      return { exists: false, ttl: -1 };
    }
  }
}
