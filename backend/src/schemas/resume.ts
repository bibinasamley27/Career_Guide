import { z } from 'zod';

export const resumeExperienceSchema = z.object({
  role: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  technologies: z.array(z.string()).default([]),
}).passthrough();

export const resumeEducationSchema = z.object({
  degree: z.string().nullable().optional(),
  institution: z.string().nullable().optional(),
  field: z.string().nullable().optional(),
  startYear: z.number().nullable().optional(),
  endYear: z.number().nullable().optional(),
}).passthrough();

export const resumeProjectSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  technologies: z.array(z.string()).default([]),
  role: z.string().nullable().optional(),
}).passthrough();

export const resumeParsedDataSchema = z.object({
  personalSummary: z.string().nullable().optional(),
  education: z.array(resumeEducationSchema).default([]),
  experience: z.array(resumeExperienceSchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(resumeProjectSchema).default([]),
  certifications: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  extractedKeywords: z.array(z.string()).default([]),
}).passthrough();

export type ResumeParsedData = z.infer<typeof resumeParsedDataSchema>;
