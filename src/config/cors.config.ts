import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Logger } from '@nestjs/common';

const logger = new Logger('CorsConfig');

export const getCorsConfig = (): CorsOptions => {
  const environment = process.env.NODE_ENv;
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',');

  if (isProduction && process.env.PRODUCTION_ORIGINS) {
    allowedOrigins.push(...process.env.PRODUCTION_ORIGINS.split(','));
  }

  return {
    origin: (origin, callback) => {
      if (!origin) {
        if (isDevelopment || !environment) {
          return callback(null, true);
        } else {
          return callback(new Error('Origin required in production'), false);
        }
      }

      if (!allowedOrigins || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (isDevelopment && origin.includes('localhost')) {
        return callback(null, true);
      }

      logger.warn(`CORS: Blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Apollo-Require-Preflight',
      'X-Requested-With',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'X-Rate-Limit-Limit',
    ],
    maxAge: isProduction ? 86400 : 0,
    optionsSuccessStatus: 200,
  };
};
