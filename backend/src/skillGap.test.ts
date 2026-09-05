import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './index';
import prisma from './lib/prisma';
import { calculateSkillGap, SkillGapInput } from './services/skillGap';

const careerInput = (studentSkills: SkillGapInput['studentSkills']): SkillGapInput => ({
  careerId: 'career-1',
  careerName: 'Example Career',
  careerSkills: [
    { name: 'Required Advanced', importance: 'REQUIRED', minProficiency: 'ADVANCED' },
    { name: 'Required Beginner', importance: 'REQUIRED', minProficiency: 'BEGINNER' },
    { name: 'Preferred Intermediate', importance: 'PREFERRED', minProficiency: 'INTERMEDIATE' },
  ],
  studentSkills,
});

describe('deterministic skill-gap analysis', () => {
  it('classifies all required skills as existing with full coverage', () => {
    const result = calculateSkillGap(careerInput([
      { name: 'Required Advanced', proficiency: 'ADVANCED' },
      { name: 'Required Beginner', proficiency: 'BEGINNER' },
      { name: 'Preferred Intermediate', proficiency: 'INTERMEDIATE' },
    ]));
    expect(result.existingSkills.map((skill) => skill.name)).toEqual(['Required Advanced', 'Required Beginner', 'Preferred Intermediate']);
    expect(result.partialSkills).toHaveLength(0);
    expect(result.missingSkills).toHaveLength(0);
    expect(result.skillCoverage).toBe(100);
  });

  it('classifies below-target proficiency as partial', () => {
    const result = calculateSkillGap(careerInput([{ name: 'Required Advanced', proficiency: 'BEGINNER' }]));
    expect(result.partialSkills.map((skill) => skill.name)).toEqual(['Required Advanced']);
    expect(result.missingSkills.map((skill) => skill.name)).toEqual(['Required Beginner', 'Preferred Intermediate']);
    expect(result.matchedSkillCount).toBe(0);
    expect(result.skillCoverage).toBe(0);
  });

  it('classifies absent skills as missing and prioritizes required gaps first', () => {
    const result = calculateSkillGap(careerInput([]));
    expect(result.existingSkills).toHaveLength(0);
    expect(result.missingSkills).toHaveLength(3);
    expect(result.missingSkillCount).toBe(3);
    expect(result.prioritySkills.map((skill) => skill.name)).toEqual(['Required Advanced', 'Required Beginner', 'Preferred Intermediate']);
    expect(result.prioritySkills[0].priority).toBe('HIGH');
    expect(result.prioritySkills[2].priority).toBe('MEDIUM');
  });

  it('returns zero coverage for a career with no skills', () => {
    const result = calculateSkillGap({ ...careerInput([]), careerSkills: [] });
    expect(result.totalRequiredSkills).toBe(0);
    expect(result.skillCoverage).toBe(0);
    expect(result.prioritySkills).toEqual([]);
  });
});

const testEmail = `skill-gap-test-${Date.now()}@example.com`;
const secondEmail = `skill-gap-second-${Date.now()}@example.com`;
const password = 'SecurePass123';
const agent = request.agent(app);
let careerId: string;

beforeAll(async () => {
  const career = await prisma.career.findFirstOrThrow({ where: { title: 'Frontend Developer' } });
  careerId = career.id;
  const skill = await prisma.skill.findFirstOrThrow({ where: { name: 'React' } });
  const registration = await agent.post('/api/auth/register').send({ name: 'Skill Gap Student', email: testEmail, password });
  const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
  await prisma.userSkill.create({ data: { userId: user.id, skillId: skill.id, proficiency: 'INTERMEDIATE' } });
  expect(registration.status).toBe(201);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [testEmail, secondEmail] } } });
  await prisma.$disconnect();
});

describe('skill-gap API', () => {
  it('rejects unauthenticated requests', async () => {
    const response = await request(app).get(`/api/careers/${careerId}/skill-gap`);
    expect(response.status).toBe(401);
  });

  it('returns the selected career gap using only the authenticated student skills', async () => {
    const response = await agent.get(`/api/careers/${careerId}/skill-gap`);
    expect(response.status).toBe(200);
    expect(response.body.data.careerName).toBe('Frontend Developer');
    expect(response.body.data.existingSkills.map((skill: { name: string }) => skill.name)).toContain('React');
    expect(response.body.data.skillCoverage).toBeGreaterThan(0);
  });

  it('rejects malformed and unknown career IDs', async () => {
    const malformed = await agent.get('/api/careers/not-a-uuid/skill-gap');
    const unknown = await agent.get('/api/careers/00000000-0000-0000-0000-000000000000/skill-gap');
    expect(malformed.status).toBe(400);
    expect(unknown.status).toBe(404);
  });

  it('does not reuse another user skill set', async () => {
    const secondAgent = request.agent(app);
    await secondAgent.post('/api/auth/register').send({ name: 'Other Student', email: secondEmail, password });
    const response = await secondAgent.get(`/api/careers/${careerId}/skill-gap`);
    expect(response.status).toBe(200);
    expect(response.body.data.existingSkills.map((skill: { name: string }) => skill.name)).not.toContain('React');
  });
});
