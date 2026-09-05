import { ValidationError } from '../middleware/errorHandler';
import { AssessmentAnswers } from '../data/assessmentDefinition';
import { findLatestAssessment, saveLatestAssessment } from '../repositories/assessmentRepository';

const asAnswers = (assessment: NonNullable<Awaited<ReturnType<typeof findLatestAssessment>>>) => {
  const interests = assessment.interestsSnapshot as { technicalInterests: string[]; workPreferences: string[] };
  const skills = assessment.skillsSnapshot as { problemSolvingPreferences: string[]; confidenceLevel: number };
  const profile = assessment.profileSnapshot as { learningPreference: string[]; careerGoal: string; workEnvironment: string[] };

  return {
    technicalInterests: interests.technicalInterests,
    workPreferences: interests.workPreferences,
    problemSolvingPreferences: skills.problemSolvingPreferences,
    learningPreference: profile.learningPreference,
    careerGoal: profile.careerGoal,
    confidenceLevel: skills.confidenceLevel,
    workEnvironment: profile.workEnvironment,
  } satisfies AssessmentAnswers;
};

export const getLatestAssessment = async (userId: string) => {
  const assessment = await findLatestAssessment(userId);
  return assessment ? { id: assessment.id, submittedAt: assessment.submittedAt, answers: asAnswers(assessment) } : null;
};

export const saveAssessment = async (userId: string, answers: AssessmentAnswers) => {
  const assessment = await saveLatestAssessment(userId, answers);
  return { id: assessment.id, submittedAt: assessment.submittedAt, answers };
};

export const ensureAssessmentExists = (assessment: Awaited<ReturnType<typeof getLatestAssessment>>) => {
  if (!assessment) throw new ValidationError('Assessment not found');
  return assessment;
};
