import { AgentRunStatus, Prisma } from '@prisma/client';
import { config } from '../config';
import { createAiProvider } from '../ai';
import { assistantSystemPrompt } from '../ai/prompts';
import { AiProvider, AssistantMessage } from '../ai/types';
import { createAgentRun, finishAgentRun } from '../repositories/agentRepository';
import { getCareerRecommendations } from '../services/careerMatchingService';
import { getConversation, saveConversation } from './conversationMemory';
import { AssistantResponse, ToolExecution } from './assistantTypes';
import { createToolRegistry } from './toolRegistry';

const intentFor = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes('missing') || lower.includes('gap')) return 'SKILL_GAP';
  if (lower.includes('roadmap') || lower.includes('learning plan') || lower.includes('learn first') || lower.includes('what should i learn') || lower.includes('next step')) return 'ROADMAP';
  if (lower.includes('compare')) return 'CAREER_COMPARISON';
  if (lower.includes('resource') || lower.includes('course')) return 'LEARNING_RESOURCE';
  if (lower.includes('project')) return 'PROJECT_RECOMMENDATION';
  if (lower.includes('why')) return 'CAREER_EXPLANATION';
  if (/^what\s+(is|are)\b/.test(lower)) return 'GENERAL_KNOWLEDGE';
  return 'GENERAL_CAREER_GUIDANCE';
};

const fallback = async (userId: string, message: string) => {
  const intent = intentFor(message);
  if (intent === 'GENERAL_CAREER_GUIDANCE' || intent === 'CAREER_EXPLANATION') {
    const result = await getCareerRecommendations(userId);
    if (!result.hasProfile || !result.hasAssessment) return 'Gemini is temporarily unavailable, and I need your completed profile and assessment to give a grounded career recommendation.';
    const top = result.recommendations[0];
    if (!top) return 'Gemini is temporarily unavailable, and I could not find a matching career in the current catalog.';
    return intent === 'CAREER_EXPLANATION'
      ? `${top.careerName} is currently the strongest deterministic match at ${top.matchScore}/100. ${top.explanation} Next step: ${top.nextStep}.`
      : `${top.careerName} is currently the strongest deterministic match at ${top.matchScore}/100. ${top.explanation}`;
  }

  const recommendations = await getCareerRecommendations(userId);
  const top = recommendations.recommendations[0];
  if (!top) return 'Gemini is temporarily unavailable, and there is not enough career data to answer this question yet.';
  const registry = createToolRegistry(userId);

  if (intent === 'SKILL_GAP') {
    const gap = await registry.execute('get_skill_gap', { careerId: top.careerId }) as { existingSkills: { name: string }[]; partialSkills: { name: string; studentProficiency?: string; requiredProficiency: string }[]; missingSkills: { name: string }[]; careerName: string };
    return `For ${gap.careerName}, you currently meet: ${gap.existingSkills.map((skill) => skill.name).join(', ') || 'none'}. Partial skills: ${gap.partialSkills.map((skill) => `${skill.name} (${skill.studentProficiency} -> ${skill.requiredProficiency})`).join(', ') || 'none'}. Missing skills: ${gap.missingSkills.map((skill) => skill.name).join(', ') || 'none'}.`;
  }

  if (intent === 'ROADMAP') {
    const roadmap = await registry.execute('get_roadmap', { careerId: top.careerId }) as { careerName: string; stages: { title: string; skills: string[] }[] };
    const firstStage = roadmap.stages[0];
    return `For ${roadmap.careerName}, start with ${firstStage?.title || 'the first roadmap stage'}${firstStage?.skills.length ? `, focusing on ${firstStage.skills.join(', ')}` : ''}. The deterministic roadmap contains ${roadmap.stages.length} stages.`;
  }

  if (intent === 'PROJECT_RECOMMENDATION' || intent === 'LEARNING_RESOURCE') {
    const toolName = intent === 'PROJECT_RECOMMENDATION' ? 'get_projects' : 'get_resources';
    const items = await registry.execute(toolName, { careerId: top.careerId }) as { title: string }[];
    return `${intent === 'PROJECT_RECOMMENDATION' ? 'Projects' : 'Resources'} for ${top.careerName}: ${items.map((item) => item.title).join('; ') || 'none are currently recorded in the catalog.'}`;
  }

  return 'Gemini is temporarily unavailable, so I cannot safely interpret this question. Please try again shortly.';
};

export const runCareerAssistant = async (userId: string, message: string, conversationId?: string, providerOverride?: AiProvider | null): Promise<AssistantResponse> => {
  const conversation = getConversation(userId, conversationId);
  const history: AssistantMessage[] = [...conversation.messages, { role: 'user', content: message }];
  const toolRegistry = createToolRegistry(userId);
  const toolsUsed: ToolExecution[] = [];
  const run = await createAgentRun(userId, 'Conversational career assistant');
  const provider = providerOverride === undefined ? createAiProvider() : providerOverride;
  let answer: string | undefined;
  let context: AssistantResponse['context'];
  let providerFailed = false;
  let fallbackUsed = false;

  try {
    if (provider) {
      try {
        console.info('[CareerAssistant] Provider: Gemini', { model: config.GEMINI_MODEL, intent: intentFor(message) });
        for (let step = 0; step < config.AI_MAX_AGENT_STEPS && !answer; step += 1) {
          const generated = await provider.generate({ systemInstruction: assistantSystemPrompt, messages: history, tools: toolRegistry.declarations });
          if (generated.text && generated.toolCalls.length === 0) {
            answer = generated.text;
            break;
          }
          if (!generated.toolCalls.length) break;

          history.push({ role: 'assistant', content: generated.text || '', toolCalls: generated.toolCalls });
          const toolResults = [];
          for (const call of generated.toolCalls) {
            try {
              const result = await toolRegistry.execute(call.name, call.arguments);
              toolsUsed.push({ name: call.name, status: 'success' });
              toolResults.push({ id: call.id, name: call.name, result });
              if (typeof result === 'object' && result && 'careerId' in result && 'careerName' in result) context = { careerId: String(result.careerId), careerName: String(result.careerName) };
              console.info('[CareerAssistant] Tool executed', { name: call.name, status: 'success' });
            } catch (error) {
              toolsUsed.push({ name: call.name, status: 'failed' });
              toolResults.push({ id: call.id, name: call.name, error: error instanceof Error ? error.message : 'Tool execution failed' });
              console.info('[CareerAssistant] Tool executed', { name: call.name, status: 'failed' });
            }
          }
          history.push({ role: 'user', content: '', toolResults });
        }
      } catch (error) {
        providerFailed = true;
        console.info('[CareerAssistant] Gemini request failed', { error: error instanceof Error ? error.message : 'Unknown provider error' });
      }
    }

    if (!answer) {
      fallbackUsed = true;
      console.info('[CareerAssistant] Using deterministic fallback', { reason: provider ? (providerFailed ? 'provider_failure' : 'unusable_provider_output') : 'provider_unavailable' });
      answer = await fallback(userId, message);
    }
    const finalMessages = [...conversation.messages, { role: 'user' as const, content: message }, { role: 'assistant' as const, content: answer }];
    saveConversation(conversation.key, finalMessages);
    console.info('[CareerAssistant] Final response generated', { fallbackUsed, toolCount: toolsUsed.length, messageLength: answer.length });
    await finishAgentRun(run.id, { status: AgentRunStatus.SUCCESS, toolExecutionLog: toolsUsed as unknown as Prisma.InputJsonValue, resultSummary: answer });
    return { conversationId: conversation.id, message: { role: 'assistant', content: answer }, agentStatus: 'completed', intent: intentFor(message), toolsUsed, context };
  } catch (error) {
    await finishAgentRun(run.id, { status: AgentRunStatus.FAILED, toolExecutionLog: toolsUsed as unknown as Prisma.InputJsonValue, errorMessage: error instanceof Error ? error.message : 'Assistant failed' });
    throw error;
  }
};