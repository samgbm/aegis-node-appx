import { createHash } from 'crypto';
// @ts-ignore -- hyperswarm 4.x does not ship TypeScript types
import Hyperswarm from 'hyperswarm';
import { logger } from '../utils/logger';

export function hashSwarmTopic(topicString: string): Buffer {
  return createHash('sha256').update(topicString).digest();
}

export async function startSwarm(topicString: string) {
  const swarm = new Hyperswarm();
  const topicBuffer = hashSwarmTopic(topicString);

  const discovery = swarm.join(topicBuffer, { server: true, client: false });

  swarm.on('connection', (_socket: unknown, peerInfo?: { publicKey?: Buffer }) => {
    const peerKey = peerInfo?.publicKey?.toString('hex');
    logger.info({ peerKey }, 'Peer connected');
  });

  // Official Hyperswarm/Pear API: join() returns PeerDiscovery; flushed()
  // waits until the topic is announced on the DHT (server mode).
  await discovery.flushed();

  return swarm;
}
