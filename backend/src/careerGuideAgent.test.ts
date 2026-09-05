import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './index';
import prisma from './lib/prisma';
import { generateRoadmap } from './tools/roadmapTool';

const testEmail = `agent-test-${Date.now()}@example.com`;
const secondEmail = `agent-second-${Date.now()}@example.com`;
const password = 'SecurePass123';
const agent = request.agent(app);
let careerId: string;

beforeAll(async () => {
  const career = await prisma.career.findFirstOrThrow({ where: { title: 'Frontend Developer' }, include: { careerSkills: { include: { skill: true } }, careerResources: { include: { resource: true } }, projectRecommendations: true } });
  careerId = career.id;
  await agent.post('/api/auth/register').send({ name: 'Agent Student', email: testEmail, password });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [testEmail, secondEmail] } } });
  await prisma.$disconnect();
});

describe('Career Guide Agent', () => {
  it('rejects unauthenticated requests', async () => {
    const response = await request(app).post('/api/agent/career-guide').send({ careerId });
    expect(response.status).toBe(401);
  });

  it('rejects malformed and unknown career IDs', async () => {
    const malformed = await agent.post('/api/agent/career-guide').send({ careerId: 'not-a-uuid' });
    const unknown = await agent.post('/api/agent/career-guide').send({ careerId: '00000000-0000-0000-0000-000000000000' });
    expect(malformed.status).toBe(400);
    expect(unknown.status).toBe(404);
  });

  it('executes tools in order and returns a validated deterministic roadmap', async () => {
    const response = await agent.post('/api/agent/career-guide').send({ careerId });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    const run = await prisma.agentRun.findFirstOrThrow({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    const log = run.toolExecutionLog as { step: string; status: string }[];

    expect(response.status).toBe(200);
    expect(response.body.data.agentStatus).toBe('completed');
    expect(response.body.data.career.name).toBe('Frontend Developer');
    expect(response.body.data.roadmap.stages.length).toBeGreaterThan(0);
    expect(log.map((entry) => entry.step)).toEqual(['profile', 'career-matching', 'skill-gap', 'roadmap', 'resources-projects', 'evaluation']);
    expect(log.every((entry) => entry.status === 'completed')).toBe(true);
    expect(run.status).toBe('SUCCESS');
    expect(run.resultSummary).toBeTruthy();
  });

  it('uses deterministic roadmap generation when no AI provider is configured', () => {
    const roadmap = generateRoadmap(careerId, {
      title: 'Frontend Developer',
      domain: 'Software Engineering',
      careerSkills: [{ skill: { name: 'React' }, importance: 'REQUIRED', minProficiency: 'INTERMEDIATE' }],
      careerResources: [],
      projectRecommendations: [],
    }, {
      careerId,
      careerName: 'Frontend Developer',
      existingSkills: [],
      missingSkills: [{ name: 'React', requiredProficiency: 'INTERMEDIATE', importance: 'REQUIRED' }],
      partialSkills: [],
      totalRequiredSkills: 1,
      matchedSkillCount: 0,
      missingSkillCount: 1,
      skillCoverage: 0,
      prioritySkills: [],
    }, { experienceLevel: 'STUDENT', learningPreference: 'PROJECT_BASED', weeklyLearningHours: 4, careerGoal: 'Become a frontend developer' });
    expect(roadmap.stages.length).toBeGreaterThan(0);
    expect(roadmap.stages.every((stage) => stage.estimatedDuration.length > 0)).toBe(true);
  });

  it('does not expose another user agent run or data', async () => {
    const secondAgent = request.agent(app);
    await secondAgent.post('/api/auth/register').send({ name: 'Other Student', email: secondEmail, password });
    const response = await secondAgent.post('/api/agent/career-guide').send({ careerId });
    expect(response.status).toBe(200);
    expect(response.body.data.skillGap.existingSkills).toEqual([]);
    expect(response.body.data.match).toBeTruthy();
  });
});
