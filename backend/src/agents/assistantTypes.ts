export interface ToolExecution {
  name: string;
  status: 'success' | 'failed';
}

export interface AssistantResponse {
  conversationId: string;
  message: { role: 'assistant'; content: string };
  agentStatus: 'completed' | 'failed';
  intent: string;
  toolsUsed: ToolExecution[];
  context?: { careerId?: string; careerName?: string };
}