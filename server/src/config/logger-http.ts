import { Request, Response } from 'express';
import { Options } from 'pino-http';
import logger from '../utils/logger';

function buildPayload(req: Request, res: Response) {
  return {
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode: res.statusCode,
    durationMs: (res as unknown as { responseTime: number }).responseTime,
    ip: req.ip || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}

export const pinoHttpConfig: Options = {
  logger,
  autoLogging: { ignore: (req) => req.url === '/api/health' },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: () => 'HTTP request completed',
  customErrorMessage: () => 'HTTP request failed',
  customSuccessObject: (req, res) => buildPayload(req as Request, res as Response),
  customErrorObject: (req, res, err) => ({
    ...buildPayload(req as Request, res as Response),
    errorName: (err as Error).name,
    errorMessage: (err as Error).message,
  }),
  serializers: { req: () => undefined, res: () => undefined },
};
