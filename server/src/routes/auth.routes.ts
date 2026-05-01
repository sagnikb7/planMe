import { Router } from 'express';
import { Types } from 'mongoose';
import passport from 'passport';
import { ensureAuthenticated } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  changePasswordLimiter,
} from '../middleware/rate-limit';
import { registerSchema, forgotPasswordSchema, resetPasswordSchema, updateNameSchema, changePasswordSchema } from '../schemas/auth.schema';
import { authService, ConflictError, ValidationError } from '../services/auth.service';
import { sessionService } from '../services/session.service';
import { env } from '../config/env';
import { parseUserAgent } from '../utils/user-agent';
import { getClientIp } from '../utils/ip';
import { REMEMBER_ME_MAX_AGE_MS } from '../constants';

const router = Router();

// Strategy switches — set AUTH_LOCAL_ENABLED=false or AUTH_GOOGLE_ENABLED=false in .env to disable
if (!env.auth.localEnabled) {
  for (const path of ['/register', '/login', '/forgot-password', '/reset-password', '/change-password']) {
    router.all(path, (_req, res) => res.status(503).json({ error: 'Local auth is disabled' }));
  }
}
if (!env.auth.googleEnabled) {
  for (const path of ['/google', '/google/callback']) {
    router.all(path, (_req, res) => res.status(503).json({ error: 'Google auth is disabled' }));
  }
}

const GENERIC_RESET_RESPONSE = {
  message: 'If an account exists for that email, a reset link has been generated.',
};

router.post('/register', registerLimiter, validate(registerSchema), async (req, res) => {
  try {
    await authService.register(req.body.name, req.body.email, req.body.password);
    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    if (err instanceof ConflictError) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', loginLimiter, (req, res, next) => {
  passport.authenticate('local', async (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Invalid email or password' });

    try {
      const userId = (user as { _id: Types.ObjectId })._id;
      const activeCount = await sessionService.countActiveSessions(userId);

      if (activeCount >= env.maxSessionsPerUser) {
        return req.session.regenerate(async (sessionErr) => {
          if (sessionErr) return next(sessionErr);
          try {
            req.session.pendingUserId = userId.toString();

            await sessionService.createSession({
              userId,
              sessionId: req.session.id,
              ip: getClientIp(req),
              userAgent: req.headers['user-agent'] || '',
              device: parseUserAgent(req.headers['user-agent']),
              isPending: true,
            });

            const sessions = await sessionService.listSessions(userId, undefined);
            return res.status(202).json({ sessionLimited: true, sessions });
          } catch (innerErr) {
            return next(innerErr);
          }
        });
      }

      // Normal login
      req.session.regenerate((sessionErr) => {
        if (sessionErr) return next(sessionErr);

        req.logIn(user, async (loginErr) => {
          if (loginErr) return next(loginErr);
          try {
            if (req.body.rememberMe) {
              req.session.cookie.maxAge = REMEMBER_ME_MAX_AGE_MS;
            }

            await sessionService.createSession({
              userId,
              sessionId: req.session.id,
              ip: getClientIp(req),
              userAgent: req.headers['user-agent'] || '',
              device: parseUserAgent(req.headers['user-agent']),
              isPending: false,
            });

            res.json({ user: authService.sanitize(user as Parameters<typeof authService.sanitize>[0]) });
          } catch (innerErr) {
            next(innerErr);
          }
        });
      });
    } catch (outerErr) {
      next(outerErr);
    }
  })(req, res, next);
});

router.post('/logout', ensureAuthenticated, (req, res, next) => {
  const sessionId = req.session.id;

  req.logout((logoutErr) => {
    if (logoutErr) return next(logoutErr);

    req.session.destroy(async (sessionErr) => {
      if (sessionErr) return res.status(500).json({ error: 'Logout failed' });

      await sessionService.deleteBySessionId(sessionId);
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  });
});

router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthenticated' });
  res.json({ user: authService.sanitize(req.user as Parameters<typeof authService.sanitize>[0]) });
});

router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = await authService.forgotPassword(req.body.email, baseUrl);
    if (result.resetUrl) {
      return res.json({ ...GENERIC_RESET_RESPONSE, resetUrl: result.resetUrl });
    }
    res.json(GENERIC_RESET_RESPONSE);
  } catch {
    res.status(500).json({ error: 'Failed to start password reset' });
  }
});

router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), async (req, res) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.patch('/me', ensureAuthenticated, validate(updateNameSchema), async (req, res) => {
  try {
    const userId = String((req.user as { _id: Types.ObjectId })._id);
    await authService.updateName(userId, req.body.name);
    (req.user as { name: string }).name = req.body.name;
    res.json({ user: authService.sanitize(req.user as Parameters<typeof authService.sanitize>[0]) });
  } catch {
    res.status(500).json({ error: 'Failed to update name' });
  }
});

router.post('/change-password', ensureAuthenticated, changePasswordLimiter, validate(changePasswordSchema), async (req, res) => {
  try {
    const userId = String((req.user as { _id: Types.ObjectId })._id);
    await authService.changePassword(userId, req.body.currentPassword, req.body.newPassword);
    res.json({ message: 'Password updated' });
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.delete('/me', ensureAuthenticated, async (req, res, next) => {
  try {
    const userId = String((req.user as { _id: Types.ObjectId })._id);
    await authService.deleteAccount(userId);
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ message: 'Account deleted' });
      });
    });
  } catch {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google' }),
  async (req, res, next) => {
    const user = req.user as Express.User & { _id: Types.ObjectId };
    const userId = user._id;
    try {
      const activeCount = await sessionService.countActiveSessions(userId);

      if (activeCount >= env.maxSessionsPerUser) {
        return req.session.regenerate(async (err) => {
          if (err) return next(err);
          try {
            req.session.pendingUserId = userId.toString();
            await sessionService.createSession({
              userId, sessionId: req.session.id,
              ip: getClientIp(req), userAgent: req.headers['user-agent'] || '',
              device: parseUserAgent(req.headers['user-agent']), isPending: true,
            });
            res.redirect('/session-limit');
          } catch (e) { next(e); }
        });
      }

      req.session.regenerate((err) => {
        if (err) return next(err);
        req.logIn(user, async (loginErr) => {
          if (loginErr) return next(loginErr);
          try {
            await sessionService.createSession({
              userId, sessionId: req.session.id,
              ip: getClientIp(req), userAgent: req.headers['user-agent'] || '',
              device: parseUserAgent(req.headers['user-agent']), isPending: false,
            });
            res.redirect('/ideas');
          } catch (e) { next(e); }
        });
      });
    } catch (e) { next(e); }
  }
);

export default router;
