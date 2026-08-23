import { createCli } from '../src/cli';

describe('cli', () => {
  it('defines the status command without throwing', () => {
    expect(() => createCli()).not.toThrow();

    const program = createCli();
    const commandNames = program.commands.map((command) => command.name());

    expect(commandNames).toContain('status');
  });
});
