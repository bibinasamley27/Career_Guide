import { CareerMatch } from '../services/careerMatching';
import { SkillGapResult } from '../services/skillGap';
import { RoadmapResult } from '../tools/roadmapTool';

export type AgentStep = 'profile' | 'career-matching' | 'skill-gap' | 'roadmap' | 'resources-projects' | 'evaluation';

export interface AgentExecutionLog {
  step: AgentStep;
  status: 'completed' | 'failed';
}

export interface CareerGuideResult {
  career: { id: string; name: string; domain: string; description: string };
  match: CareerMatch;
  skillGap: SkillGapResult;
  roadmap: RoadmapResult;
  resources: {
    id: string;
    title: string;
    type: string;
    url: string | null;
    provider: string;
    level: string;
    relevance: string | null;
  }[];
  projects: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    skills: string[];
    expectedOutcome: string;
  }[];
  summary: string;
  agentStatus: 'completed';
}
