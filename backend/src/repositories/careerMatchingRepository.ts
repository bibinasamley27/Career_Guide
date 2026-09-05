import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const careerInclude = {
  careerSkills: { include: { skill: true } },
  careerInterests: { include: { interest: true } },
} satisfies Prisma.CareerInclude;

export const findMatchingInputs = async (userId: string) => {
  const [user, careers] = await prisma.$transaction([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        skills: { include: { skill: true } },
        interests: { include: { interest: true } },
        assessments: { orderBy: { submittedAt: 'desc' }, take: 1 },
      },
    }),
    prisma.career.findMany({ include: careerInclude, orderBy: { title: 'asc' } }),
  ]);
  return { user, careers };
};
