import { getSkillGap } from '../services/skillGapService';

export const skillGapTool = (userId: string, careerId: string) => getSkillGap(userId, careerId);
