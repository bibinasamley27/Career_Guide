export interface MatchingProfile {
  education: string;
  degreeBranch: string | null;
  experienceLevel: string;
  preferredDomains: string[];
  careerGoal: string | null;
  learningPreference: string | null;
}

export interface MatchingStudentSkill {
  name: string;
  proficiency: string;
}

export interface MatchingStudentInterest {
  name: string;
  weight: number;
}

export interface MatchingAssessment {
  technicalInterests: string[];
  workPreferences: string[];
  problemSolvingPreferences: string[];
  learningPreference: string[];
  careerGoal: string;
  confidenceLevel: number;
  workEnvironment: string[];
}

export interface MatchingCareerSkill {
  name: string;
  importance: string;
  minProficiency: string;
}

export interface MatchingCareerInterest {
  name: string;
  weight: number;
}

export interface MatchingCareer {
  id: string;
  title: string;
  description: string;
  domain: string;
  skills: MatchingCareerSkill[];
  interests: MatchingCareerInterest[];
}

export interface MatchingStudent {
  profile: MatchingProfile | null;
  skills: MatchingStudentSkill[];
  interests: MatchingStudentInterest[];
  assessment: MatchingAssessment | null;
}

export interface CareerMatch {
  careerId: string;
  careerName: string;
  matchScore: number;
  explanation: string;
  matchedSkills: string[];
  missingSkills: string[];
  matchingInterests: string[];
  nextStep: string;
}

const proficiencyRank: Record<string, number> = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };
const experienceFactor: Record<string, number> = {
  BEGINNER: 0.25,
  STUDENT: 0.45,
  ENTRY_LEVEL: 0.6,
  INTERMEDIATE: 0.8,
  EXPERIENCED: 1,
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const containsTerm = (source: string, term: string) => normalize(source).includes(normalize(term));

const assessmentCareerTerms: Record<string, string[]> = {
  software_development: ['software', 'developer', 'engineering'],
  ai_ml: ['ai', 'machine learning', 'artificial intelligence'],
  data: ['data', 'analyst', 'scientist'],
  product_building: ['product', 'software', 'developer'],
  cybersecurity: ['cybersecurity', 'security'],
  cloud_devops: ['cloud', 'devops', 'infrastructure'],
  explore_technology: [],
};

const interestAlignment = (student: MatchingStudent, career: MatchingCareer) => {
  const studentInterests = new Map(student.interests.map((interest) => [normalize(interest.name), interest.weight / 5]));
  const assessmentInterests = new Set((student.assessment?.technicalInterests || []).map(normalize));
  const totalWeight = career.interests.reduce((total, interest) => total + Math.max(interest.weight, 0), 0);
  if (!totalWeight) return { score: 0, matching: [] as string[] };

  let weightedMatch = 0;
  const matching: string[] = [];
  for (const interest of career.interests) {
    const key = normalize(interest.name);
    const profileWeight = studentInterests.get(key) || 0;
    const assessmentWeight = assessmentInterests.has(key) ? 1 : 0;
    const signal = Math.max(profileWeight, assessmentWeight);
    if (signal > 0) {
      weightedMatch += interest.weight * signal;
      matching.push(interest.name);
    }
  }
  return { score: Math.min(weightedMatch / totalWeight, 1), matching };
};

const skillAlignment = (student: MatchingStudent, career: MatchingCareer) => {
  const studentSkills = new Map(student.skills.map((skill) => [normalize(skill.name), proficiencyRank[skill.proficiency] || 0]));
  const totalWeight = career.skills.reduce((total, skill) => total + (skill.importance === 'REQUIRED' ? 1 : 0.5), 0);
  if (!totalWeight) return { score: 0, matched: [] as string[], missing: [] as string[] };

  let matchedWeight = 0;
  const matched: string[] = [];
  const missing: string[] = [];
  for (const careerSkill of career.skills) {
    const requiredRank = proficiencyRank[careerSkill.minProficiency] || 1;
    const userRank = studentSkills.get(normalize(careerSkill.name)) || 0;
    const weight = careerSkill.importance === 'REQUIRED' ? 1 : 0.5;
    if (userRank >= requiredRank) {
      matchedWeight += weight;
      matched.push(careerSkill.name);
    } else {
      missing.push(careerSkill.name);
    }
  }
  return { score: matchedWeight / totalWeight, matched, missing };
};

const educationExperienceAlignment = (student: MatchingStudent, career: MatchingCareer) => {
  if (!student.profile) return 0;
  const educationText = `${student.profile.education} ${student.profile.degreeBranch || ''}`;
  const domainFit = containsTerm(educationText, career.domain) || containsTerm(educationText, career.title) ? 1 : 0.5;
  const experienceFit = experienceFactor[student.profile.experienceLevel] || 0;
  const confidenceFit = student.assessment ? student.assessment.confidenceLevel / 5 : 0.5;
  return domainFit * 0.4 + experienceFit * 0.4 + confidenceFit * 0.2;
};

const goalDomainAlignment = (student: MatchingStudent, career: MatchingCareer) => {
  const profile = student.profile;
  const careerText = `${career.title} ${career.domain}`;
  let score = 0;

  if (profile?.preferredDomains.some((domain) => containsTerm(career.domain, domain) || containsTerm(domain, career.domain))) score = Math.max(score, 1);
  if (profile?.careerGoal && containsTerm(careerText, profile.careerGoal)) score = Math.max(score, 0.8);

  const assessmentGoalTerms = assessmentCareerTerms[student.assessment?.careerGoal || ''] || [];
  if (assessmentGoalTerms.some((term) => containsTerm(careerText, term))) score = Math.max(score, 1);

  const workSignals: Record<string, string[]> = {
    building_applications: ['developer', 'software', 'engineering'],
    analyzing_data: ['data', 'analyst', 'scientist'],
    designing_user_experiences: ['design', 'frontend', 'ui'],
    managing_systems: ['cloud', 'devops', 'infrastructure', 'backend'],
    researching_technology: ['ai', 'research', 'scientist'],
    working_with_business_requirements: ['analyst', 'product', 'business'],
  };
  for (const preference of student.assessment?.workPreferences || []) {
    if ((workSignals[preference] || []).some((term) => containsTerm(careerText, term))) score = Math.max(score, 0.6);
  }
  return score;
};

const nextStepFor = (missingSkills: string[], learningPreference: string | null) => {
  if (missingSkills.length === 0) return 'Build a portfolio project that demonstrates your current strengths.';
  const format = learningPreference === 'PROJECT_BASED' ? 'through a hands-on project' : learningPreference === 'GUIDED_COURSE' ? 'through a guided course' : 'with focused practice';
  return `Prioritize ${missingSkills.slice(0, 2).join(' and ')} ${format}.`;
};

export const calculateCareerMatch = (student: MatchingStudent, career: MatchingCareer): CareerMatch => {
  const interests = interestAlignment(student, career);
  const skills = skillAlignment(student, career);
  const educationExperience = educationExperienceAlignment(student, career);
  const goalDomain = goalDomainAlignment(student, career);
  const score = Math.round(Math.max(0, Math.min(100, interests.score * 30 + skills.score * 30 + educationExperience * 20 + goalDomain * 20)));
  const missingText = skills.missing.length ? ` You should next develop ${skills.missing.slice(0, 3).join(', ')}.` : '';
  const interestText = interests.matching.length ? ` Your interests align with ${interests.matching.join(', ')}.` : ' Your current interests do not directly overlap with this career yet.';
  const skillText = skills.matched.length ? ` You already have ${skills.matched.slice(0, 3).join(', ')}.` : ' No required career skills currently meet the target proficiency.';

  return {
    careerId: career.id,
    careerName: career.title,
    matchScore: score,
    explanation: `This is a ${score}/100 guidance match.${interestText}${skillText}${missingText}`,
    matchedSkills: skills.matched,
    missingSkills: skills.missing,
    matchingInterests: interests.matching,
    nextStep: nextStepFor(skills.missing, student.profile?.learningPreference || null),
  };
};

export const rankCareerMatches = (student: MatchingStudent, careers: MatchingCareer[], limit = 5) =>
  careers
    .map((career) => calculateCareerMatch(student, career))
    .sort((left, right) => right.matchScore - left.matchScore || left.careerName.localeCompare(right.careerName))
    .slice(0, limit);
