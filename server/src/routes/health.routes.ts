import { Router } from 'express';
import mongoose from 'mongoose';
import process from 'process';

const router = Router();

const MONGO_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

router.get('/', (_req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus = mongoState === 1 ? 'ok' : 'degraded';
  const mem = process.memoryUsage();
  const toMB = (bytes: number) => Math.round(bytes / 1024 / 1024 * 10) / 10;

  const payload = {
    status: mongoStatus === 'ok' ? 'ok' : 'degraded',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      mongodb: {
        status: mongoStatus,
        state: MONGO_STATES[mongoState] ?? 'unknown',
      },
    },
    process: {
      nodeVersion: process.version,
      env: process.env.NODE_ENV ?? 'development',
      memoryMB: {
        rss: toMB(mem.rss),
        heapUsed: toMB(mem.heapUsed),
        heapTotal: toMB(mem.heapTotal),
      },
    },
  };

  res.status(mongoStatus === 'ok' ? 200 : 503).json(payload);
});

export default router;
