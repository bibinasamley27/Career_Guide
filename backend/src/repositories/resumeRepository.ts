import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export const findResumeByUserId = (userId: string) =>
  prisma.resume.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

export const findResumeByIdForUser = (userId: string, resumeId: string) =>
  prisma.resume.findFirst({
    where: { userId, id: resumeId },
  });

export const createResumeRecord = (userId: string, data: {
  originalFileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  parsedData: Prisma.InputJsonValue;
  analysisStatus: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}) =>
  prisma.resume.create({
    data: {
      userId,
      originalFileName: data.originalFileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      extractedText: data.extractedText,
      parsedData: data.parsedData as Prisma.JsonObject,
      analysisStatus: data.analysisStatus,
    },
  });

export const updateResumeRecord = (resumeId: string, data: {
  parsedData?: Prisma.InputJsonValue;
  analysisStatus?: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  extractedText?: string;
  originalFileName?: string;
  fileType?: string;
  fileSize?: number;
}) =>
  prisma.resume.update({
    where: { id: resumeId },
    data: {
      ...data,
      parsedData: data.parsedData ? (data.parsedData as Prisma.JsonObject) : undefined,
    },
  });

export const deleteResumeRecord = (resumeId: string) =>
  prisma.resume.delete({
    where: { id: resumeId },
  });

export const findResumeById = (resumeId: string) =>
  prisma.resume.findUnique({
    where: { id: resumeId },
  });
