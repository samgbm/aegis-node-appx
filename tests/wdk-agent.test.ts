jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { logger } from '../src/utils/logger';
import { initWDKAgent } from '../src/wdk-agent';

describe('initWDKAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes successfully without throwing', async () => {
    await expect(initWDKAgent()).resolves.toBeUndefined();
    expect(logger.info).toHaveBeenCalledWith(
      'Initializing WDK CLI & MCP Toolkit hooks...',
    );
  });
});
