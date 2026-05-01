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
import { pinoHttpConfig } from './config/logger-http';
import authRouter from './routes/auth.routes';
import ideasRouter from './routes/ideas.routes';
import sessionsRouter from './routes/sessions.routes';
import healthRouter from './routes/health.routes';

interface AppOptions {
  mongoUri: string;
  cookieSecret: string;
  isProd?: boolean;
  clientOrigin?: string;
  sessionStore?: Store;
  enableHttpLogs?: boolean;
}

function securityHeaders(isProd: boolean, clientOrigin: string) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

    if (isProd) {
      const connectSrc = ["'self'"];
      if (clientOrigin) connectSrc.push(clientOrigin);

      res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self' https://fonts.gstatic.com data:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "script-src 'self' 'unsafe-inline'",
        `connect-src ${connectSrc.join(' ')}`,
        "manifest-src 'self'",
        "worker-src 'self'",
      ].join('; '));
    }

    next();
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
  app.disable('x-powered-by');

  // Must be set before any middleware that reads req.ip (rate limiters, logging)
  if (isProd) app.set('trust proxy', 1);

  app.use(securityHeaders(isProd, clientOrigin));

  if (enableHttpLogs) {
    app.use(pinoHttp(pinoHttpConfig));
  }

  app.use(cors({ origin: isProd ? false : clientOrigin, credentials: true }));
  app.use(express.json({ limit: '64kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));

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
  app.use('/api/health', healthRouter);

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
