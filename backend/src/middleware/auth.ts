import { Request, Response, NextFunction } from 'express';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '../services/authService';
import { UnauthorizedError } from './errorHandler';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  try {
    req.authUserId = verifyAuthToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Authentication required'));
  }
};

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

export const authRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const now = Date.now();
  const key = req.ip || 'unknown';
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (current.count >= MAX_ATTEMPTS) {
    res.status(429).json({ success: false, error: { message: 'Too many authentication attempts. Try again later.' } });
    return;
  }

  current.count += 1;
  next();
};

const assistantAttempts = new Map<string, { count: number; resetAt: number }>();
const ASSISTANT_WINDOW_MS = 60 * 1000;
const ASSISTANT_MAX_ATTEMPTS = 20;

export const assistantRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.authUserId || req.ip || 'unknown';
  const now = Date.now();
  const current = assistantAttempts.get(key);
  if (!current || current.resetAt <= now) {
    assistantAttempts.set(key, { count: 1, resetAt: now + ASSISTANT_WINDOW_MS });
    next();
    return;
  }
  if (current.count >= ASSISTANT_MAX_ATTEMPTS) {
    res.status(429).json({ success: false, error: { message: 'Too many assistant requests. Try again later.' } });
    return;
  }
  current.count += 1;
  next();
};
