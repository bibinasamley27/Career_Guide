import { Request, Response, NextFunction } from 'express';
import { assessmentQuestions, assessmentSubmissionSchema } from '../data/assessmentDefinition';
import { ValidationError } from '../middleware/errorHandler';
import { getLatestAssessment, saveAssessment } from '../services/assessmentService';

const validationMessage = (error: { issues: Array<{ path: PropertyKey[]; message: string }> }) =>
  error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; ');

const authenticatedUserId = (req: Request) => {
  if (!req.authUserId) throw new ValidationError('Authenticated user is missing');
  return req.authUserId;
};

export const questions = (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, data: { questions: assessmentQuestions } });
};

export const get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({ success: true, data: { assessment: await getLatestAssessment(authenticatedUserId(req)) } });
  } catch (error) {
    next(error);
  }
};

export const save = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = assessmentSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new ValidationError(validationMessage(parsed.error)));
    return;
  }

  try {
    const assessment = await saveAssessment(authenticatedUserId(req), parsed.data.answers);
    res.status(200).json({ success: true, data: { assessment } });
  } catch (error) {
    next(error);
  }
};
