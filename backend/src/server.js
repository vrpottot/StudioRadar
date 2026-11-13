import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { PORT } from './config/index.js';
import { db } from './db/index.js';
import { initWs } from './ws/index.js';
import { startScheduler, stopScheduler } from './services/schedulerService.js';
import { closePool } from './db/connection.js';
import routes from './routes/index.js';

const app = express();
const server = createServer(app);

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use(routes);

// WebSocket
initWs(server);

// Инициализация базы данных и запуск сервера
async function start() {
  await db.init();
  startScheduler();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[StudioRadar] Backend запущен на http://localhost:${PORT}`);
    console.log(`[StudioRadar] WebSocket доступен на ws://localhost:${PORT}`);
  });
}

start().catch(async error => { console.error('[Startup]', error.message); await closePool(); process.exitCode = 1; });

async function shutdown() {
  stopScheduler();
  server.close();
  await closePool();
  process.exit(0);
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

export { app, server };
