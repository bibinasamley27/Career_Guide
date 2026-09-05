import { AiProvider } from './types';
import { GeminiProvider } from './geminiProvider';

export const createAiProvider = (): AiProvider | null => {
  try {
    return new GeminiProvider();
  } catch {
    return null;
  }
};

export * from './types';