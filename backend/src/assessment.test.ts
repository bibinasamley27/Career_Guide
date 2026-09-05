import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './index';
import prisma from './lib/prisma';

const testEmail = `assessment-test-${Date.now()}@example.com`;
const secondEmail = `assessment-test-second-${Date.now()}@example.com`;
const password = 'SecurePass123';
const agent = request.agent(app);

const validAnswers = {
  technicalInterests: ['Web Development'],
  workPreferences: ['building_applications'],
  problemSolvingPreferences: ['logical_algorithmic'],
  learningPreference: ['hands_on_projects'],
  careerGoal: 'software_development',
  confidenceLevel: 3,
  workEnvironment: ['team_development'],
};

beforeAll(async () => {
  await agent.post('/api/auth/register').send({ name: 'Assessment Student', email: testEmail, password });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [testEmail, secondEmail] } } });
  await prisma.$disconnect();
});

describe('assessment API', () => {
  it('rejects unauthenticated access', async () => {
    const response = await request(app).get('/api/assessment');
    expect(response.status).toBe(401);
  });

  it('returns the centralized question definition', async () => {
    const response = await agent.get('/api/assessment/questions');
    expect(response.status).toBe(200);
    expect(response.body.data.questions).toHaveLength(7);
    expect(response.body.data.questions[0]).toMatchObject({ id: 'technicalInterests', type: 'multiple', required: true });
  });

  it('returns no assessment before the first submission', async () => {
    const response = await agent.get('/api/assessment');
    expect(response.status).toBe(200);
    expect(response.body.data.assessment).toBeNull();
  });

  it('creates and retrieves an assessment', async () => {
    const saveResponse = await agent.post('/api/assessment').send({ answers: validAnswers });
    const fetchResponse = await agent.get('/api/assessment');

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.data.assessment.answers).toEqual(validAnswers);
    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.data.assessment.answers.careerGoal).toBe('software_development');
  });

  it('updates the latest assessment without creating a duplicate', async () => {
    const updatedAnswers = { ...validAnswers, confidenceLevel: 5, careerGoal: 'ai_ml' };
    const response = await agent.put('/api/assessment').send({ answers: updatedAnswers });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    const count = await prisma.assessment.count({ where: { userId: user.id } });

    expect(response.status).toBe(200);
    expect(response.body.data.assessment.answers).toEqual(updatedAnswers);
    expect(count).toBe(1);
  });

  it('rejects missing required answers', async () => {
    const response = await agent.post('/api/assessment').send({ answers: { ...validAnswers, careerGoal: undefined } });
    expect(response.status).toBe(400);
  });

  it('rejects invalid question answer options', async () => {
    const response = await agent.post('/api/assessment').send({ answers: { ...validAnswers, careerGoal: 'not-a-career' } });
    expect(response.status).toBe(400);
  });

  it('rejects invalid rating values', async () => {
    const response = await agent.post('/api/assessment').send({ answers: { ...validAnswers, confidenceLevel: 6 } });
    expect(response.status).toBe(400);
  });

  it('rejects unexpected question IDs', async () => {
    const response = await agent.post('/api/assessment').send({ answers: { ...validAnswers, unexpectedQuestion: 'value' } });
    expect(response.status).toBe(400);
  });

  it('does not expose one student assessment to another student', async () => {
    const secondAgent = request.agent(app);
    await secondAgent.post('/api/auth/register').send({ name: 'Second Assessment Student', email: secondEmail, password });
    const response = await secondAgent.get('/api/assessment');

    expect(response.status).toBe(200);
    expect(response.body.data.assessment).toBeNull();
  });
});
