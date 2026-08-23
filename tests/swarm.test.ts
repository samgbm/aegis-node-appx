import { createHash } from 'crypto';
import { startSwarm } from '../src/swarm';

const mockFlushed = jest.fn().mockResolvedValue(undefined);
const mockJoin = jest.fn().mockReturnValue({ flushed: mockFlushed });
const mockOn = jest.fn();

jest.mock('hyperswarm', () =>
  jest.fn().mockImplementation(() => ({
    join: mockJoin,
    on: mockOn,
  })),
);

describe('startSwarm', () => {
  beforeEach(() => {
    mockJoin.mockClear();
    mockFlushed.mockClear();
    mockOn.mockClear();
  });

  it('hashes the topic to a 32-byte buffer and joins as a DHT server', async () => {
    const topicString = 'aegis-health-bridge-v1';
    const expectedTopic = createHash('sha256').update(topicString).digest();

    await startSwarm(topicString);

    expect(expectedTopic).toHaveLength(32);
    expect(mockJoin).toHaveBeenCalledTimes(1);
    expect(mockJoin).toHaveBeenCalledWith(expectedTopic, {
      server: true,
      client: false,
    });
    expect(mockFlushed).toHaveBeenCalledTimes(1);
  });
});
