import { getProfile } from '../services/profileService';
import { getLatestAssessment } from '../services/assessmentService';

export const profileTool = async (userId: string) => {
  const [profileData, assessment] = await Promise.all([
    getProfile(userId),
    getLatestAssessment(userId),
  ]);
  return { ...profileData, assessment };
};
