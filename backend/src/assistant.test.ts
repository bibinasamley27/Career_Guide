import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './index';
import prisma from './lib/prisma';
import { runCareerAssistant } from './agents/careerAssistantAgent';
import { AiProvider } from './ai';

const email = `assistant-test-${Date.now()}@example.com`;
const password = 'SecurePass123';
const agent = request.agent(app);

beforeAll(async () => {
  await agent.post('/api/auth/register').send({ name: 'Assistant Student', email, password });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
});

describe('Career Guide AI assistant', () => {
  it('rejects unauthenticated chat', async () => {
    const response = await request(app).post('/api/assistant/chat').send({ message: 'Which career suits me?' });
    expect(response.status).toBe(401);
  });

  it('rejects empty and oversized messages', async () => {
    expect((await agent.post('/api/assistant/chat').send({ message: ' ' })).status).toBe(400);
    expect((await agent.post('/api/assistant/chat').send({ message: 'x'.repeat(2001) })).status).toBe(400);
  });

  it('returns a grounded fallback when Gemini is unavailable', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const response = await runCareerAssistant(user.id, 'Which career suits me best?', undefined, null);
    expect(response.agentStatus).toBe('completed');
    expect(response.message.content).toContain('Gemini is temporarily unavailable');
    expect(response.conversationId).toBeTruthy();
  });

  it('does not substitute a career recommendation for general knowledge in fallback mode', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const response = await runCareerAssistant(user.id, 'What is an LLM?', undefined, null);
    expect(response.message.content).toContain('cannot safely interpret');
    expect(response.message.content).not.toContain('strongest deterministic match');
  });

  it('returns the provider answer for the current message instead of fallback output', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const requests: string[] = [];
    const provider: AiProvider = {
      generate: async ({ messages }) => {
        requests.push(messages.filter((entry) => entry.role === 'user').at(-1)?.content || '');
        return { text: 'This is a general explanation from Gemini.', toolCalls: [] };
      },
    };

    const result = await runCareerAssistant(user.id, 'What is an LLM?', undefined, provider);

    expect(requests).toEqual(['What is an LLM?']);
    expect(result.message.content).toBe('This is a general explanation from Gemini.');
    expect(result.message.content).not.toContain('strongest deterministic match');
  });

  it('returns tool results to the provider before accepting the final answer', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const messagesSeen: string[][] = [];
    let callCount = 0;
    const provider: AiProvider = {
      generate: async ({ messages }) => {
        messagesSeen.push(messages.map((entry) => `${entry.role}:${entry.content}`));
        callCount += 1;
        if (callCount === 1) return { toolCalls: [{ id: 'saved-call', name: 'get_saved_careers', arguments: {} }] };
        return { text: 'Gemini used the saved-career data.', toolCalls: [] };
      },
    };

    const result = await runCareerAssistant(user.id, 'Which saved careers should I revisit?', undefined, provider);

    expect(result.message.content).toBe('Gemini used the saved-career data.');
    expect(result.toolsUsed).toEqual([{ name: 'get_saved_careers', status: 'success' }]);
    expect(messagesSeen[1].some((message) => message === 'user:')).toBe(true);
  });
});