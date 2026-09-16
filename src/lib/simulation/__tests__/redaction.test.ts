import { describe, expect, it } from 'vitest';
import { redactActionValue, redactSensitiveText } from '../redaction';

describe('trace redaction', () => {
  it('removes common secret forms', () => {
    expect(redactSensitiveText('token=super-secret-value')).toBe('[REDACTED]');
    expect(redactSensitiveText('use sk-abcdefghijklmnop')).not.toContain('abcdefghijklmnop');
  });

  it('never persists password input values', () => {
    expect(redactActionValue('hunter2', 'password')).toBe('[REDACTED 7 chars]');
  });
});
