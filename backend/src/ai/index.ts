import { AiProvider } from './types';
import { GeminiProvider } from './geminiProvider';

export const createAiProvider = (): AiProvider | null => {
  try {
    return new GeminiProvider();
  } catch (error) {
    console.info('[CareerAssistant] Gemini provider unavailable', { reason: error instanceof Error ? error.message : 'provider_initialization_failed' });
    return null;
  }
};

export * from './types';