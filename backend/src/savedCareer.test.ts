import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './index';
import prisma from './lib/prisma';

const email = `saved-test-${Date.now()}@example.com`;
const secondEmail = `saved-second-${Date.now()}@example.com`;
const password = 'SecurePass123';
const agent = request.agent(app);
let careerId: string;
let secondCareerId: string;

beforeAll(async () => {
  const careers = await prisma.career.findMany({ orderBy: { title: 'asc' }, take: 2 });
  careerId = careers[0].id;
  secondCareerId = careers[1].id;
  await agent.post('/api/auth/register').send({ name: 'Saved Student', email, password });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [email, secondEmail] } } });
  await prisma.$disconnect();
});

describe('saved career API', () => {
  it('rejects unauthenticated save requests', async () => {
    const response = await request(app).post(`/api/careers/${careerId}/save`);
    expect(response.status).toBe(401);
  });

  it('saves a valid career and prevents duplicates', async () => {
    const first = await agent.post(`/api/careers/${careerId}/save`);
    const duplicate = await agent.post(`/api/careers/${careerId}/save`);
    const saved = await agent.get('/api/careers/saved');

    expect(first.status).toBe(201);
    expect(duplicate.status).toBe(200);
    expect(saved.body.data.savedCareers).toHaveLength(1);
    expect(saved.body.data.savedCareers[0].careerId).toBe(careerId);
    expect(saved.body.data.savedCareers[0].matchScore).toBeTruthy();
  });

  it('rejects invalid and unknown careers', async () => {
    expect((await agent.post('/api/careers/not-a-uuid/save')).status).toBe(400);
    expect((await agent.post('/api/careers/00000000-0000-0000-0000-000000000000/save')).status).toBe(404);
  });

  it('removes a saved career', async () => {
    const removed = await agent.delete(`/api/careers/${careerId}/save`);
    const saved = await agent.get('/api/careers/saved');
    expect(removed.status).toBe(200);
    expect(saved.body.data.savedCareers).toHaveLength(0);
    expect((await agent.delete(`/api/careers/${careerId}/save`)).status).toBe(404);
  });

  it('isolates saved careers between users', async () => {
    await agent.post(`/api/careers/${careerId}/save`);
    const secondAgent = request.agent(app);
    await secondAgent.post('/api/auth/register').send({ name: 'Other Saved Student', email: secondEmail, password });
    await secondAgent.post(`/api/careers/${secondCareerId}/save`);
    const secondSaved = await secondAgent.get('/api/careers/saved');
    const firstSaved = await agent.get('/api/careers/saved');

    expect(secondSaved.body.data.savedCareers.map((item: { careerId: string }) => item.careerId)).toEqual([secondCareerId]);
    expect(firstSaved.body.data.savedCareers.map((item: { careerId: string }) => item.careerId)).toEqual([careerId]);
  });
});
