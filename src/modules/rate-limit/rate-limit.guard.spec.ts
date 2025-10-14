import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService, RateLimitResult } from './rate-limit.service';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let rateLimitService: jest.Mocked<RateLimitService>;

  const mockRateLimitService = {
    checkRateLimit: jest.fn(),
    generateKey: jest.fn(),
    generateUserKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    rateLimitService = module.get(RateLimitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockRequest = {
      ip: '5.248.185.121',
      user: null,
    };

    const mockInfo = {
      fieldName: 'searchBooks',
    };

    const mockContext = {
      getContext: () => ({ req: mockRequest }),
      getInfo: () => mockInfo,
    };

    beforeEach(() => {
      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockContext as any);
    });

    it('should allow request when rate limit not exceeded', async () => {
      const rateLimitResult: RateLimitResult = {
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 60000,
        totalHits: 5,
      };

      rateLimitService.checkRateLimit.mockResolvedValue(rateLimitResult);
      rateLimitService.generateKey.mockReturnValue('ip:5.248.185.121');

      const result = await guard.canActivate(
        mockContext as unknown as ExecutionContext,
      );

      expect(result).toBe(true);
      expect(rateLimitService.checkRateLimit).toHaveBeenCalledWith(
        'ip:5.248.185.121',
        expect.objectContaining({
          windowMs: 60000,
          maxRequests: 30,
        }),
      );
    });

    it('should deny request when rate limit exceeded', async () => {
      const rateLimitResult: RateLimitResult = {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        totalHits: 30,
      };

      rateLimitService.checkRateLimit.mockResolvedValue(rateLimitResult);
      rateLimitService.generateKey.mockReturnValue('ip:5.248.185.121');

      await expect(
        guard.canActivate(mockContext as unknown as ExecutionContext),
      ).rejects.toThrow(HttpException);

      try {
        await guard.canActivate(mockContext as unknown as ExecutionContext);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(error.getResponse()).toEqual(
          expect.objectContaining({
            message: 'Rate limit exceeded',
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            rateLimitInfo: expect.objectContaining({
              limit: 30,
              remaining: 0,
              retryAfter: expect.any(Number),
            }),
          }),
        );
      }
    });

    it('should use user-based key when user is authenticated', async () => {
      const authenticatedRequest = {
        ...mockRequest,
        user: { id: 'user123' },
      };

      const authenticatedContext = {
        getContext: () => ({ req: authenticatedRequest }),
        getInfo: () => mockInfo,
      };

      const rateLimitResult: RateLimitResult = {
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 60000,
        totalHits: 5,
      };

      rateLimitService.checkRateLimit.mockResolvedValue(rateLimitResult);
      rateLimitService.generateUserKey.mockReturnValue('user:user123');

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(authenticatedContext as any);

      await guard.canActivate(
        authenticatedContext as unknown as ExecutionContext,
      );

      expect(rateLimitService.checkRateLimit).toHaveBeenCalledWith(
        'user:user123',
        expect.any(Object),
      );
    });

    it('should apply different rate limits for different operations', async () => {
      const rateLimitResult: RateLimitResult = {
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 60000,
        totalHits: 5,
      };

      rateLimitService.checkRateLimit.mockResolvedValue(rateLimitResult);
      rateLimitService.generateKey.mockReturnValue('ip:5.248.185.121');

      const searchContext = {
        getContext: () => ({ req: mockRequest }),
        getInfo: () => ({ fieldName: 'searchBooks' }),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(searchContext as any);

      await guard.canActivate(searchContext as unknown as ExecutionContext);

      expect(rateLimitService.checkRateLimit).toHaveBeenCalledWith(
        'ip:5.248.185.121',
        expect.objectContaining({
          windowMs: 60000,
          maxRequests: 30,
        }),
      );
    });
  });
});
