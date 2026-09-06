import { GoogleGenAI } from '@google/genai';
import { describe, expect, it, vi } from 'vitest';
import { GeminiProvider } from './ai/geminiProvider';

describe('GeminiProvider', () => {
  it('sends the current message and structured tool results to Gemini', async () => {
    const generateContent = vi.fn().mockResolvedValue({
      candidates: [{ content: { parts: [{ text: 'Build the roadmap in three stages.' }] } }],
    });
    const client = { models: { generateContent } } as unknown as GoogleGenAI;
    const provider = new GeminiProvider('test-key', client);

    const result = await provider.generate({
      systemInstruction: 'You are a career assistant.',
      messages: [
        { role: 'user', content: 'Create a learning plan for me.' },
        { role: 'assistant', content: '', toolCalls: [{ id: 'call-1', name: 'get_roadmap', arguments: { careerId: 'career-1' } }] },
        { role: 'user', content: '', toolResults: [{ id: 'call-1', name: 'get_roadmap', result: { stages: [' foundations', ' projects'] } }] },
      ],
      tools: [{ name: 'get_roadmap', description: 'Build a roadmap.', parameters: { type: 'object' } }],
    });

    expect(result.text).toBe('Build the roadmap in three stages.');
    const request = generateContent.mock.calls[0][0];
    expect(request.contents[0]).toEqual({ role: 'user', parts: [{ text: 'Create a learning plan for me.' }] });
    expect(request.contents[1].parts[0].functionCall).toEqual({ id: 'call-1', name: 'get_roadmap', args: { careerId: 'career-1' } });
    expect(request.contents[2].parts[0].functionResponse).toEqual({
      id: 'call-1',
      name: 'get_roadmap',
      response: { output: { stages: [' foundations', ' projects'] } },
    });
  });

  it('returns Gemini function calls for the agent to execute', async () => {
    const client = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          candidates: [{ content: { parts: [{ functionCall: { id: 'call-2', name: 'get_career_recommendations', args: {} } }] } }],
        }),
      },
    } as unknown as GoogleGenAI;
    const provider = new GeminiProvider('test-key', client);

    const result = await provider.generate({ systemInstruction: 'Use tools.', messages: [{ role: 'user', content: 'Which profession suits me?' }], tools: [] });

    expect(result.toolCalls).toEqual([{ id: 'call-2', name: 'get_career_recommendations', arguments: {} }]);
    expect(result.text).toBeUndefined();
  });
});