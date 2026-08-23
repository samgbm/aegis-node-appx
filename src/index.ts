import http from 'node:http';
import { env } from './config/env';
import { logger } from './utils/logger';
import { startSwarm } from './swarm';
import { initWDKAgent } from './wdk-agent';

export const HEALTH_PORT = 3000;

export function initAegisNode(): string {
  return 'Aegis Node Online';
}

export function startHealthServer(
  swarm: {
    connections: { size: number };
    connecting?: number;
    dht?: { host?: string | null; port?: number; firewalled?: boolean };
  },
  port = HEALTH_PORT,
) {
  const server = http.createServer((req, res) => {
    const pathname = req.url ? new URL(req.url, 'http://127.0.0.1').pathname : '/';

    if (req.method === 'GET' && pathname === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          peers: swarm.connections.size,
          wdk: 'ready',
          connecting: swarm.connecting ?? 0,
          dhtHost: swarm.dht?.host ?? null,
          firewalled: swarm.dht?.firewalled ?? null,
        }),
      );
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'not_found' }));
  });

  server.listen(port, () => {
    logger.info({ port, path: '/healthz' }, 'Health server is running');
  });

  return server;
}

export async function listenOnDht(topicString = 'aegis-health-bridge-v1') {
  const swarm = await startSwarm(topicString);
  logger.info({ topic: topicString }, 'Aegis Node listening on the DHT');
  await initWDKAgent();
  logger.info('Aegis Node is fully primed for agentic WDK operations');
  startHealthServer(swarm);

  const shutdown = async () => {
    logger.info('Destroying Hyperswarm so DHT records do not go stale');
    await swarm.destroy();
    process.exit(0);
  };
  process.once('SIGINT', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });

  return swarm;
}

logger.info({ nodeEnv: env.NODE_ENV }, 'Aegis Node Online');

if (require.main === module) {
  void listenOnDht().catch((error: unknown) => {
    logger.error(error, 'Failed to start Aegis Node');
    process.exitCode = 1;
  });
}
