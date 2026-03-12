import { createApp } from './app';
import { schedulerService, serverConfig } from './runtime';

const app = createApp();

const server = app.listen(serverConfig.port, () => {
  schedulerService.start();
  console.log(`AegisPay API listening on http://localhost:${serverConfig.port}`);
  console.log(`Wallet provider: ${serverConfig.walletProvider}`);
  console.log(`Reasoning provider: ${serverConfig.reasoningProvider}`);
  console.log(
    `Scheduler: ${serverConfig.schedulerEnabled ? `enabled every ${serverConfig.schedulerIntervalMs}ms` : 'disabled'}`,
  );
});

function shutdown() {
  schedulerService.stop();
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
