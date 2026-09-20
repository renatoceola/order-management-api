import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { closePool } from './db/pool.js';

const env = getEnv();
const server = createApp().listen(env.PORT, () => {
  console.warn(`API disponivel em http://localhost:${env.PORT}`);
});

async function shutdown(signal) {
  console.warn(`${signal} recebido. Encerrando a aplicacao.`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
