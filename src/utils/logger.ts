import pino from 'pino';
import { env } from '../config/env';

const isDevelopment = env.NODE_ENV === 'development';
const isTest = env.NODE_ENV === 'test';

export const logger = pino({
  level: isTest ? 'silent' : 'info',
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
        },
      }
    : {}),
});
