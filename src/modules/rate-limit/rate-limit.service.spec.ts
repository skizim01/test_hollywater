import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService, RateLimitConfig } from './rate-limit.service';
import { RedisService } from '../redis/redis.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    deleteByPattern: jest.fn(),
    getKeysByPattern: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkRateLimit', () => {
    const config: RateLimitConfig = {
      windowMs: 60000,
      maxRequests: 10,
    };

    it('should allow request when under limit', async () => {
      const key = 'test-key';
      redisService.get.mockResolvedValue('5');
      redisService.incr.mockResolvedValue(6);

      const result = await service.checkRateLimit(key, config);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.totalHits).toBe(6);
      expect(redisService.get).toHaveBeenCalledWith(
        expect.stringMatching(/^rate_limit:test-key:\d+$/),
      );
      expect(redisService.incr).toHaveBeenCalled();
    });

    it('should deny request when limit exceeded', async () => {
      const key = 'test-key';
      redisService.get.mockResolvedValue('10');

      const result = await service.checkRateLimit(key, config);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.totalHits).toBe(10);
      expect(redisService.incr).not.toHaveBeenCalled();
    });

    it('should set expiration on first request', async () => {
      const key = 'test-key';
      redisService.get.mockResolvedValue(null);
      redisService.incr.mockResolvedValue(1);

      await service.checkRateLimit(key, config);

      expect(redisService.expire).toHaveBeenCalledWith(
        expect.stringMatching(/^rate_limit:test-key:\d+$/),
        60,
      );
    });

    it('should handle Redis errors gracefully', async () => {
      const key = 'test-key';
      redisService.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.checkRateLimit(key, config);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for key', async () => {
      const key = 'test-key';
      redisService.deleteByPattern.mockResolvedValue(3);

      const result = await service.resetRateLimit(key);

      expect(result).toBe(true);
      expect(redisService.deleteByPattern).toHaveBeenCalledWith(
        `rate_limit:${key}:*`,
      );
    });

    it('should return false on error', async () => {
      const key = 'test-key';
      redisService.deleteByPattern.mockRejectedValue(new Error('Redis error'));

      const result = await service.resetRateLimit(key);

      expect(result).toBe(false);
    });
  });

  describe('clearAllRateLimits', () => {
    it('should clear all rate limit data', async () => {
      redisService.deleteByPattern.mockResolvedValue(15);

      const result = await service.clearAllRateLimits();

      expect(result).toBe(15);
      expect(redisService.deleteByPattern).toHaveBeenCalledWith('rate_limit:*');
    });
  });

  describe('key generation', () => {
    it('should generate IP-based key', () => {
      const req = { ip: '192.168.1.1' } as any;
      const key = service.generateKey(req);
      expect(key).toBe('ip:192.168.1.1');
    });

    it('should generate user-based key', () => {
      const key = service.generateUserKey('user123');
      expect(key).toBe('user:user123');
    });

    it('should generate API key-based key', () => {
      const key = service.generateApiKey('api-key-123');
      expect(key).toBe('api:api-key-123');
    });
  });
});
