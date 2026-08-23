import { initAegisNode } from '../src/index';

describe('initAegisNode', () => {
  it("returns 'Aegis Node Online'", () => {
    expect(initAegisNode()).toBe('Aegis Node Online');
  });
});
