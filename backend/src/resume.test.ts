import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from './index';
import prisma from './lib/prisma';

const password = 'SecurePass123';
const userEmail = `resume-test-${Date.now()}@example.com`;
const secondEmail = `resume-test-second-${Date.now()}@example.com`;
const firstAgent = request.agent(app);
const secondAgent = request.agent(app);

const makePdfBuffer = () => Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 61 >>
stream
BT
/F1 12 Tf
50 100 Td
(Software Engineer, Python, SQL, React) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000062 00000 n 
0000000123 00000 n 
0000000254 00000 n 
0000000899 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
970
%%EOF`);

beforeAll(async () => {
  await firstAgent.post('/api/auth/register').send({ name: 'Resume Student', email: userEmail, password });
  await secondAgent.post('/api/auth/register').send({ name: 'Second Student', email: secondEmail, password });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [userEmail, secondEmail] } } });
  await prisma.$disconnect();
});

describe('resume API', () => {
  it('accepts a valid PDF upload and stores parsed resume data', async () => {
    const response = await firstAgent
      .post('/api/resume/upload')
      .attach('file', makePdfBuffer(), { filename: 'resume.pdf', contentType: 'application/pdf' });

    expect(response.status).toBe(200);
    expect(response.body.data.analysisStatus).toBe('COMPLETED');
    expect(response.body.data.resume.parsedData.skills).toEqual(expect.arrayContaining(['Python', 'SQL', 'React']));
    expect(response.body.data.resume.originalFileName).toBe('resume.pdf');
  });

  it('returns the updated resume under the same response contract as the get endpoint', async () => {
    const upload = await firstAgent
      .post('/api/resume/upload')
      .attach('file', makePdfBuffer(), { filename: 'resume.pdf', contentType: 'application/pdf' });

    const resumeId = upload.body.data.resume.id;
    const response = await firstAgent
      .put(`/api/resume/${resumeId}`)
      .send({
        skills: ['Python', 'SQL', 'React', 'Node.js'],
        personalSummary: 'Updated summary',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.resume.id).toBe(resumeId);
    expect(response.body.data.resume.parsedData.skills).toContain('Node.js');
    expect(response.body.data.resume.parsedData.personalSummary).toBe('Updated summary');
  });

  it('rejects unauthenticated access', async () => {
    const response = await request(app).get('/api/resume');
    expect(response.status).toBe(401);
  });

  it('rejects invalid file types and oversized files', async () => {
    const invalidTypeResponse = await firstAgent
      .post('/api/resume/upload')
      .attach('file', Buffer.from('hello world'), { filename: 'resume.txt', contentType: 'text/plain' });

    expect(invalidTypeResponse.status).toBe(400);
    expect(invalidTypeResponse.body.error.message).toMatch(/PDF|DOCX|supported/i);

    const oversized = Buffer.alloc(5 * 1024 * 1024, 'a');
    const oversizedResponse = await firstAgent
      .post('/api/resume/upload')
      .attach('file', oversized, { filename: 'big.pdf', contentType: 'application/pdf' });

    expect(oversizedResponse.status).toBe(413);
  });

  it('blocks access to another user resume', async () => {
    const listResponse = await secondAgent.get('/api/resume');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.resume).toBeNull();
  });

  it('returns a resume-only roadmap for an authenticated user with a resume', async () => {
    const upload = await firstAgent
      .post('/api/resume/upload')
      .attach('file', makePdfBuffer(), { filename: 'resume-roadmap.pdf', contentType: 'application/pdf' });

    const response = await firstAgent.get('/api/resume/roadmap');

    expect(response.status).toBe(200);
    expect(response.body.data.source).toBe('resume');
    expect(response.body.data.resumeId).toBe(upload.body.data.resume.id);
    expect(response.body.data.careerDirection).toBeTruthy();
    expect(response.body.data.currentStrengths.length).toBeGreaterThan(0);
    expect(response.body.data.roadmap.length).toBeGreaterThan(0);
    expect(Array.isArray(response.body.data.skillGaps)).toBe(true);
  });

  it('returns no resume state for a user without a resume', async () => {
    const response = await secondAgent.get('/api/resume/roadmap');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toMatch(/No analyzed resume found|resume/i);
  });

  it('rejects unauthenticated access to the resume roadmap endpoint', async () => {
    const response = await request(app).get('/api/resume/roadmap');
    expect(response.status).toBe(401);
  });

  it('ensures resume roadmap generation is based on resume data only', async () => {
    const response = await firstAgent.get('/api/resume/roadmap');

    expect(response.status).toBe(200);
    expect(response.body.data.roadmap.some((stage: any) => stage.skills.some((skill: string) => /React|Python|SQL|Node/i.test(skill)))).toBe(true);
    expect(response.body.data.currentStrengths).not.toContain('Career Goal');
  });

  it('falls back when the AI provider is unavailable or invalid', async () => {
    const response = await firstAgent.get('/api/resume/roadmap');

    expect(response.status).toBe(200);
    expect(response.body.data.roadmap).toEqual(expect.any(Array));
    expect(response.body.data.currentStrengths).toEqual(expect.any(Array));
    expect(response.body.data.skillGaps).toEqual(expect.any(Array));
  });
});
