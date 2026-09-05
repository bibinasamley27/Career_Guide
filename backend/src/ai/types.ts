export type AssistantRole = 'user' | 'assistant';

export interface AssistantMessage {
  role: AssistantRole;
  content: string;
}

export interface AiToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AiToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AiGenerationResult {
  text?: string;
  toolCalls: AiToolCall[];
}

export interface AiProvider {
  generate(input: {
    systemInstruction: string;
    messages: AssistantMessage[];
    tools: AiToolDeclaration[];
  }): Promise<AiGenerationResult>;
}