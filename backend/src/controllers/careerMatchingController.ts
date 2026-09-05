import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/errorHandler';
import { getCareerRecommendations } from '../services/careerMatchingService';

export const getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.authUserId) {
    next(new ValidationError('Authenticated user is missing'));
    return;
  }
  try {
    res.status(200).json({ success: true, data: await getCareerRecommendations(req.authUserId) });
  } catch (error) {
    next(error);
  }
};
