import { ProjectRecommendation, Resource } from '@prisma/client';
import { SkillGapResult } from '../services/skillGap';

interface RoadmapProfile {
  experienceLevel: string;
  learningPreference: string | null;
  weeklyLearningHours: number | null;
  careerGoal: string | null;
}

interface RoadmapCareer {
  title: string;
  domain: string;
  careerSkills: { skill: { name: string }; importance: 'REQUIRED' | 'PREFERRED'; minProficiency: string }[];
  careerResources: { resource: Resource }[];
  projectRecommendations: ProjectRecommendation[];
}

export interface RoadmapStage {
  stageNumber: number;
  title: string;
  estimatedDuration: string;
  skills: string[];
  topics: string[];
  objectives: string[];
  practiceTasks: string[];
  projectSuggestion: string;
  completionCriteria: string;
  resourceTitles: string[];
}

export interface RoadmapResult {
  careerId: string;
  careerName: string;
  personalizedFor: string;
  stages: RoadmapStage[];
}

const duration = (weeks: number, hours: number | null, experience: string) => {
  const multiplier = hours !== null && hours <= 5 ? 1.5 : hours !== null && hours >= 15 ? 0.75 : 1;
  const experienceMultiplier = experience === 'BEGINNER' || experience === 'STUDENT' ? 1.25 : experience === 'EXPERIENCED' ? 0.8 : 1;
  return `${Math.max(1, Math.ceil(weeks * multiplier * experienceMultiplier))} weeks`;
};

const stage = (stageNumber: number, title: string, weeks: number, skills: string[], topics: string[], objectives: string[], practiceTasks: string[], projectSuggestion: string, completionCriteria: string, profile: RoadmapProfile, resourceTitles: string[]): RoadmapStage => ({
  stageNumber,
  title,
  estimatedDuration: duration(weeks, profile.weeklyLearningHours, profile.experienceLevel),
  skills,
  topics,
  objectives,
  practiceTasks,
  projectSuggestion,
  completionCriteria,
  resourceTitles,
});

export const generateRoadmap = (careerId: string, career: RoadmapCareer, gap: SkillGapResult, profile: RoadmapProfile | null): RoadmapResult => {
  const effectiveProfile = profile || { experienceLevel: 'BEGINNER', learningPreference: null, weeklyLearningHours: null, careerGoal: null };
  const missingRequired = [...gap.missingSkills, ...gap.partialSkills].filter((skill) => skill.importance === 'REQUIRED');
  const preferredGaps = [...gap.missingSkills, ...gap.partialSkills].filter((skill) => skill.importance === 'PREFERRED');
  const foundationNames = ['JavaScript', 'Python', 'HTML/CSS', 'SQL', 'Git & GitHub', 'Linux'];
  const foundationGaps = missingRequired.filter((skill) => foundationNames.includes(skill.name));
  const coreGaps = missingRequired.filter((skill) => !foundationNames.includes(skill.name));
  const resources = career.careerResources.slice(0, 3).map(({ resource }) => resource.title);
  const stages: RoadmapStage[] = [];

  if (foundationGaps.length > 0 || ['BEGINNER', 'STUDENT'].includes(effectiveProfile.experienceLevel)) {
    stages.push(stage(1, 'Foundations', 3, foundationGaps.map((skill) => skill.name), foundationGaps.length ? foundationGaps.map((skill) => `${skill.name} fundamentals`) : ['Core programming and developer workflow'], ['Build a reliable base for the target career.', 'Practice the fundamentals with small exercises.'], ['Complete three short practice exercises.', 'Write a short reflection on what you learned.'], 'A small command-line or static project using the foundation skills.', 'Explain the core concepts and complete the practice tasks without copying solutions.', effectiveProfile, resources));
  }

  if (coreGaps.length > 0 || stages.length === 0) {
    const coreSkills = [...coreGaps, ...preferredGaps].slice(0, 6).map((skill) => skill.name);
    stages.push(stage(stages.length + 1, 'Core Skills', 5, coreSkills, coreSkills.map((skill) => `${skill} applied in realistic tasks`), ['Close the most important career skill gaps.', 'Apply each skill in a small end-to-end exercise.'], ['Build one feature per priority skill.', 'Review the work against the career requirements.'], career.projectRecommendations[0]?.title || `Build a focused ${career.title} practice project.`, 'Demonstrate each selected skill in a working example.', effectiveProfile, resources));
  }

  if (career.careerSkills.some((skill) => skill.minProficiency === 'ADVANCED') || career.domain.toLowerCase().includes('artificial') || career.domain.toLowerCase().includes('cloud')) {
    const advancedSkills = career.careerSkills.filter((skill) => skill.minProficiency === 'ADVANCED').map((skill) => skill.skill.name).slice(0, 5);
    stages.push(stage(stages.length + 1, 'Advanced and Specialized Skills', 5, advancedSkills, advancedSkills.map((skill) => `${skill} patterns and trade-offs`), ['Develop depth in the target career domain.', 'Practice making and explaining technical decisions.'], ['Compare two implementation approaches.', 'Document one design decision and its trade-off.'], career.projectRecommendations[1]?.title || `Extend the ${career.title} project with a production-minded feature.`, 'Explain the design choices and demonstrate a working advanced feature.', effectiveProfile, resources));
  }

  const project = career.projectRecommendations[0];
  stages.push(stage(stages.length + 1, 'Projects', 4, [...gap.existingSkills, ...gap.missingSkills].slice(0, 6).map((skill) => skill.name), ['Requirements, implementation, testing, and documentation'], ['Create evidence of applied learning.', 'Turn practice into a coherent project story.'], ['Plan the project in small milestones.', 'Add tests and document setup and decisions.'], project?.title || `Portfolio project for ${career.title}`, 'The project runs, is documented, and clearly demonstrates the selected skills.', effectiveProfile, resources));

  const portfolioSkills = career.careerSkills.some((skill) => skill.skill.name === 'Git & GitHub') ? ['Git & GitHub'] : [];
  stages.push(stage(stages.length + 1, 'Portfolio and Deployment', 3, portfolioSkills, ['README, deployment, testing, and presentation'], ['Package your strongest project for review.', 'Make the work easy for another person to understand.'], ['Deploy where appropriate for the career domain.', 'Write a concise project case study.'], project?.title || `Present a ${career.title} portfolio project`, 'A reviewer can run or inspect the project and understand your contribution.', effectiveProfile, resources));
  stages.push(stage(stages.length + 1, 'Interview and Career Preparation', 2, [], ['Role-specific interview topics', 'Project communication'], [`Prepare to discuss your path toward ${career.title}.`, 'Connect your career goal to concrete project evidence.'], ['Practice explaining one project in five minutes.', 'Complete a small set of role-relevant interview exercises.'], 'A concise portfolio walkthrough and interview question set.', 'You can clearly explain your skills, gaps addressed, and next learning step.', effectiveProfile, resources));

  return { careerId, careerName: career.title, personalizedFor: effectiveProfile.careerGoal || `${effectiveProfile.experienceLevel.toLowerCase()} learner`, stages };
};
