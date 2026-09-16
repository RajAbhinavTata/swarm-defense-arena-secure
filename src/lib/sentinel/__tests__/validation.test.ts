import { describe, expect, it } from 'vitest';
import { assertGameId, assertScreenshotFilename, parseStartRequest, ValidationError } from '../validation';

describe('start request validation', () => {
  it('normalizes a valid request', () => {
    expect(parseStartRequest({ targetUrl: ' https://example.com ', customTask: ' Read the policy ' })).toMatchObject({
      scenarioId: 'live-web',
      targetUrl: 'https://example.com',
      customTask: 'Read the policy',
      difficulty: 'easy',
    });
  });

  it.each([
    { difficulty: 'nightmare' },
    { taskAgentType: 'shell' },
    { redTeamType: 'unbounded' },
    { customTask: 42 },
  ])('rejects malformed input %#', (input) => {
    expect(() => parseStartRequest(input)).toThrow(ValidationError);
  });

  it('validates artifact identifiers', () => {
    expect(assertGameId('Abc_1234-test')).toBe('Abc_1234-test');
    expect(() => assertGameId('../secrets')).toThrow(ValidationError);
    expect(assertScreenshotFilename('step-01-003-post-action.png')).toContain('post-action');
    expect(() => assertScreenshotFilename('../../x.png')).toThrow(ValidationError);
  });
});
