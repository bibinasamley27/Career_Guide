import { z } from 'zod';

export const careerGuideRequestSchema = z.object({
  careerId: z.string().uuid('Invalid career ID'),
}).strict();
