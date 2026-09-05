import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const careerInclude = {
  careerSkills: { include: { skill: true }, orderBy: { skill: { name: 'asc' as const } } },
} satisfies Prisma.CareerInclude;

export const findSkillGapInputs = (userId: string, careerId: string) =>
  prisma.$transaction([
    prisma.career.findUnique({ where: { id: careerId }, include: careerInclude }),
    prisma.user.findUnique({ where: { id: userId }, include: { skills: { include: { skill: true } } } }),
  ]);
