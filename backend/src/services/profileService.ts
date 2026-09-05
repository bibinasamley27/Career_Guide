import { ValidationError } from '../middleware/errorHandler';
import { ProfileUpdateInput } from '../schemas/profile';
import {
  findInterestsByIds,
  findProfileOptions,
  findSkillsByIds,
  findUserProfile,
  saveUserProfile,
} from '../repositories/profileRepository';

const formatProfile = (user: NonNullable<Awaited<ReturnType<typeof findUserProfile>>>) => ({
  profile: user.profile,
  skills: user.skills.map(({ skill, proficiency }) => ({ ...skill, proficiency })),
  interests: user.interests.map(({ interest, weight }) => ({ ...interest, weight })),
});

export const getProfile = async (userId: string) => {
  const user = await findUserProfile(userId);
  if (!user) {
    throw new ValidationError('Authenticated user is missing');
  }
  return formatProfile(user);
};

export const getProfileOptions = () => findProfileOptions();

export const updateProfile = async (userId: string, input: ProfileUpdateInput) => {
  const [skills, interests] = await Promise.all([
    findSkillsByIds(input.skills.map((skill) => skill.skillId)),
    findInterestsByIds(input.interests.map((interest) => interest.interestId)),
  ]);

  if (skills.length !== input.skills.length) {
    throw new ValidationError('One or more selected skills are invalid');
  }
  if (interests.length !== input.interests.length) {
    throw new ValidationError('One or more selected interests are invalid');
  }

  const user = await saveUserProfile(userId, input);
  return formatProfile(user);
};
