import { describe, expect, it } from 'vitest';
import { assistantIntents } from './ai/types';
import { createToolRegistry } from './agents/toolRegistry';
import { intentDataset } from './intentDataset';

describe('natural-language intent dataset', () => {
  it('contains at least 100 realistic cases across every supported intent', () => {
    expect(intentDataset.length).toBeGreaterThanOrEqual(100);
    const covered = new Set(intentDataset.flatMap((item) => Array.isArray(item.expectedIntent) ? item.expectedIntent : [item.expectedIntent]));
    for (const intent of assistantIntents) expect(covered).toContain(intent);
  });

  it('defines routing expectations without hardcoded answer text', () => {
    for (const item of intentDataset) {
      expect(item.input.trim().length).toBeGreaterThan(0);
      expect(item.expectedBehavior.trim().length).toBeGreaterThan(0);
      expect(Array.isArray(item.expectedTools)).toBe(true);
      expect(item).not.toHaveProperty('expectedAnswer');
    }
  });

  it('references only tools exposed by the authenticated registry', () => {
    const declaredTools = new Set(createToolRegistry('00000000-0000-0000-0000-000000000000').declarations.map((tool) => tool.name));
    for (const item of intentDataset) {
      for (const tool of item.expectedTools) expect(declaredTools).toContain(tool);
    }
  });
});
