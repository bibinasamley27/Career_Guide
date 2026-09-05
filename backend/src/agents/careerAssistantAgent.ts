import { AgentRunStatus, Prisma } from '@prisma/client';
import { config } from '../config';
import { createAiProvider } from '../ai';
import { assistantSystemPrompt } from '../ai/prompts';
import { AssistantMessage } from '../ai/types';
import { createAgentRun, finishAgentRun } from '../repositories/agentRepository';
import { getCareerRecommendations } from '../services/careerMatchingService';
import { getConversation, saveConversation } from './conversationMemory';
import { AssistantResponse, ToolExecution } from './assistantTypes';
import { createToolRegistry } from './toolRegistry';

const intentFor = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes('missing') || lower.includes('gap')) return 'SKILL_GAP';
  if (lower.includes('roadmap') || lower.includes('learn') || lower.includes('next')) return 'ROADMAP';
  if (lower.includes('compare')) return 'CAREER_COMPARISON';
  if (lower.includes('resource') || lower.includes('course')) return 'LEARNING_RESOURCE';
  if (lower.includes('project')) return 'PROJECT_RECOMMENDATION';
  if (lower.includes('why')) return 'CAREER_EXPLANATION';
  return 'GENERAL_CAREER_GUIDANCE';
};

const fallback = async (userId: string, message: string) => {
  const result = await getCareerRecommendations(userId);
  if (!result.hasProfile || !result.hasAssessment) return 'I need a little more information to give you an accurate recommendation. Complete your profile and assessment, then I can personalize your career guidance.';
  const top = result.recommendations[0];
  if (!top) return 'I could not find a matching career in the current career catalog.';
  if (message.toLowerCase().includes('why')) return `${top.careerName} is currently your strongest deterministic match at ${top.matchScore}/100. ${top.explanation} Your next step is to ${top.nextStep.toLowerCase()}.`;
  return `${top.careerName} is currently your strongest direction at ${top.matchScore}/100. ${top.explanation} Your next step is to ${top.nextStep.toLowerCase()}. I can also inspect its skill gaps and roadmap.`;
};

export const runCareerAssistant = async (userId: string, message: string, conversationId?: string): Promise<AssistantResponse> => {
  const conversation = getConversation(userId, conversationId);
  const history: AssistantMessage[] = [...conversation.messages, { role: 'user', content: message }];
  const toolRegistry = createToolRegistry(userId);
  const toolsUsed: ToolExecution[] = [];
  const run = await createAgentRun(userId, 'Conversational career assistant');
  const provider = createAiProvider();
  let answer: string | undefined;
  let context: AssistantResponse['context'];

  try {
    if (provider) {
      for (let step = 0; step < config.AI_MAX_AGENT_STEPS && !answer; step += 1) {
        const generated = await provider.generate({ systemInstruction: assistantSystemPrompt, messages: history, tools: toolRegistry.declarations });
        if (generated.text && generated.toolCalls.length === 0) {
          answer = generated.text;
          break;
        }
        if (!generated.toolCalls.length) break;
        for (const call of generated.toolCalls) {
          try {
            const result = await toolRegistry.execute(call.name, call.arguments);
            toolsUsed.push({ name: call.name, status: 'success' });
            const serialized = JSON.stringify(result);
            history.push({ role: 'assistant', content: `Tool selected: ${call.name}` }, { role: 'user', content: `Tool result for ${call.name}: ${serialized.slice(0, 12000)}` });
            if (typeof result === 'object' && result && 'careerId' in result && 'careerName' in result) context = { careerId: String(result.careerId), careerName: String(result.careerName) };
          } catch {
            toolsUsed.push({ name: call.name, status: 'failed' });
            history.push({ role: 'user', content: `Tool ${call.name} was unavailable. Continue without inventing its result.` });
          }
        }
      }
    }

    if (!answer) answer = await fallback(userId, message);
    const finalMessages = [...conversation.messages, { role: 'user' as const, content: message }, { role: 'assistant' as const, content: answer }];
    saveConversation(conversation.key, finalMessages);
    await finishAgentRun(run.id, { status: AgentRunStatus.SUCCESS, toolExecutionLog: toolsUsed as unknown as Prisma.InputJsonValue, resultSummary: answer });
    return { conversationId: conversation.id, message: { role: 'assistant', content: answer }, agentStatus: 'completed', intent: intentFor(message), toolsUsed, context };
  } catch (error) {
    await finishAgentRun(run.id, { status: AgentRunStatus.FAILED, toolExecutionLog: toolsUsed as unknown as Prisma.InputJsonValue, errorMessage: error instanceof Error ? error.message : 'Assistant failed' });
    throw error;
  }
};