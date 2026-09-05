import { Request, Response, NextFunction } from 'express';
import { careerGuideRequestSchema } from '../schemas/agent';
import { ValidationError } from '../middleware/errorHandler';
import { runCareerGuide } from '../agents/careerGuideAgent';

export const run = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = careerGuideRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ValidationError(parsed.error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; ')));
    return;
  }
  if (!req.authUserId) {
    next(new ValidationError('Authenticated user is missing'));
    return;
  }

  try {
    res.status(200).json({ success: true, data: await runCareerGuide(req.authUserId, parsed.data.careerId) });
  } catch (error) {
    next(error);
  }
};
