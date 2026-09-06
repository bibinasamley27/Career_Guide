import { NotFoundError } from '../middleware/errorHandler';
import { findCareerContent } from '../repositories/careerContentRepository';
import { findCareerContentForUser } from '../repositories/careerContentRepository';
import { getSkillGap } from './skillGapService';
import { getProfile } from './profileService';
import { generateRoadmap } from '../tools/roadmapTool';

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

interface ContentCareer {
  id: string;
  title: string;
  careerSkills: { skill: { name: string } }[];
  careerResources: { resource: { id: string; title: string; type: string; url: string | null; provider: string; level: string; skills?: { skill: { name: string } }[] }; relevance: string | null }[];
  projectRecommendations: { id: string; title: string; description: string; difficulty: string; skills?: { skill: { name: string } }[] }[];
  roadmaps?: { stages: { skills: { skill: { name: string } }[] }[] }[];
}

const formatContent = (career: ContentCareer, gap?: Awaited<ReturnType<typeof getSkillGap>>, roadmapSkills: string[] = []) => {
  const careerSkillNames = career.careerSkills.map(({ skill }) => skill.name);
  const gapRank = new Map([
    ...((gap?.missingSkills || []).map((skill) => [normalize(skill.name), 3] as const)),
    ...((gap?.partialSkills || []).map((skill) => [normalize(skill.name), 2] as const)),
  ]);
  const gaps = [...(gap?.missingSkills || []), ...(gap?.partialSkills || [])].map((skill) => skill.name);
  const projects = career.projectRecommendations.map((project) => {
    const skills = project.skills?.map(({ skill }) => skill.name) || [];
    const gapScore = skills.reduce((score, skill) => score + (gapRank.get(normalize(skill)) || 0) + (roadmapSkills.some((item) => normalize(item) === normalize(skill)) ? 1 : 0), 0);
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      difficulty: project.difficulty,
      skills,
      expectedOutcome: `A completed ${project.title} that demonstrates applied ${skills.slice(0, 2).join(' and ') || 'career'} skills.`,
      relevanceScore: gapScore,
      relevanceReason: skills.filter((skill) => gapRank.has(normalize(skill))).length ? `Builds ${skills.filter((skill) => gapRank.has(normalize(skill))).join(', ')} from your current skill gaps.` : roadmapSkills.some((item) => skills.some((skill) => normalize(item) === normalize(skill))) ? 'Supports skills in your current roadmap stage.' : 'Builds skills from the selected career path.',
    };
  }).sort((left, right) => right.relevanceScore - left.relevanceScore || left.title.localeCompare(right.title));

  const resources = career.careerResources.map(({ resource, relevance }) => {
    const skills = resource.skills?.map(({ skill }) => skill.name) || [];
    const gapSkills = skills.filter((skill) => gapRank.has(normalize(skill)));
    const roadmapMatch = skills.some((skill) => roadmapSkills.some((item) => normalize(item) === normalize(skill)));
    return {
      id: resource.id,
      title: resource.title,
      type: resource.type,
      url: resource.url,
      provider: resource.provider,
      level: resource.level,
      relevance,
      skills,
      relevanceScore: gapSkills.reduce((score, skill) => score + (gapRank.get(normalize(skill)) || 0), 0) + (roadmapMatch ? 1 : 0),
      relevanceReason: gapSkills.length ? `Helps close your ${gapSkills.join(', ')} skill gap${gapSkills.length > 1 ? 's' : ''}.` : roadmapMatch ? 'Supports skills in your current roadmap stage.' : relevance || 'Relevant to the selected career.',
    };
  }).sort((left, right) => right.relevanceScore - left.relevanceScore || left.title.localeCompare(right.title));

  return {
    careerId: career.id,
    careerName: career.title,
    gaps,
    resources,
    projects,
  };
};

export const getCareerContent = async (careerId: string) => {
  const career = await findCareerContent(careerId);
  if (!career) throw new NotFoundError('Career not found');
  return formatContent(career);
};

export const getPersonalizedCareerContent = async (userId: string, careerId: string) => {
  const career = await findCareerContentForUser(userId, careerId);
  if (!career) throw new NotFoundError('Career not found');
  const [gap, profile] = await Promise.all([getSkillGap(userId, careerId), getProfile(userId)]);
  const roadmap = generateRoadmap(careerId, career, gap, profile.profile);
  const roadmapSkills = roadmap.stages.flatMap((stage) => stage.skills);
  return formatContent(career, gap, roadmapSkills);
};

export const formatCareerContent = formatContent;
