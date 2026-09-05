import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './index';
import prisma from './lib/prisma';

const testEmail = `profile-test-${Date.now()}@example.com`;
const secondEmail = `profile-test-second-${Date.now()}@example.com`;
const password = 'SecurePass123';
const agent = request.agent(app);
let skillId: string;
let interestId: string;

const profilePayload = (overrides: Record<string, unknown> = {}) => ({
  name: 'Profile Student',
  education: 'Bachelor of Science',
  degreeBranch: 'Computer Science',
  experienceLevel: 'STUDENT',
  careerGoal: 'Become a backend developer',
  preferredDomains: ['Software Engineering'],
  learningPreference: 'PROJECT_BASED',
  weeklyLearningHours: 8,
  skills: [{ skillId, proficiency: 'BEGINNER' }],
  interests: [{ interestId, weight: 4 }],
  ...overrides,
});

beforeAll(async () => {
  await agent.post('/api/auth/register').send({ name: 'Profile Student', email: testEmail, password });
  const optionsResponse = await agent.get('/api/profile/options');
  skillId = optionsResponse.body.data.skills[0].id;
  interestId = optionsResponse.body.data.interests[0].id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [testEmail, secondEmail] } } });
  await prisma.$disconnect();
});

describe('profile API', () => {
  it('rejects unauthenticated profile access', async () => {
    const response = await request(app).get('/api/profile');
    expect(response.status).toBe(401);
  });

  it('returns catalog options without allowing arbitrary records', async () => {
    const response = await agent.get('/api/profile/options');
    expect(response.status).toBe(200);
    expect(response.body.data.skills.length).toBeGreaterThan(0);
    expect(response.body.data.interests.length).toBeGreaterThan(0);
  });

  it('creates and fetches the authenticated user profile', async () => {
    const saveResponse = await agent.put('/api/profile').send(profilePayload());
    const fetchResponse = await agent.get('/api/profile');

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.data.profile.name).toBe('Profile Student');
    expect(saveResponse.body.data.skills).toHaveLength(1);
    expect(saveResponse.body.data.interests).toHaveLength(1);
    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.data.profile.careerGoal).toBe('Become a backend developer');
  });

  it('updates profile fields and replaces selections without duplicates', async () => {
    const response = await agent.put('/api/profile').send(profilePayload({
      name: 'Updated Student',
      preferredDomains: ['Artificial Intelligence', 'Software Engineering'],
      skills: [],
      interests: [],
    }));
    const fetchResponse = await agent.get('/api/profile');

    expect(response.status).toBe(200);
    expect(fetchResponse.body.data.profile.name).toBe('Updated Student');
    expect(fetchResponse.body.data.profile.preferredDomains).toEqual(['Artificial Intelligence', 'Software Engineering']);
    expect(fetchResponse.body.data.skills).toHaveLength(0);
    expect(fetchResponse.body.data.interests).toHaveLength(0);
  });

  it('rejects invalid profile values', async () => {
    const response = await agent.put('/api/profile').send(profilePayload({
      experienceLevel: 'NOT_VALID',
      weeklyLearningHours: 81,
    }));
    expect(response.status).toBe(400);
  });

  it('rejects invalid skill IDs', async () => {
    const response = await agent.put('/api/profile').send(profilePayload({
      skills: [{ skillId: '00000000-0000-0000-0000-000000000000', proficiency: 'BEGINNER' }],
    }));
    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('skills');
  });

  it('rejects invalid interest IDs', async () => {
    const response = await agent.put('/api/profile').send(profilePayload({
      interests: [{ interestId: '00000000-0000-0000-0000-000000000000', weight: 3 }],
    }));
    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('interests');
  });

  it('rejects duplicate skill and interest relationships', async () => {
    const response = await agent.put('/api/profile').send(profilePayload({
      skills: [
        { skillId, proficiency: 'BEGINNER' },
        { skillId, proficiency: 'ADVANCED' },
      ],
      interests: [
        { interestId, weight: 2 },
        { interestId, weight: 5 },
      ],
    }));
    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('Skills cannot be duplicated');
  });

  it('does not expose one user profile to another user', async () => {
    const secondAgent = request.agent(app);
    await secondAgent.post('/api/auth/register').send({ name: 'Second Student', email: secondEmail, password });
    const response = await secondAgent.get('/api/profile');

    expect(response.status).toBe(200);
    expect(response.body.data.profile).toBeNull();
  });
});
