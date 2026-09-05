export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type Proficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface SkillOption {
  id: string;
  name: string;
  category: string;
}

export interface InterestOption {
  id: string;
  name: string;
  category: string;
}

export interface ProfileRecord {
  id: string;
  userId: string;
  name: string;
  education: string;
  degreeBranch: string | null;
  experienceLevel: string;
  preferredDomains: string[];
  careerGoal: string | null;
  learningPreference: string | null;
  weeklyLearningHours: number | null;
}

export interface ProfileData {
  profile: ProfileRecord | null;
  skills: (SkillOption & { proficiency: Proficiency })[];
  interests: (InterestOption & { weight: number })[];
}

export type AssessmentAnswer = string[] | string | number;

export interface AssessmentQuestion {
  id: string;
  question: string;
  description: string;
  type: 'multiple' | 'single' | 'rating';
  options: { value: string; label: string }[];
  required: boolean;
  maxSelections?: number;
}

export interface AssessmentAnswers {
  technicalInterests: string[];
  workPreferences: string[];
  problemSolvingPreferences: string[];
  learningPreference: string[];
  careerGoal: string;
  confidenceLevel: number;
  workEnvironment: string[];
}

export interface AssessmentRecord {
  id: string;
  submittedAt: string;
  answers: AssessmentAnswers;
}

export interface CareerRecommendation {
  careerId: string;
  careerName: string;
  matchScore: number;
  explanation: string;
  matchedSkills: string[];
  missingSkills: string[];
  matchingInterests: string[];
  nextStep: string;
}

export interface SavedCareer {
  id: string;
  careerId: string;
  careerName: string;
  description: string;
  domain: string;
  savedAt: string;
  matchScore: CareerRecommendation | null;
}

export interface SkillGapItem {
  name: string;
  studentProficiency?: string;
  requiredProficiency: string;
  importance: 'REQUIRED' | 'PREFERRED';
}

export interface PrioritySkill extends SkillGapItem {
  priority: 'HIGH' | 'MEDIUM';
  reason: string;
}

export interface SkillGapResult {
  careerId: string;
  careerName: string;
  existingSkills: SkillGapItem[];
  missingSkills: SkillGapItem[];
  partialSkills: SkillGapItem[];
  totalRequiredSkills: number;
  matchedSkillCount: number;
  missingSkillCount: number;
  skillCoverage: number;
  prioritySkills: PrioritySkill[];
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

export interface CareerGuideResult {
  career: { id: string; name: string; domain: string; description: string };
  match: CareerRecommendation;
  skillGap: SkillGapResult;
  roadmap: { careerId: string; careerName: string; personalizedFor: string; stages: RoadmapStage[] };
  resources: { id: string; title: string; type: string; url: string | null; provider: string; level: string; relevance: string | null }[];
  projects: { id: string; title: string; description: string; difficulty: string; skills: string[]; expectedOutcome: string }[];
  summary: string;
  agentStatus: 'completed';
}

export interface AssistantResponse {
  conversationId: string;
  message: { role: 'assistant'; content: string };
  agentStatus: 'completed' | 'failed';
  intent: string;
  toolsUsed: { name: string; status: 'success' | 'failed' }[];
  context?: { careerId?: string; careerName?: string };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { message: string };
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok) {
    throw new ApiError(payload?.error?.message || 'Something went wrong', response.status);
  }

  return payload?.data as T;
};

export const authApi = {
  register: (input: { name: string; email: string; password: string }) =>
    request<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  login: (input: { email: string; password: string }) =>
    request<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  me: () => request<{ user: AuthUser }>('/auth/me'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
};

export const profileApi = {
  get: () => request<ProfileData>('/profile'),
  getOptions: () => request<{ skills: SkillOption[]; interests: InterestOption[] }>('/profile/options'),
  update: (input: {
    name: string;
    education: string;
    degreeBranch: string | null;
    experienceLevel: string;
    careerGoal: string | null;
    preferredDomains: string[];
    learningPreference: string | null;
    weeklyLearningHours: number | null;
    skills: { skillId: string; proficiency: Proficiency }[];
    interests: { interestId: string; weight: number }[];
  }) => request<ProfileData>('/profile', { method: 'PUT', body: JSON.stringify(input) }),
};

export const assessmentApi = {
  getQuestions: () => request<{ questions: AssessmentQuestion[] }>('/assessment/questions'),
  get: () => request<{ assessment: AssessmentRecord | null }>('/assessment'),
  create: (answers: AssessmentAnswers) => request<{ assessment: AssessmentRecord }>('/assessment', { method: 'POST', body: JSON.stringify({ answers }) }),
  update: (answers: AssessmentAnswers) => request<{ assessment: AssessmentRecord }>('/assessment', { method: 'PUT', body: JSON.stringify({ answers }) }),
};

export const careerApi = {
  recommendations: () => request<{ recommendations: CareerRecommendation[]; hasProfile: boolean; hasAssessment: boolean }>('/careers/recommendations'),
  skillGap: (careerId: string) => request<SkillGapResult>(`/careers/${careerId}/skill-gap`),
  save: (careerId: string) => request<SavedCareer>(`/careers/${careerId}/save`, { method: 'POST' }),
  unsave: (careerId: string) => request<{ message: string }>(`/careers/${careerId}/save`, { method: 'DELETE' }),
  saved: () => request<{ savedCareers: SavedCareer[] }>('/careers/saved'),
};

export const agentApi = {
  careerGuide: (careerId: string) => request<CareerGuideResult>('/agent/career-guide', { method: 'POST', body: JSON.stringify({ careerId }) }),
  chat: (input: { message: string; conversationId?: string }) => request<AssistantResponse>('/assistant/chat', { method: 'POST', body: JSON.stringify(input) }),
};
