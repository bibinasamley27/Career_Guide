import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler';
import { getPersonalizedCareerContent } from '../services/careerContentService';

const careerIdSchema = z.string().uuid('Invalid career ID');

export const getResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = careerIdSchema.safeParse(req.params.careerId);
  if (!parsed.success) { next(new ValidationError('Invalid career ID')); return; }
  if (!req.authUserId) { next(new ValidationError('Authenticated user is missing')); return; }
  try {
    const result = await getPersonalizedCareerContent(req.authUserId, parsed.data);
    res.status(200).json({ success: true, data: { careerId: result.careerId, careerName: result.careerName, gaps: result.gaps, resources: result.resources } });
  } catch (error) { next(error); }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = careerIdSchema.safeParse(req.params.careerId);
  if (!parsed.success) { next(new ValidationError('Invalid career ID')); return; }
  if (!req.authUserId) { next(new ValidationError('Authenticated user is missing')); return; }
  try {
    const result = await getPersonalizedCareerContent(req.authUserId, parsed.data);
    res.status(200).json({ success: true, data: { careerId: result.careerId, careerName: result.careerName, gaps: result.gaps, projects: result.projects } });
  } catch (error) { next(error); }
};
