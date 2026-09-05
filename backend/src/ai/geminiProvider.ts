import { GoogleGenAI } from '@google/genai';
import { config } from '../config';
import { AiProvider, AiToolDeclaration, AssistantMessage, AiGenerationResult } from './types';

const toGeminiTools = (tools: AiToolDeclaration[]) => [{ functionDeclarations: tools }];

export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenAI;

  constructor(apiKey = config.GEMINI_API_KEY) {
    if (!apiKey) throw new Error('Gemini is not configured');
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(input: { systemInstruction: string; messages: AssistantMessage[]; tools: AiToolDeclaration[] }): Promise<AiGenerationResult> {
    const response = await Promise.race([
      this.client.models.generateContent({
        model: config.GEMINI_MODEL,
        contents: input.messages.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] })),
        config: {
          systemInstruction: input.systemInstruction,
          tools: toGeminiTools(input.tools),
        },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Gemini request timed out')), config.AI_REQUEST_TIMEOUT_MS)),
    ]);

    const parts = response.candidates?.[0]?.content?.parts || [];
    const toolCalls = parts.flatMap((part) => part.functionCall ? [{ name: part.functionCall.name || '', arguments: (part.functionCall.args || {}) as Record<string, unknown> }] : []);
    const text = parts.filter((part) => part.text).map((part) => part.text).join('\n').trim();
    return { text: text || undefined, toolCalls };
  }
}