export type AssistantRole = 'user' | 'assistant';

export const assistantIntents = [
  'CAREER_DISCOVERY',
  'CAREER_EXPLANATION',
  'SKILL_GAP',
  'ROADMAP',
  'LEARNING_RESOURCE',
  'PROJECT_RECOMMENDATION',
  'PROFILE_GUIDANCE',
  'ASSESSMENT_GUIDANCE',
  'SAVED_CAREERS',
  'CAREER_COMPARISON',
  'GENERAL_CAREER_GUIDANCE',
  'APP_HELP',
  'GENERAL_KNOWLEDGE',
  'FOLLOW_UP',
  'UNSUPPORTED',
] as const;

export type AssistantIntent = typeof assistantIntents[number];

export interface AssistantMessage {
  role: AssistantRole;
  content: string;
  toolCalls?: AiToolCall[];
  toolResults?: AiToolResult[];
}

export interface AiToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AiToolCall {
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AiToolResult {
  id?: string;
  name: string;
  result?: unknown;
  error?: string;
}

export interface AiGenerationResult {
  text?: string;
  toolCalls: AiToolCall[];
  intent?: AssistantIntent;
}

export interface AiProvider {
  generate(input: {
    systemInstruction: string;
    messages: AssistantMessage[];
    tools: AiToolDeclaration[];
  }): Promise<AiGenerationResult>;
}