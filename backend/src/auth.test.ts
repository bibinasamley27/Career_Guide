import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { app } from './index';
import prisma from './lib/prisma';

const testEmail = `auth-test-${Date.now()}@example.com`;
const testPassword = 'SecurePass123';
const agent = request.agent(app);

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
});

describe('authentication API', () => {
  it('rejects unauthenticated access to /me', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.data).toBeUndefined();
  });

  it('rejects invalid registration input', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: 'weak',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('name');
    expect(response.body.error.message).toContain('email');
  });

  it('registers a user without exposing the password hash', async () => {
    const response = await agent.post('/api/auth/register').send({
      name: 'Test Candidate',
      email: testEmail,
      password: testPassword,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({ name: 'Test Candidate', email: testEmail });
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects duplicate email registration', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Another Candidate',
      email: testEmail,
      password: testPassword,
    });

    expect(response.status).toBe(409);
  });

  it('allows an authenticated request after registration', async () => {
    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(testEmail);
  });

  it('rejects incorrect passwords', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'WrongPassword123',
    });

    expect(response.status).toBe(401);
  });

  it('rejects invalid login input', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'bad-email',
      password: '',
    });

    expect(response.status).toBe(400);
  });

  it('logs out and invalidates the session cookie', async () => {
    const logoutResponse = await agent.post('/api/auth/logout');
    const meResponse = await agent.get('/api/auth/me');

    expect(logoutResponse.status).toBe(200);
    expect(meResponse.status).toBe(401);
  });

  it('allows login with the correct password', async () => {
    const response = await agent.post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(testEmail);
  });
});
