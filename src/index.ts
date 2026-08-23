import { env } from './config/env';
import { logger } from './utils/logger';

export function initAegisNode(): string {
  return 'Aegis Node Online';
}

logger.info({ nodeEnv: env.NODE_ENV }, 'Aegis Node Online');
