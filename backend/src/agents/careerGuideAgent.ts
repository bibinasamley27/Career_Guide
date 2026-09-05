import { AgentRunStatus, Prisma } from '@prisma/client';
import { AgentExecutionLog, CareerGuideResult } from './agentTypes';
import { createAgentRun, findAgentCareer, finishAgentRun } from '../repositories/agentRepository';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { profileTool } from '../tools/profileTool';
import { careerMatchingTool } from '../tools/careerMatchingTool';
import { skillGapTool } from '../tools/skillGapTool';
import { generateRoadmap } from '../tools/roadmapTool';
import { formatCareerContent } from '../services/careerContentService';

const validateResult = (result: CareerGuideResult, careerSkillNames: Set<string>) => {
  if (!result.roadmap.stages.length) throw new ValidationError('Roadmap validation failed: no stages generated');
  const unsupportedSkills = result.roadmap.stages.flatMap((stage) => stage.skills).filter((skill) => skill && !careerSkillNames.has(skill));
  if (unsupportedSkills.length) throw new ValidationError('Roadmap validation failed: unsupported career skill');
  if (result.resources.some((resource) => resource.url !== null && !/^https?:\/\//.test(resource.url))) throw new ValidationError('Resource validation failed: invalid database URL');
  if (result.projects.some((project) => project.skills.some((skill) => !careerSkillNames.has(skill)))) throw new ValidationError('Project validation failed: unsupported career skill');
};

export const runCareerGuide = async (userId: string, careerId: string): Promise<CareerGuideResult> => {
  const career = await findAgentCareer(careerId);
  if (!career) throw new NotFoundError('Career not found');

  const run = await createAgentRun(userId, careerId);
  const executionLog: AgentExecutionLog[] = [];
  try {
    // Each step consumes the previous tool's structured result; no hidden reasoning is persisted.
    const profile = await profileTool(userId);
    executionLog.push({ step: 'profile', status: 'completed' });
    const match = await careerMatchingTool(userId, careerId);
    if (!match) throw new ValidationError('Career matching result is unavailable');
    executionLog.push({ step: 'career-matching', status: 'completed' });
    const skillGap = await skillGapTool(userId, careerId);
    executionLog.push({ step: 'skill-gap', status: 'completed' });

    const roadmap = generateRoadmap(careerId, career, skillGap, profile.profile);
    executionLog.push({ step: 'roadmap', status: 'completed' });
    const content = formatCareerContent(career);
    executionLog.push({ step: 'resources-projects', status: 'completed' });
    const result: CareerGuideResult = {
      career: { id: career.id, name: career.title, domain: career.domain, description: career.description },
      match,
      skillGap,
      roadmap,
      resources: content.resources,
      projects: content.projects,
      summary: `${career.title} is a ${match.matchScore}/100 guidance match. Start with ${skillGap.prioritySkills.slice(0, 2).map((skill) => skill.name).join(' and ') || 'your portfolio project'}, then work through the roadmap at a pace that fits ${profile.profile?.weeklyLearningHours || 'your available'} weekly hours.`,
      agentStatus: 'completed',
    };
    validateResult(result, new Set(career.careerSkills.map(({ skill }) => skill.name)));
    executionLog.push({ step: 'evaluation', status: 'completed' });
    await finishAgentRun(run.id, {
      status: AgentRunStatus.SUCCESS,
      toolExecutionLog: executionLog as unknown as Prisma.InputJsonValue,
      resultSummary: result.summary,
      resultRefId: career.id,
    });
    return result;
  } catch (error) {
    const failedStep = executionLog.length < 6 ? (['profile', 'career-matching', 'skill-gap', 'roadmap', 'resources-projects', 'evaluation'] as const)[executionLog.length] : 'evaluation';
    executionLog.push({ step: failedStep, status: 'failed' });
    await finishAgentRun(run.id, {
      status: AgentRunStatus.FAILED,
      toolExecutionLog: executionLog as unknown as Prisma.InputJsonValue,
      errorMessage: error instanceof Error ? error.message : 'Career guide execution failed',
    });
    throw error;
  }
};
