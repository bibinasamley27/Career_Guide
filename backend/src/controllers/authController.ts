import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { ConflictError, ValidationError } from '../middleware/errorHandler';
import { getAuthenticatedUser, loginUser, registerUser, AUTH_COOKIE_NAME } from '../services/authService';
import { loginSchema, registerSchema } from '../schemas/auth';

const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const validationMessage = (error: { issues: Array<{ path: PropertyKey[]; message: string }> }) =>
  error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; ');

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ValidationError(validationMessage(parsed.error)));
    return;
  }

  try {
    const { user, token } = await registerUser(parsed.data);
    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
    res.status(201).json({ success: true, data: { user } });
  } catch (error) {
    next(error instanceof Error ? error : new ConflictError());
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ValidationError(validationMessage(parsed.error)));
    return;
  }

  try {
    const { user, token } = await loginUser(parsed.data);
    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response): void => {
  const { maxAge: _maxAge, ...clearCookieOptions } = cookieOptions;
  res.clearCookie(AUTH_COOKIE_NAME, clearCookieOptions);
  res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.authUserId) {
    next(new ValidationError('Authenticated user is missing'));
    return;
  }

  try {
    const user = await getAuthenticatedUser(req.authUserId);
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};
