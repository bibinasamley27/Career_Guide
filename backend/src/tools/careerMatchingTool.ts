import { getCareerMatch } from '../services/careerMatchingService';

export const careerMatchingTool = (userId: string, careerId: string) => getCareerMatch(userId, careerId);
