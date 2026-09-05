import { z } from 'zod';
import { AiToolDeclaration } from '../ai';
import { profileTool } from '../tools/profileTool';
import { careerMatchingTool } from '../tools/careerMatchingTool';
import { skillGapTool } from '../tools/skillGapTool';
import { generateRoadmap } from '../tools/roadmapTool';
import { getCareerContent } from '../services/careerContentService';
import { getCareerRecommendations } from '../services/careerMatchingService';
import { getSavedCareerList } from '../services/savedCareerService';
import { findAgentCareer } from '../repositories/agentRepository';
import { ValidationError } from '../middleware/errorHandler';

const careerIdArgs = z.object({ careerId: z.string().uuid() }).strict();
const noArgs = z.object({}).strict();

const declarations: AiToolDeclaration[] = [
  { name: 'get_user_profile', description: 'Get the authenticated student profile, skills, interests, and latest assessment.', parameters: { type: 'object', properties: {} } },
  { name: 'get_career_recommendations', description: 'Run the deterministic career recommendation engine for the authenticated student.', parameters: { type: 'object', properties: {} } },
  { name: 'get_career_details', description: 'Get requirements, interests, resources, and projects for a career.', parameters: { type: 'object', properties: { careerId: { type: 'string', format: 'uuid' } }, required: ['careerId'] } },
  { name: 'get_skill_gap', description: 'Get the authoritative skill gap for the authenticated student and a career.', parameters: { type: 'object', properties: { careerId: { type: 'string', format: 'uuid' } }, required: ['careerId'] } },
  { name: 'get_roadmap', description: 'Generate the existing deterministic personalized roadmap for a career.', parameters: { type: 'object', properties: { careerId: { type: 'string', format: 'uuid' } }, required: ['careerId'] } },
  { name: 'get_resources', description: 'Get database-backed learning resources for a career. Never invent URLs.', parameters: { type: 'object', properties: { careerId: { type: 'string', format: 'uuid' } }, required: ['careerId'] } },
  { name: 'get_projects', description: 'Get database-backed project recommendations for a career.', parameters: { type: 'object', properties: { careerId: { type: 'string', format: 'uuid' } }, required: ['careerId'] } },
  { name: 'get_saved_careers', description: 'Get careers saved by the authenticated student.', parameters: { type: 'object', properties: {} } },
];

const safeCareer = (career: NonNullable<Awaited<ReturnType<typeof findAgentCareer>>>) => ({
  id: career.id,
  name: career.title,
  description: career.description,
  domain: career.domain,
  requiredSkills: career.careerSkills.filter((item) => item.importance === 'REQUIRED').map((item) => ({ name: item.skill.name, minProficiency: item.minProficiency })),
  preferredSkills: career.careerSkills.filter((item) => item.importance === 'PREFERRED').map((item) => ({ name: item.skill.name, minProficiency: item.minProficiency })),
  interests: career.careerInterests.map((item) => item.interest.name),
});

const requireCareer = async (careerId: string) => {
  const career = await findAgentCareer(careerId);
  if (!career) throw new ValidationError('Career not found');
  return career;
};

export const createToolRegistry = (userId: string) => {
  const handlers: Record<string, (args: unknown) => Promise<unknown>> = {
    get_user_profile: async (args) => { noArgs.parse(args); return profileTool(userId); },
    get_career_recommendations: async (args) => { noArgs.parse(args); return getCareerRecommendations(userId); },
    get_career_details: async (args) => safeCareer(await requireCareer(careerIdArgs.parse(args).careerId)),
    get_skill_gap: async (args) => skillGapTool(userId, careerIdArgs.parse(args).careerId),
    get_roadmap: async (args) => {
      const careerId = careerIdArgs.parse(args).careerId;
      const [career, profile, gap] = await Promise.all([requireCareer(careerId), profileTool(userId), skillGapTool(userId, careerId)]);
      return generateRoadmap(careerId, career, gap, profile.profile);
    },
    get_resources: async (args) => (await getCareerContent(careerIdArgs.parse(args).careerId)).resources,
    get_projects: async (args) => (await getCareerContent(careerIdArgs.parse(args).careerId)).projects,
    get_saved_careers: async (args) => { noArgs.parse(args); return getSavedCareerList(userId); },
  };

  return {
    declarations,
    execute: async (name: string, args: unknown) => {
      const handler = handlers[name];
      if (!handler) throw new ValidationError('Unsupported assistant tool');
      return handler(args);
    },
  };
};