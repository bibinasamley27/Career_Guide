import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler';
import { getSkillGap } from '../services/skillGapService';

const careerIdSchema = z.string().uuid('Invalid career ID');

export const get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsedCareerId = careerIdSchema.safeParse(req.params.careerId);
  if (!parsedCareerId.success) {
    next(new ValidationError('Invalid career ID'));
    return;
  }
  if (!req.authUserId) {
    next(new ValidationError('Authenticated user is missing'));
    return;
  }

  try {
    const result = await getSkillGap(req.authUserId, parsedCareerId.data);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
