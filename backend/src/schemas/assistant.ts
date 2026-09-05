import { z } from 'zod';

export const assistantChatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message is too long'),
}).strict();