import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthenticated' });
}

export function ensurePending(req: Request, res: Response, next: NextFunction): void {
  if (req.session.pendingUserId) return next();
  res.status(401).json({ error: 'Unauthenticated' });
}

export function ensureAuthOrPending(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated() || req.session.pendingUserId) return next();
  res.status(401).json({ error: 'Unauthenticated' });
}

/** Returns the userId of the authenticated or pending user. Throws if neither. */
export function getRequestUserId(req: Request): Types.ObjectId {
  if (req.isAuthenticated()) return req.user!._id;
  if (req.session.pendingUserId) return new Types.ObjectId(req.session.pendingUserId);
  throw new Error('No authenticated or pending user on request');
}
