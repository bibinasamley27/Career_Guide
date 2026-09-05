import { randomUUID } from 'crypto';
import { config } from '../config';
import { AssistantMessage } from '../ai';

const conversations = new Map<string, AssistantMessage[]>();

export const getConversation = (userId: string, conversationId?: string) => {
  const id = conversationId || randomUUID();
  const key = `${userId}:${id}`;
  return { id, messages: conversations.get(key) || [], key };
};

export const saveConversation = (key: string, messages: AssistantMessage[]) => {
  conversations.set(key, messages.slice(-config.AI_MAX_HISTORY_MESSAGES));
};