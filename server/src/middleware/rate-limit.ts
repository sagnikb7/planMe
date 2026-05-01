import rateLimit from 'express-rate-limit';
import {
  RATE_LIMIT_LOGIN,
  RATE_LIMIT_REGISTER,
  RATE_LIMIT_FORGOT_PASSWORD,
  RATE_LIMIT_RESET_PASSWORD,
  RATE_LIMIT_CHANGE_PASSWORD,
} from '../constants';

function makeRateLimiter(opts: { windowMs: number; max: number }) {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    handler: (_req, res) => {
      res.status(429).json({ error: 'Too many requests — please try again later.' });
    },
  });
}

export const loginLimiter          = makeRateLimiter(RATE_LIMIT_LOGIN);
export const registerLimiter       = makeRateLimiter(RATE_LIMIT_REGISTER);
export const forgotPasswordLimiter = makeRateLimiter(RATE_LIMIT_FORGOT_PASSWORD);
export const resetPasswordLimiter  = makeRateLimiter(RATE_LIMIT_RESET_PASSWORD);
export const changePasswordLimiter = makeRateLimiter(RATE_LIMIT_CHANGE_PASSWORD);
