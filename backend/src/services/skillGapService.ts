import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { findSkillGapInputs } from '../repositories/skillGapRepository';
import { calculateSkillGap } from './skillGap';

export const getSkillGap = async (userId: string, careerId: string) => {
  const [career, user] = await findSkillGapInputs(userId, careerId);
  if (!career) throw new NotFoundError('Career not found');
  if (!user) throw new ValidationError('Authenticated user is missing');

  return calculateSkillGap({
    careerId: career.id,
    careerName: career.title,
    careerSkills: career.careerSkills.map(({ skill, importance, minProficiency }) => ({
      name: skill.name,
      importance,
      minProficiency,
    })),
    studentSkills: user.skills.map(({ skill, proficiency }) => ({ name: skill.name, proficiency })),
  });
};
