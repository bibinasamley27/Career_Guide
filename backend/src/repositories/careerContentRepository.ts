import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const careerContentInclude = {
  careerResources: { include: { resource: { include: { skills: { include: { skill: true } } } } }, orderBy: { resource: { title: 'asc' as const } } },
  projectRecommendations: { include: { skills: { include: { skill: true } } }, orderBy: { title: 'asc' as const } },
  careerSkills: { include: { skill: true }, orderBy: { skill: { name: 'asc' as const } } },
} satisfies Prisma.CareerInclude;

export const findCareerContent = (careerId: string) =>
  prisma.career.findUnique({ where: { id: careerId }, include: careerContentInclude });

export const findCareerContentForUser = (userId: string, careerId: string) =>
  prisma.career.findUnique({
    where: { id: careerId },
    include: {
      ...careerContentInclude,
      roadmaps: {
        where: { userId },
        include: { stages: { include: { skills: { include: { skill: true } } } } },
        orderBy: { createdAt: 'desc' as const },
        take: 1,
      },
    },
  });
