import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../..', '.env') });

const isProd = process.env.NODE_ENV === 'production';

import { MAX_SESSIONS_PER_USER } from '../constants';

const parsedMaxSessions = Number(process.env.MAX_SESSIONS_PER_USER);

export const env = {
  isProd,
  port: Number(process.env.PORT) || 5001,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/planme',
  cookieSecret: process.env.COOKIE_SECRET || (isProd ? '' : 'dev-cookie-secret'),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  maxSessionsPerUser: Number.isInteger(parsedMaxSessions) && parsedMaxSessions > 0
    ? parsedMaxSessions
    : MAX_SESSIONS_PER_USER,
} as const;
