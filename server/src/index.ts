import { env } from './config/env';
import { createApp } from './app';
import { connectToDatabase } from './config/database';
import logger from './utils/logger';

if (!env.cookieSecret) {
  logger.error('Application startup aborted: COOKIE_SECRET is required in production');
  process.exit(1);
}

const app = createApp(env);

async function startServer(): Promise<void> {
  try {
    await connectToDatabase(env.mongoUri);
    app.listen(env.port, () => logger.info({ port: env.port }, 'HTTP server listening'));
  } catch (err) {
    logger.error({ errorName: (err as Error).name, errorMessage: (err as Error).message }, 'Database connection failed');
    process.exit(1);
  }
}

startServer();

export { app };
