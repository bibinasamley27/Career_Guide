import { AgentRunStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export const createAgentRun = (userId: string, careerId: string) =>
  prisma.agentRun.create({
    data: {
      userId,
      goal: `Create a personalized learning roadmap for career ${careerId}`,
      status: AgentRunStatus.RUNNING,
      selectedCapabilities: ['profile', 'career-matching', 'skill-gap', 'roadmap', 'resources-projects', 'evaluation'],
    },
  });

export const finishAgentRun = (runId: string, data: {
  status: AgentRunStatus;
  toolExecutionLog: Prisma.InputJsonValue;
  resultSummary?: string;
  resultRefId?: string;
  errorMessage?: string;
}) => prisma.agentRun.update({ where: { id: runId }, data: { ...data, finishedAt: new Date() } });

export const findAgentCareer = (careerId: string) =>
  prisma.career.findUnique({
    where: { id: careerId },
    include: {
      careerSkills: { include: { skill: true }, orderBy: { skill: { name: 'asc' } } },
      careerInterests: { include: { interest: true }, orderBy: { interest: { name: 'asc' } } },
      careerResources: { include: { resource: true }, orderBy: { resource: { title: 'asc' } } },
      projectRecommendations: { orderBy: { title: 'asc' } },
    },
  });
