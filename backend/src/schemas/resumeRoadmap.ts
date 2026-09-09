import { z } from 'zod';

export const resumeRoadmapSkillGapSchema = z.object({
  name: z.string(),
  status: z.enum(['ALREADY_HAVE', 'BUILD_NEXT', 'MISSING_DEVELOP']),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  reason: z.string().optional(),
});

export const resumeRoadmapStageSchema = z.object({
  stageNumber: z.number().int().positive(),
  title: z.string(),
  objective: z.string(),
  skills: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  estimatedDuration: z.string(),
  practice: z.string(),
  project: z.string(),
  completionCriteria: z.string(),
  whyThisComesNext: z.string().optional(),
});

export const resumeRoadmapResponseSchema = z.object({
  source: z.literal('resume'),
  resumeId: z.string(),
  careerDirection: z.string(),
  currentStrengths: z.array(z.string()).default([]),
  skillGaps: z.array(resumeRoadmapSkillGapSchema).default([]),
  roadmap: z.array(resumeRoadmapStageSchema).default([]),
});

export type ResumeRoadmapSkillGap = z.infer<typeof resumeRoadmapSkillGapSchema>;
export type ResumeRoadmapStage = z.infer<typeof resumeRoadmapStageSchema>;
export type ResumeRoadmapResponse = z.infer<typeof resumeRoadmapResponseSchema>;
