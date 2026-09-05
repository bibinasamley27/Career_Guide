import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const profileInclude = {
  profile: true,
  skills: {
    include: { skill: true },
    orderBy: { skill: { name: 'asc' as const } },
  },
  interests: {
    include: { interest: true },
    orderBy: { interest: { name: 'asc' as const } },
  },
} satisfies Prisma.UserInclude;

export const findUserProfile = (userId: string) =>
  prisma.user.findUnique({ where: { id: userId }, include: profileInclude });

export const findProfileOptions = async () => {
  const [skills, interests] = await prisma.$transaction([
    prisma.skill.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
    prisma.interest.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
  ]);
  return { skills, interests };
};

export const findSkillsByIds = (ids: string[]) =>
  prisma.skill.findMany({ where: { id: { in: ids } }, select: { id: true } });

export const findInterestsByIds = (ids: string[]) =>
  prisma.interest.findMany({ where: { id: { in: ids } }, select: { id: true } });

export const saveUserProfile = async (userId: string, input: {
  name: string;
  education: string;
  degreeBranch: string | null;
  experienceLevel: string;
  careerGoal: string | null;
  preferredDomains: string[];
  learningPreference: string | null;
  weeklyLearningHours: number | null;
  skills: { skillId: string; proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }[];
  interests: { interestId: string; weight: number }[];
}) =>
  prisma.$transaction(async (transaction) => {
    await transaction.profile.upsert({
      where: { userId },
      update: {
        name: input.name,
        education: input.education,
        degreeBranch: input.degreeBranch,
        experienceLevel: input.experienceLevel,
        careerGoal: input.careerGoal,
        preferredDomains: input.preferredDomains,
        learningPreference: input.learningPreference,
        weeklyLearningHours: input.weeklyLearningHours,
      },
      create: {
        userId,
        name: input.name,
        education: input.education,
        degreeBranch: input.degreeBranch,
        experienceLevel: input.experienceLevel,
        careerGoal: input.careerGoal,
        preferredDomains: input.preferredDomains,
        learningPreference: input.learningPreference,
        weeklyLearningHours: input.weeklyLearningHours,
      },
    });

    await transaction.userSkill.deleteMany({ where: { userId } });
    await transaction.userInterest.deleteMany({ where: { userId } });

    if (input.skills.length > 0) {
      await transaction.userSkill.createMany({
        data: input.skills.map((skill) => ({ ...skill, userId })),
      });
    }
    if (input.interests.length > 0) {
      await transaction.userInterest.createMany({
        data: input.interests.map((interest) => ({ ...interest, userId })),
      });
    }

    return transaction.user.findUniqueOrThrow({ where: { id: userId }, include: profileInclude });
  });
