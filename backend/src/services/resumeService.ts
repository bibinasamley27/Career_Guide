import { Prisma } from '@prisma/client';
import { ValidationError } from '../middleware/errorHandler';
import { findResumeByUserId, findResumeByIdForUser, createResumeRecord, updateResumeRecord, deleteResumeRecord, findResumeById } from '../repositories/resumeRepository';
import { analyzeResumeText, extractTextFromResume, normalizeResumeParsedData } from './resumeAnalysisService';

export type ResumeAnalysisStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export const validateResumeUpload = (file: Express.Multer.File | undefined) => {
  if (!file) throw new ValidationError('Please attach a resume file.');
  if (file.size <= 0) throw new ValidationError('The uploaded resume is empty.');
  if (file.size > 5 * 1024 * 1024) {
    throw new ValidationError('Resume file is too large. Maximum size is 5MB.');
  }

  const isPdf = file.originalname.toLowerCase().endsWith('.pdf') || file.mimetype === 'application/pdf';
  const isDocx = file.originalname.toLowerCase().endsWith('.docx') || file.mimetype.includes('word');
  if (!isPdf && !isDocx) {
    throw new ValidationError('Unsupported file type. Please upload a PDF or DOCX resume.');
  }

  return file;
};

const summarizeResume = (resume: Awaited<ReturnType<typeof findResumeByUserId>>) => {
  if (!resume) return null;
  return {
    id: resume.id,
    userId: resume.userId,
    originalFileName: resume.originalFileName,
    fileType: resume.fileType,
    fileSize: resume.fileSize,
    extractedText: resume.extractedText,
    parsedData: (resume.parsedData && typeof resume.parsedData === 'object' ? resume.parsedData : {}) as Record<string, unknown>,
    analysisStatus: resume.analysisStatus,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
};

export const CreateResumeUpload = async (userId: string, file: Express.Multer.File) => {
  const extractedText = await extractTextFromResume({
    originalname: file.originalname,
    buffer: file.buffer,
    mimetype: file.mimetype,
  });

  const parsedData = await analyzeResumeText(extractedText);
  const normalizedParsedData = normalizeResumeParsedData(parsedData);

  const resume = await createResumeRecord(userId, {
    originalFileName: file.originalname,
    fileType: file.mimetype || file.originalname.split('.').pop() || 'application/octet-stream',
    fileSize: file.size,
    extractedText,
    parsedData: normalizedParsedData as Prisma.InputJsonValue,
    analysisStatus: 'COMPLETED',
  });

  return {
    analysisStatus: resume.analysisStatus,
    resume: summarizeResume(resume),
  };
};

export const getResumeSummaryForUser = async (userId: string) => {
  const resume = await findResumeByUserId(userId);
  return {
    resume: summarizeResume(resume),
  };
};

export const getResumeByIdForUser = async (userId: string, resumeId: string) => {
  const resume = await findResumeByIdForUser(userId, resumeId);
  if (!resume) throw new ValidationError('Resume not found.');
  return summarizeResume(resume);
};

export const removeResumeForUser = async (userId: string, resumeId: string) => {
  const resume = await findResumeByIdForUser(userId, resumeId);
  if (!resume) throw new ValidationError('Resume not found.');
  await deleteResumeRecord(resume.id);
  return { message: 'Resume deleted successfully.' };
};

export const updateResumeForUser = async (userId: string, resumeId: string, input: Record<string, unknown>) => {
  const resume = await findResumeByIdForUser(userId, resumeId);
  if (!resume) throw new ValidationError('Resume not found.');

  const parsedData = normalizeResumeParsedData({ ...(resume.parsedData as Record<string, unknown>), ...input });
  const updated = await updateResumeRecord(resume.id, {
    parsedData: parsedData as Prisma.InputJsonValue,
    analysisStatus: 'COMPLETED',
  });
  return summarizeResume(updated);
};

export const getResumeById = async (resumeId: string) => {
  const resume = await findResumeById(resumeId);
  if (!resume) throw new ValidationError('Resume not found.');
  return summarizeResume(resume);
};
