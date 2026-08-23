import { env } from './config/env';
import { logger } from './utils/logger';
import { startSwarm } from './swarm';

export function initAegisNode(): string {
  return 'Aegis Node Online';
}

export async function listenOnDht(topicString = 'aegis-health-bridge-v1') {
  const swarm = await startSwarm(topicString);
  logger.info({ topic: topicString }, 'Aegis Node listening on the DHT');
  return swarm;
}

logger.info({ nodeEnv: env.NODE_ENV }, 'Aegis Node Online');

if (require.main === module) {
  void listenOnDht().catch((error: unknown) => {
    logger.error(error, 'Failed to start Hyperswarm');
    process.exitCode = 1;
  });
}
