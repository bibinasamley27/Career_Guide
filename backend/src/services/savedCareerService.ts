import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { getCareerMatch } from './careerMatchingService';
import { createSavedCareer, deleteSavedCareer, findCareer, findSavedCareer, findSavedCareers } from '../repositories/savedCareerRepository';

export const saveCareer = async (userId: string, careerId: string) => {
  const career = await findCareer(careerId);
  if (!career) throw new NotFoundError('Career not found');
  const existing = await findSavedCareer(userId, careerId);
  if (existing) return { saved: existing, created: false };
  return { saved: await createSavedCareer(userId, careerId), created: true };
};

export const unsaveCareer = async (userId: string, careerId: string) => {
  const existing = await findSavedCareer(userId, careerId);
  if (!existing) throw new NotFoundError('Saved career not found');
  await deleteSavedCareer(userId, careerId);
};

export const getSavedCareerList = async (userId: string) => {
  const saved = await findSavedCareers(userId);
  return Promise.all(saved.map(async (item) => ({
    id: item.id,
    careerId: item.careerId,
    careerName: item.career.title,
    description: item.career.description,
    domain: item.career.domain,
    savedAt: item.savedAt,
    matchScore: await getCareerMatch(userId, item.careerId),
  })));
};

export const requireUserId = (userId: string | undefined) => {
  if (!userId) throw new ValidationError('Authenticated user is missing');
  return userId;
};
