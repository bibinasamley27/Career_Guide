import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './index';
import prisma from './lib/prisma';
import { calculateCareerMatch, MatchingCareer, rankCareerMatches } from './services/careerMatching';

const career: MatchingCareer = {
  id: 'career-1',
  title: 'Full Stack Developer',
  description: 'Builds end-to-end applications.',
  domain: 'Software Engineering',
  skills: [
    { name: 'JavaScript', importance: 'REQUIRED', minProficiency: 'INTERMEDIATE' },
    { name: 'React', importance: 'REQUIRED', minProficiency: 'INTERMEDIATE' },
    { name: 'Node.js', importance: 'REQUIRED', minProficiency: 'INTERMEDIATE' },
  ],
  interests: [
    { name: 'Web Development', weight: 1 },
    { name: 'Backend Architecture', weight: 1 },
  ],
};

const student = (overrides = {}) => ({
  profile: {
    education: 'Computer Science',
    degreeBranch: 'Software Engineering',
    experienceLevel: 'INTERMEDIATE',
    preferredDomains: ['Software Engineering'],
    careerGoal: 'Become a full stack developer',
    learningPreference: 'PROJECT_BASED',
  },
  skills: [
    { name: 'JavaScript', proficiency: 'INTERMEDIATE' },
    { name: 'React', proficiency: 'INTERMEDIATE' },
    { name: 'Node.js', proficiency: 'INTERMEDIATE' },
  ],
  interests: [{ name: 'Web Development', weight: 5 }, { name: 'Backend Architecture', weight: 5 }],
  assessment: {
    technicalInterests: ['Web Development'],
    workPreferences: ['building_applications'],
    problemSolvingPreferences: ['logical_algorithmic'],
    learningPreference: ['hands_on_projects'],
    careerGoal: 'software_development',
    confidenceLevel: 4,
    workEnvironment: ['team_development'],
  },
  ...overrides,
});

describe('deterministic career matching', () => {
  it('gives full skill alignment when every required skill meets proficiency', () => {
    const result = calculateCareerMatch(student(), career);
    expect(result.matchedSkills).toEqual(['JavaScript', 'React', 'Node.js']);
    expect(result.missingSkills).toEqual([]);
  });

  it('returns partial and no skill matches without failing', () => {
    const partial = calculateCareerMatch(student({ skills: [{ name: 'JavaScript', proficiency: 'INTERMEDIATE' }] }), career);
    const none = calculateCareerMatch(student({ skills: [] }), career);
    expect(partial.matchedSkills).toEqual(['JavaScript']);
    expect(partial.missingSkills).toContain('Node.js');
    expect(none.matchedSkills).toEqual([]);
    expect(none.missingSkills).toHaveLength(3);
  });

  it('handles full, partial, and missing interest alignment', () => {
    const full = calculateCareerMatch(student(), career);
    const partial = calculateCareerMatch(student({ interests: [{ name: 'Web Development', weight: 5 }] }), career);
    const none = calculateCareerMatch(student({ interests: [], assessment: null }), career);
    expect(full.matchScore).toBeGreaterThan(partial.matchScore);
    expect(partial.matchingInterests).toEqual(['Web Development']);
    expect(none.matchingInterests).toEqual([]);
  });

  it('uses assessment signals and handles missing profile or assessment', () => {
    const assessmentOnly = calculateCareerMatch(student({ profile: null, skills: [], interests: [] }), career);
    const noAssessment = calculateCareerMatch(student({ assessment: null }), career);
    const noData = calculateCareerMatch({ profile: null, skills: [], interests: [], assessment: null }, career);
    expect(assessmentOnly.matchScore).toBeGreaterThan(0);
    expect(noAssessment.matchScore).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(noData.matchScore)).toBe(true);
  });

  it('ranks by descending score and limits the result count', () => {
    const lower = { ...career, id: 'career-2', title: 'Other Career', skills: [], interests: [] };
    const results = rankCareerMatches(student(), [lower, career], 1);
    expect(results).toHaveLength(1);
    expect(results[0].careerName).toBe('Full Stack Developer');
  });

  it('builds an explanation containing matched and missing information', () => {
    const result = calculateCareerMatch(student({ skills: [{ name: 'React', proficiency: 'INTERMEDIATE' }] }), career);
    expect(result.explanation).toContain('Web Development');
    expect(result.explanation).toContain('React');
    expect(result.explanation).toContain('JavaScript');
    expect(result.nextStep).toContain('JavaScript');
  });
});

const apiEmail = `matching-test-${Date.now()}@example.com`;
const secondEmail = `matching-test-second-${Date.now()}@example.com`;
const password = 'SecurePass123';
const apiAgent = request.agent(app);

beforeAll(async () => {
  await apiAgent.post('/api/auth/register').send({ name: 'Matching Student', email: apiEmail, password });
  const options = await apiAgent.get('/api/profile/options');
  await apiAgent.put('/api/profile').send({
    name: 'Matching Student',
    education: 'Computer Science',
    degreeBranch: 'Software Engineering',
    experienceLevel: 'INTERMEDIATE',
    careerGoal: 'Become a full stack developer',
    preferredDomains: ['Software Engineering'],
    learningPreference: 'PROJECT_BASED',
    weeklyLearningHours: 8,
    skills: [{ skillId: options.body.data.skills[0].id, proficiency: 'INTERMEDIATE' }],
    interests: [{ interestId: options.body.data.interests[0].id, weight: 5 }],
  });
  await apiAgent.post('/api/assessment').send({ answers: {
    technicalInterests: ['Web Development'],
    workPreferences: ['building_applications'],
    problemSolvingPreferences: ['logical_algorithmic'],
    learningPreference: ['hands_on_projects'],
    careerGoal: 'software_development',
    confidenceLevel: 4,
    workEnvironment: ['team_development'],
  } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [apiEmail, secondEmail] } } });
  await prisma.$disconnect();
});

describe('career recommendations API', () => {
  it('rejects unauthenticated requests', async () => {
    const response = await request(app).get('/api/careers/recommendations');
    expect(response.status).toBe(401);
  });

  it('returns ranked recommendations from the authenticated student data', async () => {
    const response = await apiAgent.get('/api/careers/recommendations');
    expect(response.status).toBe(200);
    expect(response.body.data.recommendations).toHaveLength(5);
    expect(response.body.data.hasProfile).toBe(true);
    expect(response.body.data.hasAssessment).toBe(true);
    expect(response.body.data.recommendations[0]).toHaveProperty('explanation');
  });

  it('does not reuse another user profile or assessment', async () => {
    const secondAgent = request.agent(app);
    await secondAgent.post('/api/auth/register').send({ name: 'Other Student', email: secondEmail, password });
    const response = await secondAgent.get('/api/careers/recommendations');
    expect(response.status).toBe(200);
    expect(response.body.data.hasProfile).toBe(false);
    expect(response.body.data.hasAssessment).toBe(false);
  });
});
