import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler';
import { getSavedCareerList, requireUserId, saveCareer, unsaveCareer } from '../services/savedCareerService';

const careerIdSchema = z.string().uuid('Invalid career ID');
const careerId = (req: Request) => {
  const parsed = careerIdSchema.safeParse(req.params.careerId);
  if (!parsed.success) throw new ValidationError('Invalid career ID');
  return parsed.data;
};

export const save = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await saveCareer(requireUserId(req.authUserId), careerId(req));
    res.status(result.created ? 201 : 200).json({ success: true, data: result.saved });
  } catch (error) { next(error); }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await unsaveCareer(requireUserId(req.authUserId), careerId(req));
    res.status(200).json({ success: true, data: { message: 'Career removed from saved careers' } });
  } catch (error) { next(error); }
};

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({ success: true, data: { savedCareers: await getSavedCareerList(requireUserId(req.authUserId)) } });
  } catch (error) { next(error); }
};
