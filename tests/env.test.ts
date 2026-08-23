import { envSchema } from '../src/config/env';

describe('envSchema', () => {
  it("falls back to 'development' when NODE_ENV is not set", () => {
    const parsed = envSchema.parse({});
    expect(parsed.NODE_ENV).toBe('development');
  });
});
