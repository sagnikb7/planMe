import express, { Application, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import MongoStore from 'connect-mongo';
import pinoHttp from 'pino-http';
import path from 'path';
import { Store } from 'express-session';
import logger from './utils/logger';
import { SESSION_MAX_AGE_MS } from './constants';
import { configurePassport } from './config/passport';
import authRouter from './routes/auth.routes';
import ideasRouter from './routes/ideas.routes';
import sessionsRouter from './routes/sessions.routes';

interface AppOptions {
  mongoUri: string;
  cookieSecret: string;
  isProd?: boolean;
  clientOrigin?: string;
  sessionStore?: Store;
  enableHttpLogs?: boolean;
}

function buildHttpLogPayload(req: Request, res: Response) {
  return {
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode: res.statusCode,
    durationMs: (res as unknown as { responseTime: number }).responseTime,
    ip: req.ip || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}

export function createApp({
  mongoUri,
  cookieSecret,
  isProd = false,
  clientOrigin = 'http://localhost:5173',
  sessionStore,
  enableHttpLogs = true,
}: AppOptions): Application {
  if (!mongoUri) throw new Error('mongoUri is required');
  if (!cookieSecret) throw new Error('cookieSecret is required');

  const app = express();

  if (enableHttpLogs) {
    app.use(pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      customSuccessMessage: () => 'HTTP request completed',
      customErrorMessage: () => 'HTTP request failed',
      customSuccessObject: (req, res) => buildHttpLogPayload(req as Request, res as Response),
      customErrorObject: (req, res, err) => ({
        ...buildHttpLogPayload(req as Request, res as Response),
        errorName: (err as Error).name,
        errorMessage: (err as Error).message,
      }),
      serializers: { req: () => undefined, res: () => undefined },
    }));
  }

  app.use(cors({ origin: isProd ? false : clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(session({
    name: 'connect.sid',
    secret: cookieSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore || MongoStore.create({ mongoUrl: mongoUri }),
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_MS,
    },
  }));

  configurePassport(passport);
  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/api/auth', authRouter);
  app.use('/api/ideas', ideasRouter);
  app.use('/api/sessions', sessionsRouter);
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  if (isProd) {
    const clientDist = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error({ method: req.method, path: req.originalUrl, errorName: err.name, errorMessage: err.message }, 'Unhandled request error');
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
