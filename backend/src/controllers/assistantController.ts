import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { ValidationError } from '../middleware/errorHandler';
import { assistantChatSchema } from '../schemas/assistant';
import { runCareerAssistant } from '../agents/careerAssistantAgent';

export const chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = assistantChatSchema.safeParse(req.body);
  if (!parsed.success) { next(new ValidationError(parsed.error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; '))); return; }
  if (!req.authUserId) { next(new ValidationError('Authenticated user is missing')); return; }
  if (parsed.data.message.length > config.AI_MAX_MESSAGE_LENGTH) { next(new ValidationError('Message is too long')); return; }
  try {
    console.info('[CareerAssistant] Request received', { messageLength: parsed.data.message.length, conversationIdProvided: Boolean(parsed.data.conversationId) });
    const data = await runCareerAssistant(req.authUserId, parsed.data.message, parsed.data.conversationId);
    console.info('[CareerAssistant] Response returned', { messageLength: data.message.content.length, toolCount: data.toolsUsed.length });
    res.status(200).json({ success: true, data });
  } catch {
    next(new ValidationError('The career assistant is temporarily unavailable. Please try again.'));
  }
};