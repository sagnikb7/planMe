import { Router } from 'express';
import { ensureAuthenticated, ensureAuthOrPending, ensurePending, getRequestUserId } from '../middleware/auth';
import { sessionService } from '../services/session.service';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { env } from '../config/env';

const router = Router();

// List active sessions — accessible to both authenticated and pending users
router.get('/', ensureAuthOrPending, async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    const currentSessionId = req.isAuthenticated() ? req.session.id : undefined;
    const sessions = await sessionService.listSessions(userId, currentSessionId);
    res.json({ sessions });
  } catch {
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// Terminate a specific session by its opaque ID
// Accessible to both authenticated and pending users; cannot terminate own current session
router.delete('/:id', ensureAuthOrPending, async (req, res) => {
  try {
    const userId = getRequestUserId(req);

    // Resolve the raw session ID first so we can guard before mutating anything
    const targetSession = await sessionService.findSession(req.params.id as string, userId);
    if (!targetSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Prevent terminating the current session (use logout for that)
    if (req.isAuthenticated() && targetSession.sessionId === req.session.id) {
      return res.status(400).json({ error: 'Use logout to end your current session' });
    }

    await sessionService.terminateSession(req.params.id as string, userId);

    // Destroy the express session from the store so it stops working immediately
    await new Promise<void>((resolve) => {
      req.sessionStore.destroy(targetSession.sessionId, () => resolve());
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to terminate session' });
  }
});

// Resolve a pending session into a full authenticated session.
// Only callable when the session is in pending state and the limit has been freed.
router.post('/resolve', ensurePending, async (req, res, next) => {
  try {
    const userId = getRequestUserId(req);
    const activeCount = await sessionService.countActiveSessions(userId);

    if (activeCount >= env.maxSessionsPerUser) {
      const sessions = await sessionService.listSessions(userId, undefined);
      return res.status(409).json({ error: 'Session limit still reached', sessions });
    }

    const user = await userRepository.findById(userId.toString());
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Promote the pending session to active in our tracking store
    await sessionService.promoteToActive(req.session.id);

    // Delete pendingUserId so the session is no longer treated as pending
    delete req.session.pendingUserId;

    req.logIn(user as Express.User, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json({ user: authService.sanitize(user as Parameters<typeof authService.sanitize>[0]) });
    });
  } catch {
    res.status(500).json({ error: 'Failed to resolve session' });
  }
});

// List active sessions for the current authenticated user (profile page)
// (Alias kept for clarity — same as GET / but only for authenticated users)
router.get('/me', ensureAuthenticated, async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    const sessions = await sessionService.listSessions(userId, req.session.id);
    res.json({ sessions });
  } catch {
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

export default router;
