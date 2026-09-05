import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/errorHandler';
import { profileUpdateSchema } from '../schemas/profile';
import { getProfile, getProfileOptions, updateProfile } from '../services/profileService';

const validationMessage = (error: { issues: Array<{ path: PropertyKey[]; message: string }> }) =>
  error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; ');

const userId = (req: Request) => {
  if (!req.authUserId) {
    throw new ValidationError('Authenticated user is missing');
  }
  return req.authUserId;
};

export const get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({ success: true, data: await getProfile(userId(req)) });
  } catch (error) {
    next(error);
  }
};

export const options = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({ success: true, data: await getProfileOptions() });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ValidationError(validationMessage(parsed.error)));
    return;
  }

  try {
    res.status(200).json({ success: true, data: await updateProfile(userId(req), parsed.data) });
  } catch (error) {
    next(error);
  }
};
