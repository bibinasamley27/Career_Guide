import { NotFoundError } from '../middleware/errorHandler';
import { findCareerContent } from '../repositories/careerContentRepository';

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const formatContent = (career: NonNullable<Awaited<ReturnType<typeof findCareerContent>>>) => {
  const careerSkillNames = career.careerSkills.map(({ skill }) => skill.name);
  const projects = career.projectRecommendations.map((project) => {
    const searchableText = normalize(`${project.title} ${project.description}`);
    const skills = careerSkillNames.filter((skill) => {
      const normalizedSkill = normalize(skill);
      return normalizedSkill.length >= 4 && searchableText.includes(normalizedSkill);
    });
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      difficulty: project.difficulty,
      skills,
      expectedOutcome: `A completed ${project.title} that demonstrates applied ${skills.slice(0, 2).join(' and ') || 'career'} skills.`,
    };
  });

  return {
    careerId: career.id,
    careerName: career.title,
    resources: career.careerResources.map(({ resource, relevance }) => ({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      url: resource.url,
      provider: resource.provider,
      level: resource.level,
      relevance,
    })),
    projects,
  };
};

export const getCareerContent = async (careerId: string) => {
  const career = await findCareerContent(careerId);
  if (!career) throw new NotFoundError('Career not found');
  return formatContent(career);
};

export const formatCareerContent = formatContent;
