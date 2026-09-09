import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/errorHandler';
import { CreateResumeUpload, getResumeSummaryForUser, getResumeByIdForUser, removeResumeForUser, updateResumeForUser, validateResumeUpload, getResumeRoadmapForUser } from '../services/resumeService';

const requireUserId = (req: Request) => {
  if (!req.authUserId) throw new ValidationError('Authenticated user is missing');
  return req.authUserId;
};

export const upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = validateResumeUpload(req.file);
    const data = await CreateResumeUpload(requireUserId(req), file);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getLatest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await getResumeSummaryForUser(requireUserId(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getRoadmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await getResumeRoadmapForUser(requireUserId(req));
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resume = await getResumeByIdForUser(requireUserId(req), req.params.resumeId);
    res.status(200).json({ success: true, data: { resume } });
  } catch (error) {
    next(error);
  }
};

export const del = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await removeResumeForUser(requireUserId(req), req.params.resumeId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resume = await updateResumeForUser(requireUserId(req), req.params.resumeId, req.body || {});
    res.status(200).json({ success: true, data: { resume } });
  } catch (error) {
    next(error);
  }
};
