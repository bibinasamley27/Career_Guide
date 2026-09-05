import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const savedCareerInclude = { career: true } satisfies Prisma.SavedCareerInclude;

export const findCareer = (careerId: string) => prisma.career.findUnique({ where: { id: careerId } });

export const findSavedCareer = (userId: string, careerId: string) =>
  prisma.savedCareer.findUnique({ where: { userId_careerId: { userId, careerId } }, include: savedCareerInclude });

export const createSavedCareer = (userId: string, careerId: string) =>
  prisma.savedCareer.create({ data: { userId, careerId }, include: savedCareerInclude });

export const deleteSavedCareer = (userId: string, careerId: string) =>
  prisma.savedCareer.delete({ where: { userId_careerId: { userId, careerId } } });

export const findSavedCareers = (userId: string) =>
  prisma.savedCareer.findMany({ where: { userId }, include: savedCareerInclude, orderBy: { savedAt: 'desc' } });
