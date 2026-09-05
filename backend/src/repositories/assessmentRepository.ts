import prisma from '../lib/prisma';
import { AssessmentAnswers } from '../data/assessmentDefinition';

export const findLatestAssessment = (userId: string) =>
  prisma.assessment.findFirst({ where: { userId }, orderBy: { submittedAt: 'desc' } });

export const saveLatestAssessment = (userId: string, answers: AssessmentAnswers) =>
  prisma.$transaction(async (transaction) => {
    const latest = await transaction.assessment.findFirst({ where: { userId }, orderBy: { submittedAt: 'desc' } });
    const interestsSnapshot = {
      technicalInterests: answers.technicalInterests,
      workPreferences: answers.workPreferences,
    };
    const skillsSnapshot = {
      problemSolvingPreferences: answers.problemSolvingPreferences,
      confidenceLevel: answers.confidenceLevel,
    };
    const profileSnapshot = {
      learningPreference: answers.learningPreference,
      careerGoal: answers.careerGoal,
      workEnvironment: answers.workEnvironment,
    };

    if (latest) {
      return transaction.assessment.update({
        where: { id: latest.id },
        data: { submittedAt: new Date(), interestsSnapshot, skillsSnapshot, profileSnapshot },
      });
    }

    return transaction.assessment.create({
      data: { userId, interestsSnapshot, skillsSnapshot, profileSnapshot },
    });
  });
