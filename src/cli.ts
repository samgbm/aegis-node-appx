import { Command } from 'commander';

export function createCli(): Command {
  const program = new Command();

  program.name('aegis').description('Query the local Aegis Node guardian daemon');

  program
    .command('status')
    .description('Fetch /healthz from the local Aegis Node daemon')
    .action(async () => {
      try {
        const response = await fetch('http://localhost:3000/healthz');
        const payload = await response.json();
        console.log(payload);
      } catch {
        console.log('Aegis Node is currently offline.');
      }
    });

  return program;
}

export const program = createCli();

if (require.main === module) {
  void program.parseAsync(process.argv);
}
