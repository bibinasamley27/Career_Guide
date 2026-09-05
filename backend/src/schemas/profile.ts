import { z } from 'zod';

const experienceLevels = ['BEGINNER', 'STUDENT', 'ENTRY_LEVEL', 'INTERMEDIATE', 'EXPERIENCED'] as const;
const learningPreferences = ['SELF_PACED', 'GUIDED_COURSE', 'PROJECT_BASED', 'MIXED'] as const;
const proficiencyLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

const uniqueStrings = (message: string) =>
  z.array(z.string().trim().min(1).max(80)).max(10).superRefine((items, context) => {
    if (new Set(items).size !== items.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  });

const userSkillSchema = z.object({
  skillId: z.string().uuid('Invalid skill ID'),
  proficiency: z.enum(proficiencyLevels),
});

const userInterestSchema = z.object({
  interestId: z.string().uuid('Invalid interest ID'),
  weight: z.number().int().min(1).max(5),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  education: z.string().trim().min(2, 'Education is required').max(200),
  degreeBranch: z.string().trim().max(100).nullable(),
  experienceLevel: z.enum(experienceLevels),
  careerGoal: z.string().trim().max(1000).nullable(),
  preferredDomains: uniqueStrings('Preferred domains cannot contain duplicate values'),
  learningPreference: z.enum(learningPreferences).nullable(),
  weeklyLearningHours: z.number().int().min(1).max(80).nullable(),
  skills: z.array(userSkillSchema).max(100).superRefine((items, context) => {
    if (new Set(items.map((item) => item.skillId)).size !== items.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Skills cannot be duplicated' });
    }
  }),
  interests: z.array(userInterestSchema).max(100).superRefine((items, context) => {
    if (new Set(items.map((item) => item.interestId)).size !== items.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Interests cannot be duplicated' });
    }
  }),
});

export const profileOptionsSchema = z.object({});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
