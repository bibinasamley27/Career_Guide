import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const careerContentInclude = {
  careerResources: { include: { resource: true }, orderBy: { resource: { title: 'asc' as const } } },
  projectRecommendations: { orderBy: { title: 'asc' as const } },
  careerSkills: { include: { skill: true }, orderBy: { skill: { name: 'asc' as const } } },
} satisfies Prisma.CareerInclude;

export const findCareerContent = (careerId: string) =>
  prisma.career.findUnique({ where: { id: careerId }, include: careerContentInclude });
