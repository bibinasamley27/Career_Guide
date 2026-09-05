import { ValidationError } from '../middleware/errorHandler';
import { findMatchingInputs } from '../repositories/careerMatchingRepository';
import { calculateCareerMatch, MatchingAssessment, MatchingCareer, MatchingStudent, rankCareerMatches } from './careerMatching';

const readAssessment = (assessment: { interestsSnapshot: unknown; skillsSnapshot: unknown; profileSnapshot: unknown } | undefined): MatchingAssessment | null => {
  if (!assessment) return null;
  const interests = assessment.interestsSnapshot as { technicalInterests: string[]; workPreferences: string[] };
  const skills = assessment.skillsSnapshot as { problemSolvingPreferences: string[]; confidenceLevel: number };
  const profile = assessment.profileSnapshot as { learningPreference: string[]; careerGoal: string; workEnvironment: string[] };
  return { ...interests, ...skills, ...profile };
};

export const getCareerRecommendations = async (userId: string) => {
  const { user, careers } = await findMatchingInputs(userId);
  if (!user) throw new ValidationError('Authenticated user is missing');

  const student: MatchingStudent = {
    profile: user.profile,
    skills: user.skills.map(({ skill, proficiency }) => ({ name: skill.name, proficiency })),
    interests: user.interests.map(({ interest, weight }) => ({ name: interest.name, weight })),
    assessment: readAssessment(user.assessments[0]),
  };
  const careerKnowledge: MatchingCareer[] = careers.map((career) => ({
    id: career.id,
    title: career.title,
    description: career.description,
    domain: career.domain,
    skills: career.careerSkills.map(({ skill, importance, minProficiency }) => ({ name: skill.name, importance, minProficiency })),
    interests: career.careerInterests.map(({ interest, weight }) => ({ name: interest.name, weight })),
  }));

  return {
    recommendations: rankCareerMatches(student, careerKnowledge),
    hasProfile: Boolean(user.profile),
    hasAssessment: Boolean(user.assessments[0]),
  };
};

export const getCareerMatch = async (userId: string, careerId: string) => {
  const { user, careers } = await findMatchingInputs(userId);
  if (!user) throw new ValidationError('Authenticated user is missing');
  const career = careers.find((item) => item.id === careerId);
  if (!career) return null;

  const student: MatchingStudent = {
    profile: user.profile,
    skills: user.skills.map(({ skill, proficiency }) => ({ name: skill.name, proficiency })),
    interests: user.interests.map(({ interest, weight }) => ({ name: interest.name, weight })),
    assessment: readAssessment(user.assessments[0]),
  };
  const careerKnowledge: MatchingCareer = {
    id: career.id,
    title: career.title,
    description: career.description,
    domain: career.domain,
    skills: career.careerSkills.map(({ skill, importance, minProficiency }) => ({ name: skill.name, importance, minProficiency })),
    interests: career.careerInterests.map(({ interest, weight }) => ({ name: interest.name, weight })),
  };
  return calculateCareerMatch(student, careerKnowledge);
};
