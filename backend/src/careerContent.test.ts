import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './index';
import prisma from './lib/prisma';
import { formatCareerContent } from './services/careerContentService';
import { getPersonalizedCareerContent } from './services/careerContentService';

const email = `content-test-${Date.now()}@example.com`;
const password = 'SecurePass123';
const agent = request.agent(app);
let careerId: string;

beforeAll(async () => {
  const career = await prisma.career.findFirstOrThrow({ where: { title: 'Frontend Developer' } });
  careerId = career.id;
  await agent.post('/api/auth/register').send({ name: 'Content Student', email, password });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
});

describe('career resources and projects', () => {
  it('rejects unauthenticated content requests', async () => {
    expect((await request(app).get(`/api/careers/${careerId}/resources`)).status).toBe(401);
    expect((await request(app).get(`/api/careers/${careerId}/projects`)).status).toBe(401);
  });

  it('returns only resources linked to the selected career', async () => {
    const response = await agent.get(`/api/careers/${careerId}/resources`);
    expect(response.status).toBe(200);
    expect(response.body.data.resources.length).toBeGreaterThan(0);
    expect(response.body.data.resources.every((resource: { title: string; url: string | null }) => resource.title && (resource.url === null || /^https?:\/\//.test(resource.url)))).toBe(true);
  });

  it('returns career-linked projects with grounded skills', async () => {
    const response = await agent.get(`/api/careers/${careerId}/projects`);
    expect(response.status).toBe(200);
    expect(response.body.data.projects.length).toBeGreaterThan(0);
    expect(response.body.data.projects[0]).toHaveProperty('description');
    expect(response.body.data.projects[0]).toHaveProperty('skills');
  });

  it('handles invalid and unknown careers', async () => {
    expect((await agent.get('/api/careers/not-a-uuid/resources')).status).toBe(400);
    expect((await agent.get('/api/careers/00000000-0000-0000-0000-000000000000/projects')).status).toBe(404);
  });

  it('returns empty content safely when no resources or projects are linked', () => {
    const content = formatCareerContent({
      id: careerId,
      title: 'Empty Career',
      careerResources: [],
      projectRecommendations: [],
      careerSkills: [],
    } as never);
    expect(content.resources).toEqual([]);
    expect(content.projects).toEqual([]);
  });

  it('ranks content against the authenticated user skill gaps', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const career = await prisma.career.findUniqueOrThrow({ where: { id: careerId }, include: { careerSkills: { include: { skill: true } } } });
    const firstSkill = career.careerSkills[0];
    await prisma.userSkill.create({ data: { userId: user.id, skillId: firstSkill.skillId, proficiency: 'ADVANCED' } });

    const result = await getPersonalizedCareerContent(user.id, careerId);
    expect(result.gaps).not.toContain(firstSkill.skill.name);
    expect(result.resources.length).toBeGreaterThanOrEqual(7);
    expect(result.projects.length).toBeGreaterThanOrEqual(7);
    expect(result.resources.some((resource) => resource.skills.length > 0)).toBe(true);
    expect(result.projects.some((project) => project.skills.length > 0)).toBe(true);
    expect(result.resources[0].relevanceReason).toBeTruthy();
  });
});
