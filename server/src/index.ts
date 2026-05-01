import http from 'http';
import { env } from './config/env';
import { createApp } from './app';
import { connectToDatabase, disconnectFromDatabase } from './config/database';
import logger from './utils/logger';

if (!env.cookieSecret) {
  logger.error('Application startup aborted: COOKIE_SECRET is required in production');
  process.exit(1);
}

const app = createApp(env);
const server = http.createServer(app);

async function startServer(): Promise<void> {
  try {
    await connectToDatabase(env.mongoUri);
    logger.info({ mongoUri: env.mongoUri.replace(/:\/\/.*@/, '://<redacted>@') }, 'MongoDB connected');

    server.listen(env.port, () =>
      logger.info({ port: env.port, env: env.isProd ? 'production' : 'development' }, 'HTTP server listening'),
    );
  } catch (err) {
    logger.error({ errorName: (err as Error).name, errorMessage: (err as Error).message }, 'Database connection failed');
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Graceful shutdown initiated');

  server.close(async () => {
    try {
      await disconnectFromDatabase();
      logger.info('MongoDB disconnected — process exit');
      process.exit(0);
    } catch (err) {
      logger.error({ errorMessage: (err as Error).message }, 'Error during shutdown');
      process.exit(1);
    }
  });

  // Force-kill if graceful drain exceeds 10 s (Render's hard limit is 30 s)
  setTimeout(() => {
    logger.warn('Shutdown timeout — forcing exit');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

export { app };
