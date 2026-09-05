import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './index';
import prisma from './lib/prisma';

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
    const response = await agent.post('/api/assistant/chat').send({ message: 'Which career suits me best?' });
    expect(response.status).toBe(200);
    expect(response.body.data.agentStatus).toBe('completed');
    expect(response.body.data.message.content).toContain('information');
    expect(response.body.data.conversationId).toBeTruthy();
  });
});