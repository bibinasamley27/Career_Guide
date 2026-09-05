import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler';
import { getCareerContent } from '../services/careerContentService';

const careerIdSchema = z.string().uuid('Invalid career ID');

export const getResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = careerIdSchema.safeParse(req.params.careerId);
  if (!parsed.success) { next(new ValidationError('Invalid career ID')); return; }
  try {
    const result = await getCareerContent(parsed.data);
    res.status(200).json({ success: true, data: { careerId: result.careerId, careerName: result.careerName, resources: result.resources } });
  } catch (error) { next(error); }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = careerIdSchema.safeParse(req.params.careerId);
  if (!parsed.success) { next(new ValidationError('Invalid career ID')); return; }
  try {
    const result = await getCareerContent(parsed.data);
    res.status(200).json({ success: true, data: { careerId: result.careerId, careerName: result.careerName, projects: result.projects } });
  } catch (error) { next(error); }
};
