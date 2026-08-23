import { createHash } from 'crypto';
// @ts-ignore -- hyperswarm 4.x does not ship TypeScript types
import Hyperswarm from 'hyperswarm';
import { logger } from '../utils/logger';

type SwarmSocket = {
  on: (event: string, listener: (err?: Error) => void) => void;
};

export function hashSwarmTopic(topicString: string): Buffer {
  return createHash('sha256').update(topicString).digest();
}

export async function startSwarm(topicString: string) {
  const swarm = new Hyperswarm();
  const topicBuffer = hashSwarmTopic(topicString);
  const topicHex = topicBuffer.toString('hex');

  logger.info({ topic: topicString, topicHex }, 'Announcing Hyperswarm topic');

  const discovery = swarm.join(topicBuffer, { server: true, client: false });

  swarm.on('connection', (socket: SwarmSocket, peerInfo?: { publicKey?: Buffer }) => {
    const peerKey = peerInfo?.publicKey?.toString('hex');
    logger.info({ peerKey }, 'Peer connected');

    // Official Hyperswarm: socket errors (ECONNRESET, CANNOT_HOLEPUNCH) must be
    // handled or they crash the Node process as uncaught exceptions.
    socket.on('error', (err) => {
      logger.warn(
        { peerKey, err: err?.message, code: (err as NodeJS.ErrnoException | undefined)?.code },
        'Peer socket error',
      );
    });
  });

  swarm.on('update', () => {
    logger.info(
      {
        connecting: swarm.connecting,
        peers: swarm.connections.size,
        knownPeers: swarm.peers.size,
      },
      'Swarm update',
    );
  });

  await discovery.flushed();

  logger.info(
    {
      topicHex,
      dhtHost: swarm.dht.host,
      dhtPort: swarm.dht.port,
      firewalled: swarm.dht.firewalled,
    },
    'Hyperswarm flushed and listening on the DHT',
  );

  return swarm;
}
